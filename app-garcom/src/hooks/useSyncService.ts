/**
 * Hook para usar o serviço de sincronização
 * 
 * Facilita o uso do serviço de sincronização em componentes
 */
import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  selectIsOnline,
  selectIsSyncing,
  selectPendingOperationsCount,
  selectSyncStatus,
} from '../store/selectors';
import { sincronizacaoService } from '../services/SincronizacaoService';
import { OperacaoPendente, OPERACAO_TIPO } from '../types';

export function useSyncService() {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const pendingCount = useAppSelector(selectPendingOperationsCount);
  const syncStatus = useAppSelector(selectSyncStatus);

  // Inicializar serviço ao montar
  useEffect(() => {
    sincronizacaoService.inicializar();

    return () => {
      sincronizacaoService.finalizar();
    };
  }, []);

  // Adicionar operação à fila
  const adicionarOperacao = useCallback(
    (tipo: OperacaoPendente['tipo'], dados: any) => {
      sincronizacaoService.adicionarOperacao({
        tipo,
        dados,
        maxTentativas: 3,
      });
    },
    []
  );

  // Sincronizar agora
  const sincronizarAgora = useCallback(async () => {
    await sincronizacaoService.sincronizarAgora();
  }, []);

  // Limpar fila
  const limparFila = useCallback(() => {
    sincronizacaoService.limparFila();
  }, []);

  // Verificar conectividade
  const verificarConectividade = useCallback(async () => {
    return await sincronizacaoService.verificarConectividade();
  }, []);

  return {
    // Estado
    isOnline,
    isSyncing,
    pendingCount,
    syncStatus,

    // Ações
    adicionarOperacao,
    sincronizarAgora,
    limparFila,
    verificarConectividade,

    // Helpers
    hasPendingOperations: pendingCount > 0,
    canSync: isOnline && !isSyncing && pendingCount > 0,
  };
}

/**
 * Hook para adicionar operações offline de forma simplificada
 */
export function useOfflineOperation() {
  const { adicionarOperacao, isOnline } = useSyncService();

  const executarComFallback = useCallback(
    async <T,>(
      operacaoOnline: () => Promise<T>,
      operacaoOffline: {
        tipo: OperacaoPendente['tipo'];
        dados: any;
      }
    ): Promise<T | null> => {
      if (isOnline) {
        try {
          return await operacaoOnline();
        } catch (error) {
          console.error('Erro na operação online, adicionando à fila:', error);
          adicionarOperacao(operacaoOffline.tipo, operacaoOffline.dados);
          return null;
        }
      } else {
        // Offline, adicionar à fila
        adicionarOperacao(operacaoOffline.tipo, operacaoOffline.dados);
        return null;
      }
    },
    [isOnline, adicionarOperacao]
  );

  return {
    executarComFallback,
    isOnline,
  };
}

/**
 * Hook para monitorar mudanças de conectividade
 */
export function useConnectivityMonitor(
  onOnline?: () => void,
  onOffline?: () => void
) {
  const isOnline = useAppSelector(selectIsOnline);

  useEffect(() => {
    if (isOnline && onOnline) {
      onOnline();
    } else if (!isOnline && onOffline) {
      onOffline();
    }
  }, [isOnline, onOnline, onOffline]);

  return { isOnline };
}
