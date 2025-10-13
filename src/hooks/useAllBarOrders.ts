import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { getStartOfToday } from '../utils/date-helpers';

export const useAllBarOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar TODOS os pedidos de comandas (incluindo delivered)
      const { data: comandaData, error: comandaError } = await supabase
        .from('comanda_items')
        .select(`
          *,
          comanda:comandas(
            id,
            table_id,
            customer_name,
            opened_at,
            status,
            table:bar_tables(number)
          ),
          menu_item:menu_items(
            *,
            inventory_items!left(name, image_url)
          )
        `)
        .gte('added_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()) // Apenas hoje
        .order('added_at', { ascending: false });

      if (comandaError) throw comandaError;

      // Buscar TODOS os pedidos de balcão (incluindo delivered)
      const { data: balcaoData, error: balcaoError } = await supabase
        .from('balcao_order_items')
        .select(`
          *,
          balcao_order:balcao_orders!inner(
            id,
            order_number,
            customer_name,
            status,
            created_at
          ),
          menu_item:menu_items(
            *,
            inventory_items!left(name, image_url)
          )
        `)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()) // Apenas hoje
        .order('created_at', { ascending: false });

      if (balcaoError) throw balcaoError;

      // Agrupar itens por pedido
      const orderMap = new Map<string, Order>();

      // Processar pedidos de comandas
      comandaData?.forEach(item => {
        const comandaId = item.comanda?.id;
        if (!comandaId) return;

        // Criar chave única baseada na comanda + timestamp
        const addedAt = new Date(item.added_at);
        const timeKey = `${addedAt.getUTCFullYear()}-${addedAt.getUTCMonth()}-${addedAt.getUTCDate()}-${addedAt.getUTCHours()}-${addedAt.getUTCMinutes()}`;
        const orderKey = `comanda-${comandaId}-${timeKey}`;

        if (!orderMap.has(orderKey)) {
          orderMap.set(orderKey, {
            id: orderKey,
            tableNumber: item.comanda?.table?.number,
            items: [],
            status: item.status as Order['status'],
            total: 0,
            createdAt: new Date(item.added_at),
            updatedAt: new Date(item.created_at),
            employeeId: '',
            notes: `Mesa ${item.comanda?.table?.number} - ${item.comanda?.customer_name || 'Cliente'}`
          });
        }

        const order = orderMap.get(orderKey)!;
        order.items.push({
          id: item.id,
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          menuItem: item.menu_item ? {
            id: item.menu_item.id,
            name: item.menu_item.item_type === 'direct' && item.menu_item.inventory_items?.name
              ? item.menu_item.inventory_items.name
              : item.menu_item.name,
            category: item.menu_item.category,
            preparationTime: item.menu_item.preparation_time,
            item_type: item.menu_item.item_type
          } : undefined
        });
        order.total += item.price * item.quantity;
      });

      // Processar pedidos de balcão
      balcaoData?.forEach(item => {
        const balcaoOrderId = item.balcao_order?.id;
        if (!balcaoOrderId) return;

        const orderKey = `balcao-${balcaoOrderId}`;

        if (!orderMap.has(orderKey)) {
          // Mapear status do balcão para status do pedido
          let orderStatus: Order['status'] = 'pending';
          if (item.balcao_order.status === 'preparing') orderStatus = 'preparing';
          else if (item.balcao_order.status === 'ready') orderStatus = 'ready';
          else if (item.balcao_order.status === 'delivered') orderStatus = 'delivered';

          orderMap.set(orderKey, {
            id: orderKey,
            tableNumber: 'Balcão',
            items: [],
            status: orderStatus,
            total: 0,
            createdAt: new Date(item.balcao_order.created_at),
            updatedAt: new Date(item.created_at),
            employeeId: '',
            notes: `Pedido Balcão #${item.balcao_order.order_number}${item.balcao_order.customer_name ? ` - ${item.balcao_order.customer_name}` : ''}`
          });
        }

        const order = orderMap.get(orderKey)!;
        order.items.push({
          id: item.id,
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
          price: item.unit_price,
          notes: item.notes,
          menuItem: item.menu_item ? {
            id: item.menu_item.id,
            name: item.menu_item.item_type === 'direct' && item.menu_item.inventory_items?.name
              ? item.menu_item.inventory_items.name
              : item.menu_item.name,
            category: item.menu_item.category,
            preparationTime: item.menu_item.preparation_time,
            item_type: item.menu_item.item_type
          } : undefined
        });
        order.total += item.unit_price * item.quantity;
      });

      setOrders(Array.from(orderMap.values()));
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar pedidos do bar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();

    // Configurar real-time subscriptions
    const comandaItemsSubscription = supabase
      .channel('comanda_items_all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_items' },
        () => {
          console.log('📦 Atualizando pedidos do bar (comanda_items)...');
          fetchAllOrders();
        }
      )
      .subscribe();

    const balcaoItemsSubscription = supabase
      .channel('balcao_order_items_all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balcao_order_items' },
        () => {
          console.log('📦 Atualizando pedidos do bar (balcao_order_items)...');
          fetchAllOrders();
        }
      )
      .subscribe();

    const balcaoOrdersSubscription = supabase
      .channel('balcao_orders_all')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'balcao_orders' },
        () => {
          console.log('📦 Atualizando pedidos do bar (balcao_orders)...');
          fetchAllOrders();
        }
      )
      .subscribe();

    return () => {
      comandaItemsSubscription.unsubscribe();
      balcaoItemsSubscription.unsubscribe();
      balcaoOrdersSubscription.unsubscribe();
    };
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchAllOrders
  };
};
