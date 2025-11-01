/**
 * Selectors otimizados com Reselect para Redux
 * 
 * Selectors são funções que extraem dados específicos do state
 * e podem fazer cálculos derivados de forma eficiente (memoização)
 */
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { MESA_STATUS, COMANDA_STATUS, ITEM_STATUS } from '../types/constants';

// ============================================================================
// SELECTORS DE AUTH
// ============================================================================

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

// ============================================================================
// SELECTORS DE MESAS
// ============================================================================

export const selectMesas = (state: RootState) => state.mesas.mesas;
export const selectMesaSelecionada = (state: RootState) => state.mesas.mesaSelecionada;
export const selectFiltroStatusMesa = (state: RootState) => state.mesas.filtroStatus;
export const selectMesasLoading = (state: RootState) => state.mesas.isLoading;
export const selectMesasError = (state: RootState) => state.mesas.error;
export const selectMesasLastSync = (state: RootState) => state.mesas.lastSync;

// Mesas disponíveis
export const selectMesasDisponiveis = createSelector([selectMesas], (mesas) =>
  mesas.filter((mesa) => mesa.status === MESA_STATUS.AVAILABLE)
);

// Mesas ocupadas
export const selectMesasOcupadas = createSelector([selectMesas], (mesas) =>
  mesas.filter((mesa) => mesa.status === MESA_STATUS.OCCUPIED)
);

// Mesas reservadas
export const selectMesasReservadas = createSelector([selectMesas], (mesas) =>
  mesas.filter((mesa) => mesa.status === MESA_STATUS.RESERVED)
);

// Mesas filtradas por status
export const selectMesasFiltradas = createSelector(
  [selectMesas, selectFiltroStatusMesa],
  (mesas, filtro) => {
    if (!filtro) return mesas;
    return mesas.filter((mesa) => mesa.status === filtro);
  }
);

// Estatísticas de mesas
export const selectMesasStats = createSelector([selectMesas], (mesas) => ({
  total: mesas.length,
  disponiveis: mesas.filter((m) => m.status === MESA_STATUS.AVAILABLE).length,
  ocupadas: mesas.filter((m) => m.status === MESA_STATUS.OCCUPIED).length,
  reservadas: mesas.filter((m) => m.status === MESA_STATUS.RESERVED).length,
  limpeza: mesas.filter((m) => m.status === MESA_STATUS.CLEANING).length,
  manutencao: mesas.filter((m) => m.status === MESA_STATUS.MAINTENANCE).length,
}));

// ============================================================================
// SELECTORS DE COMANDAS
// ============================================================================

export const selectComandas = (state: RootState) => state.comandas.comandasAbertas;
export const selectComandaAtiva = (state: RootState) => state.comandas.comandaAtiva;
export const selectHistoricoComandas = (state: RootState) => state.comandas.historico;
export const selectComandasLoading = (state: RootState) => state.comandas.isLoading;
export const selectComandasError = (state: RootState) => state.comandas.error;
export const selectComandasLastSync = (state: RootState) => state.comandas.lastSync;

// Comandas por mesa
export const selectComandasPorMesa = (mesaId: string) =>
  createSelector([selectComandas], (comandas) =>
    comandas.filter((comanda) => comanda.table_id === mesaId)
  );

// Itens da comanda ativa
export const selectItensComandaAtiva = createSelector(
  [selectComandaAtiva],
  (comanda) => comanda?.items || []
);

// Itens pendentes da comanda ativa
export const selectItensPendentes = createSelector([selectItensComandaAtiva], (itens) =>
  itens.filter((item) => item.status === ITEM_STATUS.PENDING || item.status === ITEM_STATUS.PREPARING)
);

// Total da comanda ativa
export const selectTotalComandaAtiva = createSelector([selectItensComandaAtiva], (itens) =>
  itens
    .filter((item) => item.status !== ITEM_STATUS.CANCELLED)
    .reduce((total, item) => total + item.quantity * item.price, 0)
);

// Estatísticas de comandas
export const selectComandasStats = createSelector([selectComandas], (comandas) => ({
  total: comandas?.length || 0,
  abertas: comandas?.filter((c) => c.status === COMANDA_STATUS.OPEN).length || 0,
  aguardandoPagamento: comandas?.filter((c) => c.status === COMANDA_STATUS.PENDING_PAYMENT).length || 0,
  totalVendas: comandas?.reduce((sum, c) => sum + (c.total || 0), 0) || 0,
}));

