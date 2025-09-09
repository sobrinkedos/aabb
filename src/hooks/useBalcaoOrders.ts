import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BalcaoOrderWithDetails,
  BalcaoMetrics,
  UseBalcaoOrdersReturn,
  CreateBalcaoOrderData,
  UpdateBalcaoOrderStatusData,
  ProcessBalcaoPaymentData,
  BalcaoOrderFilters,
  BalcaoOrderStatus,
  BalcaoOrderItemStatus
} from '../types/balcao-orders';

interface UseBalcaoOrdersState {
  orders: BalcaoOrderWithDetails[];
  metrics: BalcaoMetrics | null;
  loading: boolean;
  error: string | null;
}

export const useBalcaoOrders = (): UseBalcaoOrdersReturn => {
  const { user } = useAuth();
  
  const [state, setState] = useState<UseBalcaoOrdersState>({
    orders: [],
    metrics: null,
    loading: true,
    error: null
  });

  const updateState = useCallback((updates: Partial<UseBalcaoOrdersState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Erro em ${context}:`, error);
    updateState({ 
      error: `Erro em ${context}: ${error.message || 'Erro desconhecido'}`,
      loading: false 
    });
  }, [updateState]);

  // Carregar pedidos
  const loadOrders = useCallback(async () => {
    if (!user) return;

    try {
      updateState({ loading: true, error: null });

      const { data: ordersData, error: ordersError } = await supabase
        .from('balcao_orders_with_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;

      // Carregar itens para cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('balcao_order_items')
            .select(`
              *,
              menu_items:menu_item_id (
                id,
                name,
                category,
                price,
                preparation_time,
                item_type
              )
            `)
            .eq('balcao_order_id', order.id);

          if (itemsError) {
            console.warn(`Erro ao carregar itens do pedido ${order.id}:`, itemsError);
          }

          return {
            ...order,
            items: itemsData?.map(item => ({
              ...item,
              menu_item: Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items
            })) || []
          };
        })
      );

      updateState({
        orders: ordersWithItems,
        loading: false
      });

    } catch (error) {
      handleError(error, 'carregamento de pedidos');
    }
  }, [user, updateState, handleError]);

  // Criar pedido
  const createOrder = useCallback(async (data: CreateBalcaoOrderData): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      updateState({ loading: true, error: null });

      // Criar o pedido
      const { data: orderData, error: orderError } = await supabase
        .from('balcao_orders')
        .insert({
          employee_id: user.id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          discount_amount: data.discount_amount || 0,
          notes: data.notes,
          customer_notes: data.customer_notes,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Inserir itens do pedido
      const itemsToInsert = data.items.map(item => ({
        balcao_order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes,
        status: 'pending' as BalcaoOrderItemStatus
      }));

      const { error: itemsError } = await supabase
        .from('balcao_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      await loadOrders();
      return orderData.id;

    } catch (error) {
      handleError(error, 'criação de pedido');
      throw error;
    }
  }, [user, updateState, handleError, loadOrders]);

  // Atualizar status do pedido
  const updateOrderStatus = useCallback(async (orderId: string, data: UpdateBalcaoOrderStatusData): Promise<void> => {
    try {
      updateState({ loading: true, error: null });

      const updateData: any = {
        status: data.status,
        updated_at: new Date().toISOString()
      };

      // Campos específicos por status
      if (data.status === 'paid') {
        updateData.payment_method = data.payment_method;
        updateData.cash_session_id = data.cash_session_id;
        updateData.paid_at = new Date().toISOString();
      } else if (data.status === 'preparing') {
        updateData.preparation_started_at = new Date().toISOString();
      } else if (data.status === 'ready') {
        updateData.preparation_completed_at = new Date().toISOString();
      } else if (data.status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        updateData.delivered_by = data.delivered_by || user?.id;
      }

      if (data.notes) {
        updateData.notes = data.notes;
      }

      const { error } = await supabase
        .from('balcao_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

    } catch (error) {
      handleError(error, 'atualização de status do pedido');
      throw error;
    }
  }, [updateState, handleError, loadOrders, user]);

  // Processar pagamento
  const processPayment = useCallback(async (data: ProcessBalcaoPaymentData): Promise<void> => {
    try {
      await updateOrderStatus(data.order_id, {
        status: 'paid',
        payment_method: data.payment_method,
        cash_session_id: data.cash_session_id,
        notes: data.notes
      });

      // Registrar transação no caixa
      const { error: transactionError } = await supabase
        .from('cash_transactions')
        .insert({
          cash_session_id: data.cash_session_id,
          transaction_type: 'sale',
          payment_method: data.payment_method,
          amount: data.amount_paid,
          processed_by: user!.id,
          notes: `Pedido de balcão #${data.order_id}`,
          processed_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

    } catch (error) {
      handleError(error, 'processamento de pagamento');
      throw error;
    }
  }, [updateOrderStatus, handleError, user]);

  // Atualizar status de item
  const updateItemStatus = useCallback(async (itemId: string, status: BalcaoOrderItemStatus): Promise<void> => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'preparing') {
        updateData.preparation_started_at = new Date().toISOString();
      } else if (status === 'ready') {
        updateData.preparation_completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('balcao_order_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      await loadOrders();

    } catch (error) {
      handleError(error, 'atualização de status do item');
      throw error;
    }
  }, [handleError, loadOrders]);

  // Cancelar pedido
  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<void> => {
    try {
      await updateOrderStatus(orderId, {
        status: 'cancelled',
        notes: reason ? `Cancelado: ${reason}` : 'Pedido cancelado'
      });

    } catch (error) {
      handleError(error, 'cancelamento de pedido');
      throw error;
    }
  }, [updateOrderStatus, handleError]);

  // Buscar pedidos com filtros
  const searchOrders = useCallback(async (filters: BalcaoOrderFilters): Promise<BalcaoOrderWithDetails[]> => {
    try {
      let query = supabase
        .from('balcao_orders_with_details')
        .select('*');

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.customer_name) {
        query = query.ilike('customer_name', `%${filters.customer_name}%`);
      }

      if (filters.order_number) {
        query = query.eq('order_number', filters.order_number);
      }

      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data || [];

    } catch (error) {
      handleError(error, 'busca de pedidos');
      return [];
    }
  }, [handleError]);

  // Carregar métricas
  const loadMetrics = useCallback(async (): Promise<void> => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Métricas do dia
      const { data: todayOrders, error: todayError } = await supabase
        .from('balcao_orders')
        .select('status, final_amount, payment_method')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (todayError) throw todayError;

      const orders = todayOrders || [];
      
      const metrics: BalcaoMetrics = {
        today: {
          total_orders: orders.length,
          total_revenue: orders.reduce((sum, order) => sum + (order.final_amount || 0), 0),
          avg_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.final_amount || 0), 0) / orders.length : 0,
          pending_payment: orders.filter(o => o.status === 'pending_payment').length,
          preparing: orders.filter(o => o.status === 'preparing').length,
          ready_for_delivery: orders.filter(o => o.status === 'ready').length,
        },
        by_status: [],
        by_payment_method: [],
        hourly_breakdown: []
      };

      updateState({ metrics });

    } catch (error) {
      handleError(error, 'carregamento de métricas');
    }
  }, [updateState, handleError]);

  // Função para recarregar dados
  const refreshData = useCallback(async (): Promise<void> => {
    await Promise.all([loadOrders(), loadMetrics()]);
  }, [loadOrders, loadMetrics]);

  // Getters computados
  const getOrdersByStatus = useCallback((status: BalcaoOrderStatus): BalcaoOrderWithDetails[] => {
    return state.orders.filter(order => order.status === status);
  }, [state.orders]);

  const getOrderById = useCallback((orderId: string): BalcaoOrderWithDetails | undefined => {
    return state.orders.find(order => order.id === orderId);
  }, [state.orders]);

  // Propriedades computadas
  const pendingOrders = getOrdersByStatus('pending_payment');
  const preparingOrders = getOrdersByStatus('preparing');
  const readyOrders = getOrdersByStatus('ready');

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  // Subscription para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('balcao_orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'balcao_orders' 
        }, 
        () => {
          loadOrders();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'balcao_order_items' 
        }, 
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadOrders]);

  return {
    // Estado
    orders: state.orders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,

    // Funções CRUD
    createOrder,
    updateOrderStatus,
    updateItemStatus,
    cancelOrder,

    // Funções de pagamento
    processPayment,

    // Funções de busca
    searchOrders,
    getOrdersByStatus,

    // Funções utilitárias
    refreshData,
    getOrderById,

    // Métricas
    loadMetrics
  };
};