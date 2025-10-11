import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseBarMonitorRealtimeProps {
  onOrderUpdate: () => void;
  empresaId?: string;
}

/**
 * Hook para atualização em tempo real do Monitor Bar
 * Monitora mudanças em pedidos e itens
 */
export const useBarMonitorRealtime = ({ 
  onOrderUpdate,
  empresaId 
}: UseBarMonitorRealtimeProps) => {
  
  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log('🍺 REALTIME MONITOR BAR:', payload.eventType, payload.table);
    
    // Qualquer mudança nos pedidos ou itens
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      console.log('🔄 Atualizando Monitor Bar...');
      onOrderUpdate();
    }
  }, [onOrderUpdate]);

  useEffect(() => {
    console.log('🔌 Conectando realtime do Monitor Bar...');
    
    // Criar subscription para pedidos e itens
    const subscription = supabase
      .channel('bar-monitor-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balcao_orders',
          filter: empresaId ? `empresa_id=eq.${empresaId}` : undefined
        },
        (payload) => {
          console.log('🔥 REALTIME BAR - balcao_orders:', payload.eventType);
          if (payload.eventType === 'UPDATE' && 
              payload.old?.status === 'pending_payment' && 
              payload.new?.status === 'paid') {
            console.log('💰 PEDIDO PAGO! Atualizando Monitor Bar...');
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
          console.log('🔥 REALTIME BAR - balcao_order_items:', payload.eventType);
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
          console.log('🔥 REALTIME BAR - comandas:', payload.eventType);
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
          console.log('🔥 REALTIME BAR - comanda_items:', payload.eventType);
          handleRealtimeEvent(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime do Monitor Bar ativo!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no realtime do Monitor Bar');
        }
      });

    return () => {
      console.log('🔌 Desconectando realtime do Monitor Bar');
      subscription.unsubscribe();
    };
  }, [handleRealtimeEvent, empresaId]);
};
