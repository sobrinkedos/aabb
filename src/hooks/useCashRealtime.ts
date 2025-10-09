import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseCashRealtimeProps {
  onNewOrder?: () => void;
  onOrderUpdate?: () => void;
  empresaId?: string;
}

/**
 * Hook para atualização em tempo real do caixa
 * Monitora novos pedidos e mudanças de status
 */
export const useCashRealtime = ({ 
  onNewOrder, 
  onOrderUpdate,
  empresaId 
}: UseCashRealtimeProps) => {
  
  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log('💰 REALTIME CAIXA:', payload.eventType, payload.new?.status);
    
    // Novo pedido criado
    if (payload.eventType === 'INSERT') {
      console.log('📥 Novo pedido no caixa!');
      onNewOrder?.();
    }
    
    // Pedido atualizado
    if (payload.eventType === 'UPDATE') {
      console.log('🔄 Pedido atualizado no caixa');
      onOrderUpdate?.();
    }
  }, [onNewOrder, onOrderUpdate]);

  useEffect(() => {
    console.log('🔌 Conectando realtime do caixa...');
    
    // Criar subscription para pedidos pendentes de pagamento
    const subscription = supabase
      .channel('cash-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balcao_orders',
          filter: empresaId ? `empresa_id=eq.${empresaId}` : undefined
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime do caixa ativo!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no realtime do caixa');
        }
      });

    return () => {
      console.log('🔌 Desconectando realtime do caixa');
      subscription.unsubscribe();
    };
  }, [handleRealtimeEvent, empresaId]);
};
