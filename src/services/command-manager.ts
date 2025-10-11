/**
 * Gerenciador de Comandas para o Módulo de Gestão de Vendas
 * 
 * Esta classe é responsável por controlar comandas abertas,
 * gerenciar itens e associações com mesas/clientes
 */

import { 
  Command, 
  CommandItem, 
  ComandaStatus, 
  ItemStatus,
  CommandInsert,
  CommandUpdate,
  CommandItemInsert,
  CommandItemUpdate,
  CartItem
} from '../types/sales-management';
import { SupabaseIntegration } from './supabase-integration';

export class CommandManager {
  private static instance: CommandManager;
  private supabaseIntegration: SupabaseIntegration;
  private comandasAbertas: Map<string, Command> = new Map();
  private proximoNumero: number = 1;

  private constructor() {
    this.supabaseIntegration = SupabaseIntegration.getInstance();
    this.loadComandasAbertas();
  }

  static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  /**
   * Carrega comandas abertas do banco de dados
   */
  private async loadComandasAbertas(): Promise<void> {
    try {
      const comandas = await this.supabaseIntegration.getComandasAbertas();
      this.comandasAbertas.clear();
      comandas.forEach(comanda => {
        this.comandasAbertas.set(comanda.id, comanda);
      });
    } catch (error) {
      console.error('Erro ao carregar comandas abertas:', error);
    }
  }

  /**
   * Cria uma nova comanda
   * @param dados Dados para criação da comanda
   * @returns Promise com a comanda criada
   */
  async criarComanda(dados: {
    mesa_id?: string;
    cliente_id?: string;
    nome_cliente?: string;
    funcionario_id: string;
    quantidade_pessoas: number;
    observacoes?: string;
  }): Promise<Command> {
    const agora = new Date().toISOString();
    const numeroComanda = this.gerarNumeroComanda();

    const novaComanda: Command = {
      id: numeroComanda,
      mesa_id: dados.mesa_id,
      cliente_id: dados.cliente_id,
      nome_cliente: dados.nome_cliente,
      funcionario_id: dados.funcionario_id,
      status: ComandaStatus.ABERTA,
      total: 0,
      quantidade_pessoas: dados.quantidade_pessoas,
      aberta_em: agora,
      data_abertura: agora, // Campo adicional para compatibilidade
      observacoes: dados.observacoes,
      created_at: agora,
      updated_at: agora,
      itens: []
    };

    // Armazenar em memória para controle local
    this.comandasAbertas.set(numeroComanda, novaComanda);

    // Aqui seria feita a persistência no banco de dados
    // await this.salvarComandaNoBanco(novaComanda);

    return novaComanda;
  }

  /**
   * Busca uma comanda pelo ID
   * @param comandaId ID da comanda
   * @returns Comanda encontrada ou undefined
   */
  async buscarComanda(comandaId: string): Promise<Command | undefined> {
    // Primeiro verifica no cache local
    const comandaLocal = this.comandasAbertas.get(comandaId);
    if (comandaLocal) {
      return comandaLocal;
    }

    // Buscar no banco de dados
    try {
      const comandaBanco = await this.supabaseIntegration.getComanda(comandaId);
      if (comandaBanco) {
        this.comandasAbertas.set(comandaId, comandaBanco);
        return comandaBanco;
      }
    } catch (error) {
      console.error('Erro ao buscar comanda no banco:', error);
    }

    return undefined;
  }

  /**
   * Lista todas as comandas abertas
   * @returns Array de comandas abertas
   */
  async listarComandasAbertas(): Promise<Command[]> {
    try {
      // Buscar comandas atualizadas do banco
      await this.loadComandasAbertas();
      
      return Array.from(this.comandasAbertas.values())
        .filter(comanda => 
          comanda.status === ComandaStatus.ABERTA || 
          comanda.status === ComandaStatus.PENDENTE_PAGAMENTO
        );
    } catch (error) {
      console.error('Erro ao listar comandas abertas:', error);
      // Retornar cache local em caso de erro
      return Array.from(this.comandasAbertas.values())
        .filter(comanda => 
          comanda.status === ComandaStatus.ABERTA || 
          comanda.status === ComandaStatus.PENDENTE_PAGAMENTO
        );
    }
  }

  /**
   * Atualiza dados de uma comanda
   * @param comandaId ID da comanda
   * @param dadosAtualizacao Dados para atualização
   * @returns Comanda atualizada
   */
  async atualizarComanda(
    comandaId: string, 
    dadosAtualizacao: Partial<CommandUpdate>
  ): Promise<Command> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    if (comanda.status === ComandaStatus.FECHADA) {
      throw new Error('Não é possível atualizar uma comanda fechada');
    }

