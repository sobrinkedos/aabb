import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem, Order, InventoryItem, Member, Sale } from '../types';
import { Tables, TablesInsert } from '../types/supabase';

interface AppContextType {
  menuItems: MenuItem[];
  orders: Order[];
  addOrder: (orderData: { items: Omit<TablesInsert<'order_items'>, 'order_id'>[] } & Omit<TablesInsert<'orders'>, 'id' | 'created_at' | 'updated_at' | 'total'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  
  kitchenOrders: Order[];
  
  inventory: InventoryItem[];
  addInventoryItem: (itemData: Omit<TablesInsert<'inventory_items'>, 'id' | 'created_at' | 'last_updated'>) => Promise<void>;
  updateInventoryItem: (item: Tables<'inventory_items'>) => Promise<void>;
  removeInventoryItem: (itemId: string) => Promise<void>;
  
  members: Member[];
  addMember: (memberData: Omit<TablesInsert<'members'>, 'id' | 'created_at' | 'join_date'>) => Promise<void>;
  updateMember: (member: Tables<'members'>) => Promise<void>;
  
  notifications: string[];
  addNotification: (message: string) => void;
  clearNotifications: () => void;

  sales: Sale[];
  addSale: (saleData: Omit<TablesInsert<'sales'>, 'id' | 'timestamp'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [menuData, inventoryData, membersData, salesData] = await Promise.all([
        supabase.from('menu_items').select('*'),
        supabase.from('inventory_items').select('*').order('name'),
        supabase.from('members').select('*').order('name'),
        supabase.from('sales').select('*').order('timestamp', { ascending: false }),
      ]);

      if (menuData.data) setMenuItems(menuData.data as MenuItem[]);
      if (inventoryData.data) setInventory(inventoryData.data as InventoryItem[]);
      if (membersData.data) setMembers(membersData.data.map(m => ({...m, joinDate: new Date(m.join_date)})) as Member[]);
      if (salesData.data) setSales(salesData.data as Sale[]);
    };
    fetchData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const handleOrderChange = async (payload: any) => {
        console.log('Order change received!', payload);
        // Refetch all orders and their items to ensure consistency
        const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching orders after realtime event:', error);
        } else if (data) {
          const formattedOrders = data.map(o => ({
            ...o,
            items: o.order_items.map(oi => ({...oi, id: oi.id.toString()})),
            createdAt: new Date(o.created_at),
            updatedAt: new Date(o.updated_at || o.created_at),
          })) as unknown as Order[];
          setOrders(formattedOrders);
          if (payload.eventType !== 'INSERT') {
            addNotification(`Pedido #${(payload.new as any)?.id?.slice(0, 4)} atualizado para ${payload.new.status}`);
          }
        }
    }

    const ordersChannel = supabase
      .channel('realtime-orders')
      .on<Tables<'orders'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        handleOrderChange
      )
      .subscribe();

    // Fetch initial orders
    const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (error) console.error('Error fetching initial orders:', error);
      else if (data) {
        const formattedOrders = data.map(o => ({
          ...o,
          items: o.order_items.map(oi => ({...oi, id: oi.id.toString()})),
          createdAt: new Date(o.created_at),
          updatedAt: new Date(o.updated_at || o.created_at),
        })) as unknown as Order[];
        setOrders(formattedOrders);
      }
    };
    fetchOrders();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);


  const addOrder = async (orderData: { items: Omit<TablesInsert<'order_items'>, 'order_id'>[] } & Omit<TablesInsert<'orders'>, 'id' | 'created_at' | 'updated_at' | 'total'>) => {
    const { items, ...order } = orderData;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const { data: newOrder, error: orderError } = await supabase.from('orders').insert({...order, total}).select().single();
    if (orderError || !newOrder) {
      console.error('Error creating order:', orderError); return;
    }
    const orderItems = items.map(item => ({ ...item, order_id: newOrder.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
        console.error('Error creating order items:', itemsError);
    } else {
        addNotification(`Novo pedido #${newOrder.id.slice(0, 4)} criado!`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
  };

  const addInventoryItem = async (itemData: Omit<TablesInsert<'inventory_items'>, 'id' | 'created_at' | 'last_updated'>) => {
    const { data, error } = await supabase.from('inventory_items').insert(itemData).select().single();
    if (error) { console.error(error); return; }
    if (data) setInventory(prev => [data as InventoryItem, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const updateInventoryItem = async (updatedItem: Tables<'inventory_items'>) => {
    const { data, error } = await supabase.from('inventory_items').update(updatedItem).eq('id', updatedItem.id).select().single();
    if (error) { console.error(error); return; }
    if (data) setInventory(prev => prev.map(item => item.id === data.id ? data as InventoryItem : item).sort((a,b) => a.name.localeCompare(b.name)));
  };

  const removeInventoryItem = async (itemId: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (error) { console.error(error); return; }
    setInventory(prev => prev.filter(item => item.id !== itemId));
  };

  const addMember = async (memberData: Omit<TablesInsert<'members'>, 'id' | 'created_at' | 'join_date'>) => {
    const { data, error } = await supabase.from('members').insert(memberData).select().single();
    if (error) { console.error(error); return; }
    if (data) setMembers(prev => [{...data, joinDate: new Date(data.join_date)} as Member, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const updateMember = async (updatedMember: Tables<'members'>) => {
    const { data, error } = await supabase.from('members').update(updatedMember).eq('id', updatedMember.id).select().single();
    if (error) { console.error(error); return; }
    if (data) setMembers(prev => prev.map(m => m.id === data.id ? {...data, joinDate: new Date(data.join_date)} as Member : m).sort((a,b) => a.name.localeCompare(b.name)));
  };

  const addSale = async (saleData: Omit<TablesInsert<'sales'>, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase.from('sales').insert(saleData).select().single();
    if (error) { console.error(error); return; }
    if (data) setSales(prev => [data as Sale, ...prev]);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev].slice(0, 10));
  };

  const clearNotifications = () => setNotifications([]);

  const kitchenOrders = orders.filter(order => order.items.some(item => menuItems.find(mi => mi.id === item.menuItemId)?.category === 'food'));

  return (
    <AppContext.Provider value={{
      menuItems, orders, addOrder, updateOrderStatus, kitchenOrders,
      inventory, addInventoryItem, updateInventoryItem, removeInventoryItem,
      members, addMember, updateMember,
      notifications, addNotification, clearNotifications,
      sales, addSale
    }}>
      {children}
    </AppContext.Provider>
  );
};
