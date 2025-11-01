/**
 * Serviço de Sincronização Offline
 * 
 * Gerencia operações offline, detecta conectividade e sincroniza
 * automaticamente quando a conexão é restaurada.
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { store } from '../store';
import {
  setOnlineStatus,
  adicionarOperacaoPendente,
  removerOperacaoPendente,
  incrementarTentativas,
  atualizarUltimaSync,
} from '../store/slices/sincronizacaoSlice';
import { OperacaoPendente, OPERACAO_TIPO } from '../types';
import { supabase } from './SupabaseService';
import {
  transformComandaToDB,
  transformItemComandaToDB,
  transformMesaToDB,
} from '../types/transformers';

class SincronizacaoService {
  private syncInterval: NodeJS.Timeout | null = null;
  private connectivityUnsubscribe: (() => void) | null = null;
  private isSyncing = false;

  /**
   * Inicializa o serviço de sincronização
   */
  async inicializar(): Promise<void> {
    console.log('[Sync] Inicializando serviço de sincronização...');

    // Verificar conectividade inicial
    await this.verificarConectividade();

    // Monitorar mudanças de conectividade
    this.monitorarConectividade();

    // Iniciar sincronização automática
    this.iniciarSyncAutomatico();

    console.log('[Sync] Serviço inicializado');
  }

  /**
   * Finaliza o serviço de sincronização
   */
  finalizar(): void {
    console.log('[Sync] Finalizando serviço de sincronização...');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.connectivityUnsubscribe) {
      this.connectivityUnsubscribe();
      this.connectivityUnsubscribe = null;
    }

    console.log('[Sync] Serviço finalizado');
  }

  /**
   * Verifica conectividade atual
   */
  async verificarConectividade(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      const isOnline = state.isConnected ?? false;

      store.dispatch(setOnlineStatus(isOnline));

      console.log('[Sync] Conectividade:', isOnline ? 'Online' : 'Offline');

      return isOnline;
    } catch (error) {
      console.error('[Sync] Erro ao verificar conectividade:', error);
      store.dispatch(setOnlineStatus(false));
      return false;
    }
  }

  /**
   * Monitora mudanças de conectividade
   */
  private monitorarConectividade(): void {
    this.connectivityUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected ?? false;
      const wasOnline = store.getState().sincronizacao.isOnline;

      console.log('[Sync] Mudança de conectividade:', isOnline ? 'Online' : 'Offline');

      store.dispatch(setOnlineStatus(isOnline));

      // Se voltou online, processar fila
      if (isOnline && !wasOnline) {
        console.log('[Sync] Conexão restaurada, processando fila...');
        this.processarFila();
      }
    });
  }

  /**
   * Inicia sincronização automática periódica
   */
  private iniciarSyncAutomatico(): void {
    // Sincronizar a cada 30 segundos
    this.syncInterval = setInterval(() => {
      const { isOnline, pendingOperations } = store.getState().sincronizacao;

      if (isOnline && pendingOperations.length > 0 && !this.isSyncing) {
        console.log('[Sync] Sincronização automática...');
        this.processarFila();
      }
    }, 30000); // 30 segundos
  }

  /**
   * Adiciona operação à fila offline
   */
  adicionarOperacao(operacao: Omit<OperacaoPendente, 'id' | 'timestamp' | 'tentativas'>): void {
    const operacaoCompleta: OperacaoPendente = {
      id: this.gerarId(),
      timestamp: new Date().toISOString(),
      tentativas: 0,
      maxTentativas: 3,
      ...operacao,
    };

    console.log('[Sync] Adicionando operação à fila:', operacaoCompleta.tipo);

    store.dispatch(adicionarOperacaoPendente(operacaoCompleta));

    // Se estiver online, tentar processar imediatamente
    const { isOnline } = store.getState().sincronizacao;
    if (isOnline) {
      this.processarFila();
    }
  }

  /**
   * Processa fila de operações pendentes
   */
  async processarFila(): Promise<void> {
    if (this.isSyncing) {
      console.log('[Sync] Sincronização já em andamento, aguardando...');
      return;
    }

    const { isOnline, pendingOperations } = store.getState().sincronizacao;

    if (!isOnline) {
      console.log('[Sync] Offline, não é possível sincronizar');
      return;
    }

    if (pendingOperations.length === 0) {
      console.log('[Sync] Nenhuma operação pendente');
      return;
    }

    this.isSyncing = true;
    console.log('[Sync] Processando', pendingOperations.length, 'operações...');

    for (const operacao of pendingOperations) {
      try {
        // Verificar se atingiu o máximo de tentativas
        if (operacao.tentativas >= operacao.maxTentativas) {
          console.warn('[Sync] Operação atingiu máximo de tentativas:', operacao.id);
          store.dispatch(removerOperacaoPendente(operacao.id));
          continue;
        }

        // Incrementar tentativas
        store.dispatch(incrementarTentativas(operacao.id));

        // Processar operação
        await this.processarOperacao(operacao);

        // Remover da fila se sucesso
        store.dispatch(removerOperacaoPendente(operacao.id));

        console.log('[Sync] Operação processada com sucesso:', operacao.tipo);

        // Aguardar um pouco entre operações
        await this.aguardar(500);
      } catch (error: any) {
        console.error('[Sync] Erro ao processar operação:', error.message);

        // Se for erro de rede, parar processamento
        if (this.isNetworkError(error)) {
          console.log('[Sync] Erro de rede detectado, parando sincronização');
          break;
        }

        // Aguardar com backoff exponencial antes da próxima tentativa
        const backoffTime = this.calcularBackoff(operacao.tentativas);
        await this.aguardar(backoffTime);
      }
    }

    this.isSyncing = false;
    store.dispatch(atualizarUltimaSync());

    console.log('[Sync] Sincronização concluída');
  }

  /**
   * Processa uma operação específica
   */
  private async processarOperacao(operacao: OperacaoPendente): Promise<void> {
    console.log('[Sync] Processando operação:', operacao.tipo, operacao.id);

    switch (operacao.tipo) {
      case OPERACAO_TIPO.CRIAR_COMANDA:
        await this.processarCriarComanda(operacao.dados);
        break;

      case OPERACAO_TIPO.ADICIONAR_ITEM:
        await this.processarAdicionarItem(operacao.dados);
        break;

      case OPERACAO_TIPO.ATUALIZAR_ITEM:
        await this.processarAtualizarItem(operacao.dados);
        break;

      case OPERACAO_TIPO.FECHAR_COMANDA:
        await this.processarFecharComanda(operacao.dados);
        break;

      case OPERACAO_TIPO.ATUALIZAR_MESA:
        await this.processarAtualizarMesa(operacao.dados);
        break;

      default:
        throw new Error(`Tipo de operação desconhecido: ${operacao.tipo}`);
    }
  }

  /**
   * Processa criação de comanda
   */
  private async processarCriarComanda(dados: any): Promise<void> {
    const { error } = await supabase
      .from('comandas')
      .insert(transformComandaToDB(dados))
      .select()
      .single();

    if (error) throw error;
  }

  /**
   * Processa adição de item à comanda
   */
  private async processarAdicionarItem(dados: any): Promise<void> {
    // Buscar preço atual do item
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('price')
      .eq('id', dados.menu_item_id)
      .single();

    if (menuError) throw menuError;

    const itemData = {
      ...dados,
      price: menuItem.price,
    };

    const { error } = await supabase
      .from('comanda_items')
      .insert(transformItemComandaToDB(itemData))
      .select()
      .single();

    if (error) throw error;
  }

  /**
   * Processa atualização de status de item
   */
  private async processarAtualizarItem(dados: any): Promise<void> {
    const { error } = await supabase
      .from('comanda_items')
      .update(dados.updates)
      .eq('id', dados.itemId);

    if (error) throw error;
  }

  /**
   * Processa fechamento de comanda
   */
  private async processarFecharComanda(dados: any): Promise<void> {
    const { error } = await supabase
      .from('comandas')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        payment_method: dados.payment_method,
      })
      .eq('id', dados.comandaId);

    if (error) throw error;
  }

  /**
   * Processa atualização de mesa
   */
  private async processarAtualizarMesa(dados: any): Promise<void> {
    const { error } = await supabase
      .from('bar_tables')
      .update(transformMesaToDB(dados))
      .eq('id', dados.id);

    if (error) throw error;
  }

  /**
   * Verifica se é erro de rede
   */
  private isNetworkError(error: any): boolean {
    return (
      error.message?.includes('network') ||
      error.message?.includes('fetch') ||
      error.message?.includes('timeout') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT'
    );
  }

  /**
   * Calcula tempo de backoff exponencial
   */
  private calcularBackoff(tentativas: number): number {
    // Backoff exponencial: 1s, 2s, 4s, 8s, etc.
    const baseTime = 1000; // 1 segundo
    return Math.min(baseTime * Math.pow(2, tentativas), 30000); // Máximo 30 segundos
  }

  /**
   * Aguarda um tempo específico
   */
  private aguardar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gera ID único
   */
  private gerarId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Força sincronização imediata
   */
  async sincronizarAgora(): Promise<void> {
    console.log('[Sync] Sincronização manual iniciada');
    await this.verificarConectividade();
    await this.processarFila();
  }

  /**
   * Limpa fila de operações pendentes
   */
  limparFila(): void {
    console.log('[Sync] Limpando fila de operações');
    const { pendingOperations } = store.getState().sincronizacao;
    pendingOperations.forEach((op) => {
      store.dispatch(removerOperacaoPendente(op.id));
    });
  }

  /**
   * Retorna status de sincronização
   */
  getStatus() {
    const { isOnline, isSyncing, pendingOperations, lastSyncTime } =
      store.getState().sincronizacao;

    return {
      isOnline,
      isSyncing,
      pendingCount: pendingOperations.length,
      lastSyncTime,
      hasPendingOperations: pendingOperations.length > 0,
    };
  }
}

// Exportar instância singleton
export const sincronizacaoService = new SincronizacaoService();
export default sincronizacaoService;
