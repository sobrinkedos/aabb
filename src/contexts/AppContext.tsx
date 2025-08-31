import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem, Order, InventoryItem, InventoryCategory, Member, Sale, OrderItem } from '../types';
import { Tables, TablesInsert, TablesUpdate } from '../types/supabase';

// Helper functions to map between Supabase (snake_case) and App (camelCase)

const fromInventorySupabase = (item: Tables<'inventory_items'>): InventoryItem => ({
  id: item.id,
  name: item.name,
  categoryId: item.category_id || undefined,
  currentStock: item.current_stock,
  minStock: item.min_stock,
  unit: item.unit as InventoryItem['unit'],
  lastUpdated: new Date(item.last_updated || item.created_at),
  supplier: item.supplier || undefined,
  cost: item.cost || 0
});

const fromInventoryCategorySupabase = (category: Tables<'inventory_categories'>): InventoryCategory => ({
  id: category.id,
  name: category.name,
  description: category.description || undefined,
  color: category.color || '#6B7280',
  icon: category.icon || undefined,
  isActive: category.is_active || true,
  createdAt: new Date(category.created_at),
  updatedAt: new Date(category.updated_at || category.created_at)
});

const fromMemberSupabase = (member: Tables<'members'>): Member => ({
  id: member.id,
  name: member.name,
  email: member.email,
  phone: member.phone || '',
  avatar: member.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${member.name}`,
  status: member.status as Member['status'],
  joinDate: new Date(member.join_date),
  membershipType: member.membership_type as Member['membershipType']
});

const fromMenuItemSupabase = (item: Tables<'menu_items'>): MenuItem => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    category: item.category as MenuItem['category'],
    image: undefined, // schema doesn't have image
    available: item.available,
    preparationTime: item.preparation_time || undefined
});

const fromOrderSupabase = (order: Tables<'orders'> & { order_items: Tables<'order_items'>[] }): Order => ({
    id: order.id,
    tableNumber: order.table_number || undefined,
    items: order.order_items.map(oi => ({
        id: oi.id.toString(),
        menuItemId: oi.menu_item_id,
        quantity: oi.quantity,
        price: oi.price,
        notes: oi.notes || undefined
    })),
    status: order.status as Order['status'],
    total: order.total,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at || order.created_at),
    employeeId: order.employee_id || '',
    notes: order.notes || undefined
});

interface AppContextType {
  menuItems: MenuItem[];
  orders: Order[];
  addOrder: (orderData: { items: Omit<OrderItem, 'id'>[]; tableNumber?: string; employeeId: string; notes?: string; status: Order['status']; }) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  
  kitchenOrders: Order[];
  
  inventory: InventoryItem[];
  inventoryCategories: InventoryCategory[];
  addInventoryItem: (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (itemId: string) => Promise<void>;
  
  members: Member[];
  addMember: (memberData: Omit<Member, 'id' | 'joinDate'>) => Promise<void>;
  updateMember: (member: Member) => Promise<void>;
  
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
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [menuData, inventoryData, categoriesData, membersData, salesData] = await Promise.all([
        supabase.from('menu_items').select('*'),
        supabase.from('inventory_items').select('*').order('name'),
        supabase.from('inventory_categories').select('*').eq('is_active', true).order('name'),
        supabase.from('members').select('*').order('name'),
        supabase.from('sales').select('*').order('timestamp', { ascending: false }),
      ]);

      if (menuData.data) setMenuItems(menuData.data.map(fromMenuItemSupabase));
      if (inventoryData.data) setInventory(inventoryData.data.map(fromInventorySupabase));
      if (categoriesData.data) setInventoryCategories(categoriesData.data.map(fromInventoryCategorySupabase));
      if (membersData.data) setMembers(membersData.data.map(fromMemberSupabase));
      if (salesData.data) setSales(salesData.data as Sale[]);
    };
    fetchData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const handleOrderChange = async (payload: any) => {
        const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching orders after realtime event:', error);
        } else if (data) {
          const formattedOrders = data.map(fromOrderSupabase);
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

    const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (error) console.error('Error fetching initial orders:', error);
      else if (data) {
        setOrders(data.map(fromOrderSupabase));
      }
    };
    fetchOrders();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);


  const addOrder = async (orderData: { items: Omit<OrderItem, 'id'>[]; tableNumber?: string; employeeId: string; notes?: string; status: Order['status']; }) => {
    const { items, tableNumber, employeeId, notes, status } = orderData;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderToInsert: TablesInsert<'orders'> = {
        table_number: tableNumber,
        employee_id: employeeId,
        notes,
        status,
        total
    };

    const { data: newOrder, error: orderError } = await supabase.from('orders').insert(orderToInsert).select().single();
    if (orderError || !newOrder) {
      console.error('Error creating order:', orderError); return;
    }
    
    const orderItemsToInsert: TablesInsert<'order_items'>[] = items.map(item => ({ 
        order_id: newOrder.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsError) {
        console.error('Error creating order items:', itemsError);
    } else {
        addNotification(`Novo pedido #${newOrder.id.slice(0, 4)} criado!`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const itemToInsert: Omit<TablesInsert<'inventory_items'>, 'id' | 'created_at' | 'last_updated'> = {
        name: itemData.name,
        category_id: itemData.categoryId,
        current_stock: itemData.currentStock,
        min_stock: itemData.minStock,
        unit: itemData.unit,
        cost: itemData.cost,
        supplier: itemData.supplier
    };
    const { data, error } = await supabase.from('inventory_items').insert(itemToInsert).select().single();
    if (error) { console.error(error); return; }
    if (data) setInventory(prev => [fromInventorySupabase(data), ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
    const itemToUpdate: TablesUpdate<'inventory_items'> = {
        name: updatedItem.name,
        category_id: updatedItem.categoryId,
        current_stock: updatedItem.currentStock,
        min_stock: updatedItem.minStock,
        unit: updatedItem.unit,
        cost: updatedItem.cost,
        supplier: updatedItem.supplier,
        last_updated: new Date().toISOString()
    };
    const { data, error } = await supabase.from('inventory_items').update(itemToUpdate).eq('id', updatedItem.id).select().single();
    if (error) { console.error(error); return; }
    if (data) setInventory(prev => prev.map(item => item.id === data.id ? fromInventorySupabase(data) : item).sort((a,b) => a.name.localeCompare(b.name)));
  };

  const removeInventoryItem = async (itemId: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (error) { console.error(error); return; }
    setInventory(prev => prev.filter(item => item.id !== itemId));
  };

  const addMember = async (memberData: Omit<Member, 'id' | 'joinDate'>) => {
    const memberToInsert: Omit<TablesInsert<'members'>, 'id' | 'created_at' | 'join_date'> = {
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        avatar_url: memberData.avatar,
        status: memberData.status,
        membership_type: memberData.membershipType,
    };
    const { data, error } = await supabase.from('members').insert(memberToInsert).select().single();
    if (error) { console.error(error); return; }
    if (data) setMembers(prev => [fromMemberSupabase(data), ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const updateMember = async (updatedMember: Member) => {
    const memberToUpdate: TablesUpdate<'members'> = {
        name: updatedMember.name,
        email: updatedMember.email,
        phone: updatedMember.phone,
        avatar_url: updatedMember.avatar,
        status: updatedMember.status,
        membership_type: updatedMember.membershipType,
    };
    const { data, error } = await supabase.from('members').update(memberToUpdate).eq('id', updatedMember.id).select().single();
    if (error) { console.error(error); return; }
    if (data) setMembers(prev => prev.map(m => m.id === data.id ? fromMemberSupabase(data) : m).sort((a,b) => a.name.localeCompare(b.name)));
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
      inventory, inventoryCategories, addInventoryItem, updateInventoryItem, removeInventoryItem,
      members, addMember, updateMember,
      notifications, addNotification, clearNotifications,
      sales, addSale
    }}>
      {children}
    </AppContext.Provider>
  );
};
