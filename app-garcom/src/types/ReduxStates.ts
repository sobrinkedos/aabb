// Estados do Redux para gerenciamento global da aplicação
import { Mesa, MesaComDetalhes } from './Mesa';
import { Comanda, ComandaComDetalhes, ItemComanda } from './Comanda';
import { MenuItem, MenuCategory, Cart } from './Produto';
import { User, AttendanceMetrics } from './Usuario';

// Estado de Mesas
export interface MesasState {
  mesas: MesaComDetalhes[];
  mesaSelecionada?: MesaComDetalhes;
  filtroStatus?: Mesa['status'];
  isLoading: boolean;
  error: string | null;
  lastSync?: string;
}

// Estado de Comandas
export interface ComandasState {
  comandasAbertas: ComandaComDetalhes[];
  comandaAtiva?: ComandaComDetalhes;
  historico: ComandaComDetalhes[];
  isLoading: boolean;
  error: string | null;
  lastSync?: string;
}

// Estado do Cardápio
export interface CardapioState {
  items: MenuItem[];
  categories: MenuCategory[];
  filteredItems: MenuItem[];
  selectedCategory?: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  lastSync?: string;
}

// Estado do Carrinho (pedido em construção)
export interface CarrinhoState {
  cart: Cart;
  comandaId?: string; // Comanda à qual o carrinho será adicionado
  isSubmitting: boolean;
  error: string | null;
}

// Estado de Sincronização
export interface SincronizacaoState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: OperacaoPendente[];
  lastSyncTime?: string;
  syncErrors: SyncError[];
}

export interface OperacaoPendente {
  id: string;
  tipo: 'criar_comanda' | 'adicionar_item' | 'atualizar_item' | 'fechar_comanda' | 'atualizar_mesa';
  dados: any;
  timestamp: string;
  tentativas: number;
  maxTentativas: number;
  erro?: string;
}

export interface SyncError {
  id: string;
  operacao: OperacaoPendente;
  erro: string;
  timestamp: string;
}

// Estado de Notificações
export interface NotificacoesState {
  notificacoes: Notificacao[];
  unreadCount: number;
  isEnabled: boolean;
  pushToken?: string;
}

export interface Notificacao {
  id: string;
  tipo: 'pedido_pronto' | 'cliente_chamando' | 'problema_cozinha' | 'turno_terminando' | 'emergencia';
  titulo: string;
  mensagem: string;
  dados?: any;
  lida: boolean;
  timestamp: string;
}

// Estado de Métricas do Usuário
export interface MetricasState {
  metricas?: AttendanceMetrics;
  historico: AttendanceMetrics[];
  isLoading: boolean;
  error: string | null;
}

// Estado Global da Aplicação
export interface RootState {
  auth: import('./Usuario').AuthState;
  mesas: MesasState;
  comandas: ComandasState;
  cardapio: CardapioState;
  carrinho: CarrinhoState;
  sincronizacao: SincronizacaoState;
  notificacoes: NotificacoesState;
  metricas: MetricasState;
}

// Tipos auxiliares para actions
export interface AsyncActionState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