// ============================================================================
// SELECTORS DE CARDÁPIO
// ============================================================================

export const selectCardapioItems = (state: RootState) => state.cardapio.items;
export const selectCardapioCategorias = (state: RootState) => state.cardapio.categories;
export const selectCardapioFiltrado = (state: RootState) => state.cardapio.filteredItems;
export const selectCategoriaSelected = (state: RootState) => state.cardapio.selectedCategory;
export const selectSearchQuery = (state: RootState) => state.cardapio.searchQuery;
export const selectCardapioLoading = (state: RootState) => state.cardapio.isLoading;
export const selectCardapioError = (state: RootState) => state.cardapio.error;
export const selectCardapioLastSync = (state: RootState) => state.cardapio.lastSync;

// Itens por categoria
export const selectItensPorCategoria = (categoria: string) =>
  createSelector([selectCardapioItems], (items) =>
    items.filter((item) => item.category === categoria)
  );

// Itens disponíveis
export const selectItensDisponiveis = createSelector([selectCardapioItems], (items) =>
  items.filter((item) => item.available)
);

// Estatísticas do cardápio
export const selectCardapioStats = createSelector([selectCardapioItems], (items) => ({
  total: items.length,
  disponiveis: items.filter((i) => i.available).length,
  indisponiveis: items.filter((i) => !i.available).length,
  categorias: new Set(items.map((i) => i.category)).size,
}));

// ============================================================================
// SELECTORS DE SINCRONIZAÇÃO
// ============================================================================

export const selectIsOnline = (state: RootState) => state.sincronizacao.isOnline;
export const selectIsSyncing = (state: RootState) => state.sincronizacao.isSyncing;
export const selectPendingOperations = (state: RootState) => state.sincronizacao.pendingOperations;
export const selectSyncErrors = (state: RootState) => state.sincronizacao.syncErrors;
export const selectLastSyncTime = (state: RootState) => state.sincronizacao.lastSyncTime;

// Número de operações pendentes
export const selectPendingOperationsCount = createSelector(
  [selectPendingOperations],
  (operations) => operations.length
);

// Operações com erro
export const selectFailedOperations = createSelector([selectPendingOperations], (operations) =>
  operations.filter((op) => op.tentativas >= op.maxTentativas)
);

// Status de sincronização
export const selectSyncStatus = createSelector(
  [selectIsOnline, selectIsSyncing, selectPendingOperationsCount],
  (isOnline, isSyncing, pendingCount) => ({
    isOnline,
    isSyncing,
    hasPendingOperations: pendingCount > 0,
    pendingCount,
    status: !isOnline ? 'offline' : isSyncing ? 'syncing' : pendingCount > 0 ? 'pending' : 'synced',
  })
);

// ============================================================================
// SELECTORS GLOBAIS
// ============================================================================

// Estado de loading global
export const selectGlobalLoading = createSelector(
  [selectAuthLoading, selectMesasLoading, selectComandasLoading, selectCardapioLoading],
  (authLoading, mesasLoading, comandasLoading, cardapioLoading) =>
    authLoading || mesasLoading || comandasLoading || cardapioLoading
);

// Erros globais
export const selectGlobalErrors = createSelector(
  [selectAuthError, selectMesasError, selectComandasError, selectCardapioError],
  (authError, mesasError, comandasError, cardapioError) => {
    const errors = [];
    if (authError) errors.push({ module: 'auth', error: authError });
    if (mesasError) errors.push({ module: 'mesas', error: mesasError });
    if (comandasError) errors.push({ module: 'comandas', error: comandasError });
    if (cardapioError) errors.push({ module: 'cardapio', error: cardapioError });
    return errors;
  }
);

// Dashboard stats
export const selectDashboardStats = createSelector(
  [selectMesasStats, selectComandasStats, selectCardapioStats],
  (mesasStats, comandasStats, cardapioStats) => ({
    mesas: mesasStats,
    comandas: comandasStats,
    cardapio: cardapioStats,
  })
);
