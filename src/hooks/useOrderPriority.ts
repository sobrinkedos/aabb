import { useState, useCallback, useEffect } from 'react';
import { 
  PriorityLevel, 
  OrderComplexity, 
  TimerStatus, 
  OrderPriority, 
  PriorityCalculation,
  OrderAlert,
  ComandaItemWithMenu 
} from '../types/bar-attendance';
import { MenuItem } from '../types';
import { useNotificationSound } from './useNotificationSound';

interface OrderTimer {
  id: string;
  startTime: Date;
  estimatedTime: number; // em minutos
  status: TimerStatus;
  alertsSent: string[];
}

export const useOrderPriority = () => {
  const [orderTimers, setOrderTimers] = useState<OrderTimer[]>([]);
  const [alerts, setAlerts] = useState<OrderAlert[]>([]);
  const notificationSound = useNotificationSound();

  // Configurações de complexidade por categoria
  const complexitySettings = {
    'Bebidas': { baseTime: 2, complexity: 'simple' as OrderComplexity },
    'Petiscos': { baseTime: 8, complexity: 'medium' as OrderComplexity },
    'Prato Principal': { baseTime: 15, complexity: 'complex' as OrderComplexity },
    'Sobremesas': { baseTime: 5, complexity: 'simple' as OrderComplexity },
    'Lanches': { baseTime: 10, complexity: 'medium' as OrderComplexity }
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
        const category = item.menu_items.category;
        const preparationTime = item.menu_items.preparation_time || 0;
        
        // Usar tempo de preparo do item ou tempo base da categoria
        const itemBaseTime = preparationTime > 0 ? preparationTime : 
          (complexitySettings[category as keyof typeof complexitySettings]?.baseTime || 5);
        
        totalBaseTime += itemBaseTime * item.quantity;
        
        // Determinar complexidade máxima
        const itemComplexity = complexitySettings[category as keyof typeof complexitySettings]?.complexity || 'simple';
        if (getComplexityValue(itemComplexity) > getComplexityValue(maxComplexity)) {
          maxComplexity = itemComplexity;
        }

        // Bônus por categorias especiais
        if (category === 'Prato Principal') categoryBonus += 2;
        if (category === 'Petiscos') categoryBonus += 1;
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

    setAlerts(prev => [alert, ...prev]);
    
    // Tocar som de notificação para alertas importantes
    if (type === 'ready' || type === 'overdue') {
      notificationSound.play();
    }
  }, [notificationSound]);

  // Marcar alerta como reconhecido
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, acknowledged: true }
        : alert
    ));
  }, []);

  // Limpar alertas antigos
  const clearOldAlerts = useCallback(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    setAlerts(prev => prev.filter(alert => 
      alert.timestamp > oneHourAgo || !alert.acknowledged
    ));
  }, []);

  // Atualizar status dos timers periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      setOrderTimers(prev => prev.map(timer => {
        const elapsedMinutes = (now.getTime() - timer.startTime.getTime()) / (1000 * 60);
        const warningThreshold = timer.estimatedTime * 0.8; // 80% do tempo estimado
        
        let newStatus: TimerStatus = timer.status;
        
        if (elapsedMinutes > timer.estimatedTime) {
          newStatus = 'overdue';
          // Criar alerta de atraso se ainda não foi enviado
          if (!timer.alertsSent.includes('overdue')) {
            createAlert(timer.id, 'overdue', 'Pedido em atraso! Tempo estimado ultrapassado.');
            timer.alertsSent.push('overdue');
          }
        } else if (elapsedMinutes > warningThreshold) {
          newStatus = 'warning';
          // Criar alerta de aviso se ainda não foi enviado
          if (!timer.alertsSent.includes('warning')) {
            createAlert(timer.id, 'warning', 'Atenção! Pedido se aproximando do tempo limite.');
            timer.alertsSent.push('warning');
          }
        }
        
        return { ...timer, status: newStatus };
      }));
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [createAlert]);

  // Limpar alertas antigos periodicamente
  useEffect(() => {
    const interval = setInterval(clearOldAlerts, 5 * 60 * 1000); // A cada 5 minutos
    return () => clearInterval(interval);
  }, [clearOldAlerts]);

  return {
    // Funções principais
    calculateOrderPriority,
    calculateAutoPriority,
    startOrderTimer,
    stopOrderTimer,
    markOrderAsPriority,
    sortOrdersByPriority,
    
    // Utilitários
    getPriorityLabel,
    getPriorityColor,
    
    // Alertas
    createAlert,
    acknowledgeAlert,
    clearOldAlerts,
    
    // Notificações sonoras
    notificationSound,
    
    // Estados
    orderTimers,
    alerts: alerts.filter(alert => !alert.acknowledged),
    allAlerts: alerts
  };
};