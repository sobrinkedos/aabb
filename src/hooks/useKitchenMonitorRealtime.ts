import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseKitchenMonitorRealtimeProps {
  onOrderUpdate: () => void;
  empresaId?: string;
}

/**
 * Hook para atualização em tempo real do Monitor Cozinha
 * Monitora mudanças em pedidos e itens que precisam ser preparados
 */
export const useKitchenMonitorRealtime = ({ 
  onOrderUpdate,
  empresaId 
}: UseKitchenMonitorRealtimeProps) => {
  
  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log('👨‍🍳 REALTIME MONITOR COZINHA:', payload.eventType, payload.table);
    
    // Qualquer mudança nos pedidos ou itens
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      console.log('🔄 Atualizando Monitor Cozinha...');
      onOrderUpdate();
    }
  }, [onOrderUpdate]);

  useEffect(() => {
    console.log('🔌 Conectando realtime do Monitor Cozinha...');
    
    // Criar subscription para pedidos e itens
    const subscription = supabase
      .channel('kitchen-monitor-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balcao_orders',
          filter: empresaId ? `empresa_id=eq.${empresaId}` : undefined
        },
        (payload) => {
          console.log('🔥 REALTIME COZINHA - balcao_orders:', payload.eventType);
          if (payload.eventType === 'UPDATE' && 
              payload.old?.status === 'pending_payment' && 
              payload.new?.status === 'paid') {
            console.log('💰 PEDIDO PAGO! Atualizando Monitor Cozinha...');
          }
          handleRealtimeEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balcao_order_items'
        },
        (payload) => {
          console.log('🔥 REALTIME COZINHA - balcao_order_items:', payload.eventType);
          handleRealtimeEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comandas'
        },
        (payload) => {
          console.log('🔥 REALTIME COZINHA - comandas:', payload.eventType);
          handleRealtimeEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comanda_items'
        },
        (payload) => {
          console.log('🔥 REALTIME COZINHA - comanda_items:', payload.eventType);
          handleRealtimeEvent(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime do Monitor Cozinha ativo!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no realtime do Monitor Cozinha');
        }
      });

    return () => {
      console.log('🔌 Desconectando realtime do Monitor Cozinha');
      subscription.unsubscribe();
    };
  }, [handleRealtimeEvent, empresaId]);
};
