import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContextSimple';
import { 
  PriorityLevel, 
  OrderComplexity, 
  TimerStatus, 
  OrderPriority, 
  PriorityCalculation,
  OrderAlert,
  ComandaItemWithMenu 
} from '../types/bar-attendance';

interface OrderTimer {
  id: string;
  startTime: Date;
  estimatedTime: number; // em minutos
  status: TimerStatus;
  alertsSent: string[];
}

interface UseOrderPriorityState {
  orderQueue: ComandaItemWithMenu[];
  alerts: OrderAlert[];
  loading: boolean;
  error: string | null;
}

export const useOrderPriority = () => {
  const { user } = useAuth();
  const [orderTimers, setOrderTimers] = useState<OrderTimer[]>([]);
  const [state, setState] = useState<UseOrderPriorityState>({
    orderQueue: [],
    alerts: [],
    loading: true,
    error: null
  });

  // Função para atualizar estado
  const updateState = useCallback((updates: Partial<UseOrderPriorityState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Função para tratar erros
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Erro em ${context}:`, error);
    updateState({ 
      error: `Erro em ${context}: ${error.message || 'Erro desconhecido'}`,
      loading: false 
    });
  }, [updateState]);

  // Carregar fila de pedidos do banco
  const loadOrderQueue = useCallback(async () => {
    if (!user) return;

    try {
      updateState({ loading: true, error: null });

      // Buscar todos os itens pendentes e em preparo com dados do menu usando RPC
      const { data: items, error } = await supabase.rpc('get_order_queue_items');

      if (error) throw error;

      // Processar itens com cálculo de prioridade
      const processedItems: ComandaItemWithMenu[] = (items || []).map(item => {
        const priority = calculateOrderPriority([item as ComandaItemWithMenu]);
        
        return {
          ...item,
          priority: {
            level: priority.priorityLevel,
            complexity: getOrderComplexity(priority.finalEstimate),
            estimatedTime: priority.finalEstimate,
            isManuallyPrioritized: item.is_priority || false,
            createdAt: new Date(item.added_at),
            timerStatus: calculateTimerStatus(new Date(item.added_at), priority.finalEstimate),
            alertsEnabled: true
          }
        };
      });

      // Ordenar por prioridade
      const sortedItems = sortOrdersByPriority(processedItems);

      updateState({
        orderQueue: sortedItems,
        loading: false
      });

    } catch (error) {
      handleError(error, 'carregamento da fila de pedidos');
    }
  }, [user, updateState, handleError]);

  // Calcular status do timer
  const calculateTimerStatus = (createdAt: Date, estimatedTime: number): TimerStatus => {
    const now = new Date();
    const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    const warningThreshold = estimatedTime * 0.8;
    const overdueThreshold = estimatedTime * 1.2;
    
    if (elapsedMinutes >= overdueThreshold) return 'overdue';
    if (elapsedMinutes >= warningThreshold) return 'warning';
    return 'normal';
  };

  // Configurações de complexidade por categoria
  const complexitySettings = {
    'bebidas': { baseTime: 2, complexity: 'simple' as OrderComplexity },
    'drinks': { baseTime: 3, complexity: 'simple' as OrderComplexity },
    'petiscos': { baseTime: 8, complexity: 'medium' as OrderComplexity },
    'pratos': { baseTime: 15, complexity: 'complex' as OrderComplexity },
    'sobremesas': { baseTime: 5, complexity: 'simple' as OrderComplexity },
    'cafes': { baseTime: 3, complexity: 'simple' as OrderComplexity }
  };

  // Multiplicadores de complexidade
  const complexityMultipliers = {
    simple: 1.0,
    medium: 1.3,
    complex: 1.8
  };

  // Calcular prioridade automática baseada em complexidade e tempo
  const calculateAutoPriority = useCallback((items: ComandaItemWithMenu[]): PriorityCalculation => {
    let totalBaseTime = 0;
    let maxComplexity: OrderComplexity = 'simple';
    let categoryBonus = 0;

    items.forEach(item => {
      if (item.menu_items) {
        const category = item.menu_items.category.toLowerCase();
        const preparationTime = item.menu_items.preparation_time || 0;
        
        // Usar tempo de preparo do item ou tempo base da categoria
        const itemBaseTime = preparationTime > 0 ? preparationTime : 
          (complexitySettings[category as keyof typeof complexitySettings]?.baseTime || 8);
        
        totalBaseTime += itemBaseTime * item.quantity;
        
        // Determinar complexidade máxima
        const itemComplexity = complexitySettings[category as keyof typeof complexitySettings]?.complexity || 'medium';
        if (getComplexityValue(itemComplexity) > getComplexityValue(maxComplexity)) {
          maxComplexity = itemComplexity;
        }

        // Bônus por categorias especiais
        if (category === 'pratos') categoryBonus += 2;
        if (category === 'petiscos') categoryBonus += 1;
      }
    });

    const complexityMultiplier = complexityMultipliers[maxComplexity];
    const finalEstimate = Math.ceil((totalBaseTime + categoryBonus) * complexityMultiplier);
    
    // Determinar nível de prioridade baseado no tempo estimado
    let priorityLevel: PriorityLevel = 'low';
    if (finalEstimate >= 20) priorityLevel = 'high';
    else if (finalEstimate >= 12) priorityLevel = 'medium';
    else priorityLevel = 'low';

    return {
      baseTime: totalBaseTime,
      complexityMultiplier,
      categoryBonus,
      finalEstimate,
      priorityLevel
    };
  }, []);

  // Função auxiliar para obter valor numérico da complexidade
  const getComplexityValue = (complexity: OrderComplexity): number => {
    switch (complexity) {
      case 'simple': return 1;
      case 'medium': return 2;
      case 'complex': return 3;
      default: return 1;
    }
  };

  // Calcular prioridade completa para um pedido
  const calculateOrderPriority = useCallback((
    items: ComandaItemWithMenu[], 
    isManuallyPrioritized: boolean = false,
    manualPriority?: PriorityLevel
  ): OrderPriority => {
    const calculation = calculateAutoPriority(items);
    
    return {
      level: isManuallyPrioritized && manualPriority ? manualPriority : calculation.priorityLevel,
      complexity: getOrderComplexity(calculation.finalEstimate),
      estimatedTime: calculation.finalEstimate,
      isManuallyPrioritized,
      createdAt: new Date(),
      timerStatus: 'normal',
      alertsEnabled: true
    };
  }, [calculateAutoPriority]);

  // Determinar complexidade baseada no tempo estimado
  const getOrderComplexity = (estimatedTime: number): OrderComplexity => {
    if (estimatedTime >= 15) return 'complex';
    if (estimatedTime >= 8) return 'medium';
    return 'simple';
  };

  // Iniciar timer para um pedido
  const startOrderTimer = useCallback((
    orderId: string, 
    estimatedTime: number
  ) => {
    const newTimer: OrderTimer = {
      id: orderId,
      startTime: new Date(),
      estimatedTime,
      status: 'normal',
      alertsSent: []
    };

    setOrderTimers(prev => [...prev.filter(t => t.id !== orderId), newTimer]);
  }, []);

  // Parar timer de um pedido
  const stopOrderTimer = useCallback((orderId: string) => {
    setOrderTimers(prev => prev.filter(t => t.id !== orderId));
  }, []);

  // Marcar pedido como prioritário manualmente
  const markOrderAsPriority = useCallback((
    orderId: string,
    priority: PriorityLevel,
    reason?: string
  ) => {
    // Atualizar timer se existir
    setOrderTimers(prev => prev.map(timer => 
      timer.id === orderId 
        ? { ...timer, status: priority === 'urgent' ? 'warning' : timer.status }
        : timer
    ));

    // Criar alerta
    const alert: OrderAlert = {
      id: `priority-${orderId}-${Date.now()}`,
      orderId,
      type: 'warning',
      message: `Pedido marcado como ${getPriorityLabel(priority)}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      acknowledged: false
    };

    setAlerts(prev => [alert, ...prev]);
  }, []);

  // Obter label da prioridade em português
  const getPriorityLabel = (priority: PriorityLevel): string => {
    switch (priority) {
      case 'low': return 'Baixa Prioridade';
      case 'medium': return 'Prioridade Média';
      case 'high': return 'Alta Prioridade';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  // Obter cor da prioridade
  const getPriorityColor = (priority: PriorityLevel): string => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Ordenar pedidos por prioridade e tempo
  const sortOrdersByPriority = useCallback((orders: any[]) => {
    const priorityOrder: Record<PriorityLevel, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return orders.sort((a, b) => {
      // Primeiro por prioridade manual
      if (a.priority?.isManuallyPrioritized && !b.priority?.isManuallyPrioritized) return -1;
      if (!a.priority?.isManuallyPrioritized && b.priority?.isManuallyPrioritized) return 1;
      
      // Depois por nível de prioridade
      const aPriorityLevel: PriorityLevel = (a.priority?.level || 'low') as PriorityLevel;
      const bPriorityLevel: PriorityLevel = (b.priority?.level || 'low') as PriorityLevel;
      const aPriority = priorityOrder[aPriorityLevel];
      const bPriority = priorityOrder[bPriorityLevel];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Por último, por tempo de criação (mais antigo primeiro)
      const aTime = new Date(a.priority?.createdAt || a.added_at || 0).getTime();
      const bTime = new Date(b.priority?.createdAt || b.added_at || 0).getTime();
      
      return aTime - bTime;
    });
  }, []);

  // Marcar item como prioritário
  const markItemAsPriority = useCallback(async (
    itemId: string, 
    isPriority: boolean
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('comanda_items')
        .update({
          is_priority: isPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      // Atualizar estado local
      updateState({
        orderQueue: state.orderQueue.map(item => {
          if (item.id === itemId && item.priority) {
            return {
              ...item,
              priority: {
                ...item.priority,
                isManuallyPrioritized: isPriority,
                level: isPriority ? 'urgent' : item.priority.level
              }
            };
          }
          return item;
        })
      });

      // Recarregar para garantir consistência
      await loadOrderQueue();

    } catch (error) {
      handleError(error, 'marcação de prioridade');
      throw error;
    }
  }, [state.orderQueue, updateState, handleError, loadOrderQueue]);

  // Atualizar status do item
  const updateItemStatus = useCallback(async (
    itemId: string, 
    status: string
  ): Promise<void> => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Adicionar timestamps específicos
      if (status === 'preparing') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'ready') {
        updateData.prepared_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('comanda_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      await loadOrderQueue();

    } catch (error) {
      handleError(error, 'atualização de status');
      throw error;
    }
  }, [handleError, loadOrderQueue]);

  // Criar alerta
  const createAlert = useCallback((
    orderId: string,
    type: OrderAlert['type'],
    message: string
  ) => {
    const alert: OrderAlert = {
      id: `alert-${orderId}-${Date.now()}`,
      orderId,
      type,
      message,
      timestamp: new Date(),
      acknowledged: false
    };

    updateState({
      alerts: [alert, ...state.alerts]
    });
  }, [state.alerts, updateState]);

  // Marcar alerta como reconhecido
  const dismissAlert = useCallback((alertId: string) => {
    updateState({
      alerts: state.alerts.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true }
          : alert
      )
    });
  }, [state.alerts, updateState]);

  // Limpar todos os alertas
  const clearAllAlerts = useCallback(() => {
    updateState({ alerts: [] });
  }, [updateState]);

  // Funções de utilidade
  const getItemPriority = useCallback((item: ComandaItemWithMenu): OrderPriority => {
    if (item.priority) return item.priority;
    
    // Calcular prioridade se não existir
    const priority = calculateOrderPriority([item]);
    return {
      level: priority.priorityLevel,
      complexity: getOrderComplexity(priority.finalEstimate),
      estimatedTime: priority.finalEstimate,
      isManuallyPrioritized: false,
      createdAt: new Date(item.added_at),
      timerStatus: calculateTimerStatus(new Date(item.added_at), priority.finalEstimate),
      alertsEnabled: true
    };
  }, []);

  const getTimerStatus = useCallback((item: ComandaItemWithMenu): TimerStatus => {
    const priority = getItemPriority(item);
    return calculateTimerStatus(priority.createdAt, priority.estimatedTime);
  }, [getItemPriority]);

  const getRemainingTime = useCallback((item: ComandaItemWithMenu): number => {
    const priority = getItemPriority(item);
    const elapsedMinutes = (new Date().getTime() - priority.createdAt.getTime()) / (1000 * 60);
    return Math.max(0, priority.estimatedTime - elapsedMinutes);
  }, [getItemPriority]);

  const formatRemainingTime = useCallback((item: ComandaItemWithMenu): string => {
    const remainingTime = getRemainingTime(item);
    if (remainingTime < 1) return '< 1min';
    if (remainingTime < 60) return `${Math.ceil(remainingTime)}min`;
    
    const hours = Math.floor(remainingTime / 60);
    const minutes = Math.ceil(remainingTime % 60);
    
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  }, [getRemainingTime]);

  // Estatísticas de prioridade
  const getPriorityStats = useCallback(() => {
    const stats = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      overdue: 0,
      warning: 0
    };

    state.orderQueue.forEach(item => {
      const priority = getItemPriority(item);
      stats[priority.level]++;
      
      if (priority.timerStatus === 'overdue') stats.overdue++;
      else if (priority.timerStatus === 'warning') stats.warning++;
    });

    return stats;
  }, [state.orderQueue, getItemPriority]);

  // Atualizar fila
  const refreshQueue = useCallback(async (): Promise<void> => {
    await loadOrderQueue();
  }, [loadOrderQueue]);

  // Configurar subscriptions em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('order-priority-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_items' },
        (payload) => {
          console.log('Mudança em itens de comanda:', payload);
          loadOrderQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadOrderQueue]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadOrderQueue();
    }
  }, [user, loadOrderQueue]);

  // Atualizar timers a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.orderQueue.length > 0) {
        // Atualizar status dos timers
        const updatedQueue = state.orderQueue.map(item => {
          if (item.priority) {
            const newTimerStatus = calculateTimerStatus(
              item.priority.createdAt,
              item.priority.estimatedTime
            );
            
            return {
              ...item,
              priority: {
                ...item.priority,
                timerStatus: newTimerStatus
              }
            };
          }
          return item;
        });

        updateState({ orderQueue: updatedQueue });
      }
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [state.orderQueue, updateState]);

  return {
    // Estado
    ...state,
    
    // Funções de priorização
    markItemAsPriority,
    updateItemStatus,
    
    // Funções de alertas
    dismissAlert,
    clearAllAlerts,
    
    // Funções de utilidade
    getItemPriority,
    getTimerStatus,
    getRemainingTime,
    formatRemainingTime,
    
    // Estatísticas
    getPriorityStats,
    
    // Atualização
    refreshQueue,
    
    // Utilitários
    getPriorityLabel,
    getPriorityColor,
    sortOrdersByPriority,
    
    // Funções principais
    calculateOrderPriority,
    calculateAutoPriority,
    startOrderTimer,
    stopOrderTimer,
    markOrderAsPriority,
    
    // Estados legados (manter compatibilidade)
    orderTimers,
    allAlerts: state.alerts
  };
};