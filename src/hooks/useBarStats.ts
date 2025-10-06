import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BarStats {
  totalRevenue: number;
  ordersToday: number;
  pendingOrders: number;
  deliveredOrders: number;
  loading: boolean;
  error: string | null;
}

export const useBarStats = () => {
  const [stats, setStats] = useState<BarStats>({
    totalRevenue: 0,
    ordersToday: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    loading: true,
    error: null
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Buscar estatísticas de pedidos do balcão
      const { data: balcaoStats, error: balcaoError } = await supabase
        .from('balcao_orders')
        .select('status, final_amount, created_at')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      if (balcaoError) throw balcaoError;

      // Buscar estatísticas de comandas
      const { data: comandaStats, error: comandaError } = await supabase
        .from('comandas')
        .select('status, total, created_at')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      if (comandaError) throw comandaError;

      // Calcular estatísticas
      const today = new Date().toDateString();
      
      let totalRevenue = 0;
      let ordersToday = 0;
      let pendingOrders = 0;
      let deliveredOrders = 0;

      // Processar pedidos do balcão
      balcaoStats?.forEach(order => {
        const orderDate = new Date(order.created_at).toDateString();
        
        if (orderDate === today) {
          ordersToday++;
        }

        if (order.status === 'delivered') {
          totalRevenue += Number(order.final_amount || 0);
          deliveredOrders++;
        } else if (order.status === 'pending_payment' || order.status === 'paid' || order.status === 'preparing') {
          pendingOrders++;
        }
      });

      // Processar comandas
      comandaStats?.forEach(comanda => {
        const comandaDate = new Date(comanda.created_at).toDateString();
        
        if (comandaDate === today) {
          ordersToday++;
        }

        if (comanda.status === 'closed') {
          totalRevenue += Number(comanda.total || 0);
          deliveredOrders++;
        } else if (comanda.status === 'open' || comanda.status === 'pending_payment') {
          pendingOrders++;
        }
      });

      setStats({
        totalRevenue,
        ordersToday,
        pendingOrders,
        deliveredOrders,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas do bar:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
      }));
    }
  };

  useEffect(() => {
    fetchStats();

    // Configurar real-time subscription para atualizar estatísticas
    const balcaoSubscription = supabase
      .channel('balcao_orders_stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balcao_orders' },
        () => {
          console.log('📊 Atualizando estatísticas do bar (balcão)...');
          fetchStats();
        }
      )
      .subscribe();

    const comandaSubscription = supabase
      .channel('comandas_stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        () => {
          console.log('📊 Atualizando estatísticas do bar (comandas)...');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      balcaoSubscription.unsubscribe();
      comandaSubscription.unsubscribe();
    };
  }, []);

  return {
    ...stats,
    refetch: fetchStats
  };
};