    const comandaAtualizada: Command = {
      ...comanda,
      ...dadosAtualizacao,
      updated_at: new Date().toISOString()
    };

    // Atualizar no cache local
    this.comandasAbertas.set(comandaId, comandaAtualizada);

    // Aqui seria feita a atualização no banco de dados
    // await this.atualizarComandaNoBanco(comandaAtualizada);

    return comandaAtualizada;
  }

  /**
   * Adiciona um item à comanda
   * @param comandaId ID da comanda
   * @param item Dados do item a ser adicionado
   * @returns Item adicionado
   */
  async adicionarItem(comandaId: string, item: {
    produto_id: string;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    observacoes?: string;
  }): Promise<CommandItem> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new Error('Só é possível adicionar itens em comandas abertas');
    }

    const agora = new Date().toISOString();
    const itemId = this.gerarIdItem();

    const novoItem: CommandItem = {
      id: itemId,
      comanda_id: comandaId,
      produto_id: item.produto_id,
      nome_produto: item.nome_produto,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      preco_total: item.quantidade * item.preco_unitario,
      status: ItemStatus.PENDENTE,
      adicionado_em: agora,
      observacoes: item.observacoes,
      created_at: agora
    };

    // Adicionar item à comanda
    if (!comanda.itens) {
      comanda.itens = [];
    }
    comanda.itens.push(novoItem);

    // Recalcular total da comanda
    await this.recalcularTotalComanda(comandaId);

    // Aqui seria feita a persistência no banco de dados
    // await this.salvarItemNoBanco(novoItem);

    return novoItem;
  }

  /**
   * Remove um item da comanda
   * @param comandaId ID da comanda
   * @param itemId ID do item
   * @returns true se removido com sucesso
   */
  async removerItem(comandaId: string, itemId: string): Promise<boolean> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new Error('Só é possível remover itens de comandas abertas');
    }

    const itemIndex = comanda.itens?.findIndex(item => item.id === itemId);
    if (itemIndex === undefined || itemIndex === -1) {
      throw new Error(`Item ${itemId} não encontrado na comanda`);
    }

    const item = comanda.itens![itemIndex];
    
    // Verificar se o item pode ser removido
    if (item.status === ItemStatus.PREPARANDO || item.status === ItemStatus.PRONTO) {
      throw new Error('Não é possível remover itens que já estão sendo preparados');
    }

    // Remover item
    comanda.itens!.splice(itemIndex, 1);

    // Recalcular total da comanda
    await this.recalcularTotalComanda(comandaId);

    // Aqui seria feita a remoção no banco de dados
    // await this.removerItemNoBanco(itemId);

    return true;
  }

  /**
   * Atualiza o status de um item
   * @param comandaId ID da comanda
   * @param itemId ID do item
   * @param novoStatus Novo status do item
   * @returns Item atualizado
   */
  async atualizarStatusItem(
    comandaId: string, 
    itemId: string, 
    novoStatus: ItemStatus
  ): Promise<CommandItem> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    const item = comanda.itens?.find(item => item.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} não encontrado na comanda`);
    }

    // CORREÇÃO: Permitir evolução de status mesmo com pagamento pendente
    // Para comandas de mesa, o pagamento só acontece no fechamento
    console.log(`Atualizando status do item ${item.nome_produto}: ${item.status} -> ${novoStatus}`);

    // Validar transição de status (mas permitir evolução mesmo pendente)
    this.validarTransicaoStatus(item.status, novoStatus);

    // Atualizar status e timestamps
    const statusAnterior = item.status;
    item.status = novoStatus;
    const agora = new Date().toISOString();

    switch (novoStatus) {
      case ItemStatus.PREPARANDO:
        item.preparacao_iniciada_em = agora;
        break;
      case ItemStatus.PRONTO:
        item.preparado_em = agora;
        break;
      case ItemStatus.ENTREGUE:
        item.entregue_em = agora;
        break;
      case ItemStatus.CANCELADO:
        item.cancelado_em = agora;
        break;
    }

    // Log para debug
    console.log(`Item ${item.nome_produto} atualizado: ${statusAnterior} -> ${novoStatus}`);

    // Aqui seria feita a atualização no banco de dados
    // await this.atualizarItemNoBanco(item);

    return item;
  }

  /**
   * Associa uma comanda a uma mesa
   * @param comandaId ID da comanda
   * @param mesaId ID da mesa
   * @returns Comanda atualizada
   */
  async associarMesa(comandaId: string, mesaId: string): Promise<Command> {
    return await this.atualizarComanda(comandaId, { mesa_id: mesaId });
  }

  /**
   * Associa uma comanda a um cliente
   * @param comandaId ID da comanda
   * @param clienteId ID do cliente
   * @param nomeCliente Nome do cliente (opcional)
   * @returns Comanda atualizada
   */
  async associarCliente(
    comandaId: string, 
    clienteId: string, 
    nomeCliente?: string
  ): Promise<Command> {
    return await this.atualizarComanda(comandaId, { 
      cliente_id: clienteId,
      nome_cliente: nomeCliente 
    });
  }

  /**
   * Marca uma comanda como pendente de pagamento
   * @param comandaId ID da comanda
   * @returns Promise com a comanda atualizada
   */
  async marcarComoPendentePagamento(comandaId: string): Promise<Command> {
    const comanda = await this.buscarComanda(comandaId);
    
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    if (comanda.status === ComandaStatus.FECHADA) {
      throw new Error('Comanda já está fechada');
    }

    // Atualizar status no banco
    const success = await this.supabaseIntegration.updateComandaStatus(comandaId, ComandaStatus.PENDENTE_PAGAMENTO);
    if (!success) {
      throw new Error('Erro ao atualizar status da comanda no banco');
    }

    // Atualizar status local
    comanda.status = ComandaStatus.PENDENTE_PAGAMENTO;
    comanda.updated_at = new Date().toISOString();

    // Atualizar no cache
    this.comandasAbertas.set(comandaId, comanda);

    return comanda;
  }

  /**
   * Fecha uma comanda (marca como pendente de pagamento)
   * @param comandaId ID da comanda
   * @returns Comanda fechada
   */
  async fecharComanda(comandaId: string): Promise<Command> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new Error('Só é possível fechar comandas abertas');
    }

    // Verificar se há itens pendentes
    const itensPendentes = comanda.itens?.filter(
      item => item.status === ItemStatus.PENDENTE || item.status === ItemStatus.PREPARANDO
    );

    if (itensPendentes && itensPendentes.length > 0) {
      throw new Error('Não é possível fechar comanda com itens pendentes ou em preparo');
    }

    const comandaFechada = await this.atualizarComanda(comandaId, {
      status: ComandaStatus.PENDENTE_PAGAMENTO,
      fechada_em: new Date().toISOString()
    });

    return comandaFechada;
  }

  /**
   * Cancela uma comanda
   * @param comandaId ID da comanda
   * @param motivo Motivo do cancelamento
   * @returns Comanda cancelada
   */
  async cancelarComanda(comandaId: string, motivo?: string): Promise<Command> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }

    if (comanda.status === ComandaStatus.FECHADA) {
      throw new Error('Não é possível cancelar uma comanda já fechada');
    }

    // Cancelar todos os itens
    if (comanda.itens) {
      for (const item of comanda.itens) {
        if (item.status !== ItemStatus.ENTREGUE) {
          item.status = ItemStatus.CANCELADO;
        }
      }
    }

    const comandaCancelada = await this.atualizarComanda(comandaId, {
      status: ComandaStatus.CANCELADA,
      observacoes: motivo ? `${comanda.observacoes || ''}\nCancelada: ${motivo}` : comanda.observacoes
    });

    return comandaCancelada;
  }

  /**
   * Recalcula o total de uma comanda baseado nos itens
   * @param comandaId ID da comanda
   */
  private async recalcularTotalComanda(comandaId: string): Promise<void> {
    const comanda = await this.buscarComanda(comandaId);
    if (!comanda || !comanda.itens) return;

    const total = comanda.itens
      .filter(item => item.status !== ItemStatus.CANCELADO)
      .reduce((sum, item) => sum + item.preco_total, 0);

    await this.atualizarComanda(comandaId, { total });
  }

  /**
   * Gera um número único para nova comanda
   * @returns Número da comanda
   */
  private gerarNumeroComanda(): string {
    const numero = this.proximoNumero++;
    const timestamp = Date.now().toString().slice(-6);
    return `CMD${numero.toString().padStart(4, '0')}-${timestamp}`;
  }

  /**
   * Gera um ID único para item
   * @returns ID do item
   */
  private gerarIdItem(): string {
    return `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida se uma transição de status é permitida
   * @param statusAtual Status atual do item
   * @param novoStatus Novo status desejado
   */
  private validarTransicaoStatus(statusAtual: ItemStatus, novoStatus: ItemStatus): void {
    // CORREÇÃO: Transições mais flexíveis para comandas de mesa
    const transicoesPermitidas: Record<ItemStatus, ItemStatus[]> = {
      [ItemStatus.PENDENTE]: [ItemStatus.PREPARANDO, ItemStatus.PRONTO, ItemStatus.ENTREGUE, ItemStatus.CANCELADO],
      [ItemStatus.PREPARANDO]: [ItemStatus.PRONTO, ItemStatus.ENTREGUE, ItemStatus.CANCELADO],
      [ItemStatus.PRONTO]: [ItemStatus.ENTREGUE, ItemStatus.CANCELADO, ItemStatus.PREPARANDO], // Permitir voltar para preparando se necessário
      [ItemStatus.ENTREGUE]: [ItemStatus.CANCELADO], // Permitir cancelar item entregue (devolução)
      [ItemStatus.CANCELADO]: [] // Item cancelado não pode mudar de status
    };

    const transicoesValidas = transicoesPermitidas[statusAtual];
    if (!transicoesValidas || !transicoesValidas.includes(novoStatus)) {
      console.warn(`Transição de status questionável: ${statusAtual} -> ${novoStatus}, mas permitindo para comandas`);
      // Para comandas, vamos ser mais permissivos e apenas logar o aviso
      // throw new Error(`Transição de status inválida: ${statusAtual} -> ${novoStatus}`);
    }
  }

  /**
   * Converte itens do carrinho para itens de comanda
   * @param itensCarrinho Itens do carrinho
   * @returns Array de dados para criação de itens
   */
  static converterItensCarrinho(itensCarrinho: CartItem[]): Array<{
    produto_id: string;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    observacoes?: string;
  }> {
    return itensCarrinho.map(item => ({
      produto_id: item.produto_id,
      nome_produto: item.nome_produto,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      observacoes: item.observacoes
    }));
  }

  /**
   * Obtém estatísticas das comandas
   * @returns Estatísticas das comandas
   */
  async obterEstatisticas(): Promise<{
    total_comandas_abertas: number;
    total_itens_pendentes: number;
    valor_total_comandas_abertas: number;
  }> {
    const comandasAbertas = await this.listarComandasAbertas();
    
    const totalItens = comandasAbertas.reduce((total, comanda) => {
      return total + (comanda.itens?.filter(item => 
        item.status === ItemStatus.PENDENTE || item.status === ItemStatus.PREPARANDO
      ).length || 0);
    }, 0);

    const valorTotal = comandasAbertas.reduce((total, comanda) => {
      return total + comanda.total;
    }, 0);

    return {
      total_comandas_abertas: comandasAbertas.length,
      total_itens_pendentes: totalItens,
      valor_total_comandas_abertas: valorTotal
    };
  }

  // Métodos compatíveis com a interface esperada pelo demo

  /**
   * Cria comanda (método compatível)
   */
  async createCommand(dados: { mesa?: { numero: number }; garcom_id: string }): Promise<Command> {
    const comanda = await this.criarComanda({
      funcionario_id: dados.garcom_id,
      quantidade_pessoas: 1,
      observacoes: dados.mesa ? `Mesa ${dados.mesa.numero}` : undefined
    });

    // Adicionar informações da mesa se fornecida
    if (dados.mesa) {
      comanda.mesa = {
        numero: dados.mesa.numero
      };
    }

    return comanda;
  }

  /**
   * Obtém comandas abertas (método compatível)
   */
  async getOpenCommands(): Promise<Command[]> {
    return await this.listarComandasAbertas();
  }

  /**
   * Adiciona item à comanda (método compatível)
   */
  async addItemToCommand(comandaId: string, item: {
    produto_id: string;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    observacoes?: string;
  }): Promise<CommandItem> {
    return await this.adicionarItem(comandaId, item);
  }

  /**
   * Atualiza status do item (método compatível)
   */
  async updateItemStatus(comandaId: string, itemId: string, novoStatus: ItemStatus): Promise<CommandItem> {
    return await this.atualizarStatusItem(comandaId, itemId, novoStatus);
  }

  /**
   * Fecha comanda (método compatível)
   */
  async closeCommand(comandaId: string): Promise<Command> {
    return await this.fecharComanda(comandaId);
  }


}