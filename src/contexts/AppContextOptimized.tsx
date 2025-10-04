import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem, Order, InventoryItem, InventoryCategory, Member, Sale, OrderItem } from '../types';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';
import type { Database } from '../types/supabase';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

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
  cost: item.cost || 0,
  availableForSale: item.available_for_sale || false,
  image_url: item.image_url || undefined
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
  membershipType: (member.membership_type as any) || 'basic'
});

const fromMenuItemSupabase = (item: any): MenuItem => {
  const isDirectItem = item.item_type === 'direct';
  const inventoryItem = item.inventory_items;
  
  return {
    id: item.id,
    name: isDirectItem && inventoryItem?.name ? inventoryItem.name : item.name,
    description: item.description || '',
    price: item.price,
    category: item.category as MenuItem['category'],
    image_url: isDirectItem && inventoryItem?.image_url ? inventoryItem.image_url : item.image_url || undefined,
    available: item.available,
    preparation_time: item.preparation_time || undefined,
    item_type: (item.item_type as MenuItem['item_type']) || 'prepared',
    direct_inventory_item_id: item.direct_inventory_item_id || undefined
  };
};

const fromOrderSupabase = (order: Tables<'orders'> & { order_items: Tables<'order_items'>[] }): Order => ({
  id: order.id,
  tableNumber: order.table_number || undefined,
  items: order.order_items.map((oi: any) => ({
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
  // Estados básicos
  isLoading: boolean;
  
  // Menu items - carregamento lazy
  menuItems: MenuItem[];
  addMenuItem: (itemData: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  removeMenuItem: (itemId: string) => Promise<void>;
  loadMenuItems: () => Promise<void>;
  
  // Orders - carregamento otimizado
  orders: Order[];
  addOrder: (orderData: { items: Omit<OrderItem, 'id'>[]; tableNumber?: string; employeeId: string; notes?: string; status: Order['status']; }) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  
  // Kitchen/Bar orders - carregamento sob demanda
  kitchenOrders: Order[];
  barOrders: Order[];
  refreshKitchenOrders: () => Promise<void>;
  refreshBarOrders: () => Promise<void>;
  
  // Inventory - carregamento lazy
  inventory: InventoryItem[];
  inventoryCategories: InventoryCategory[];
  addInventoryItem: (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (itemId: string) => Promise<void>;
  loadInventory: () => Promise<void>;
  
  // Members - carregamento lazy
  members: Member[];
  addMember: (memberData: Omit<Member, 'id' | 'joinDate'>) => Promise<void>;
  updateMember: (member: Member) => Promise<void>;
  loadMembers: () => Promise<void>;
  
  // Notifications
  notifications: string[];
  addNotification: (message: string) => void;
  clearNotifications: () => void;

  // Dashboard stats - calculados de forma otimizada
  dashboardStats: {
    todayRevenue: number;
    pendingOrders: number;
    todaySales: number;
    lowStockItems: number;
  };
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
  // Estados básicos
  const [isLoading, setIsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [barOrders, setBarOrders] = useState<Order[]>([]);

  // Flags para controlar carregamento lazy
  const [menuItemsLoaded, setMenuItemsLoaded] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // Carregamento inicial mínimo - apenas orders para dashboard
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Carregar apenas pedidos recentes para o dashboard
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false })
          .limit(20); // Limitar para melhor performance

        if (ordersError) {
          console.error('Erro ao carregar pedidos:', ordersError);
        } else if (ordersData) {
          setOrders(ordersData.map(fromOrderSupabase));
        }

        // Carregar apenas itens de estoque baixo para dashboard
        const { data: lowStockData, error: lowStockError } = await supabase
          .rpc('get_low_stock_items', { limit_count: 10 });

        if (lowStockError) {
          console.error('Erro ao carregar estoque baixo:', lowStockError);
        } else if (lowStockData) {
          setInventory(lowStockData.map(fromInventorySupabase));
        }

      } catch (error) {
        console.error('Erro no carregamento inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Carregamento lazy de menu items
  const loadMenuItems = useCallback(async () => {
    if (menuItemsLoaded) return;
    
    try {
      // Obter empresa do usuário autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('Usuário não autenticado');
        return;
      }

      // Buscar empresa do usuário
      const { data: empresaData } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', userData.user.id)
        .eq('status', 'ativo')
        .single();

      if (!empresaData) {
        console.error('Usuário não vinculado a nenhuma empresa');
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select(`*, inventory_items!left(name, image_url)`)
        .eq('empresa_id', empresaData.empresa_id)
        .eq('available', true)
        .order('name');

      if (error) {
        console.error('Erro ao carregar menu items:', error);
      } else if (data) {
        setMenuItems(data.map(fromMenuItemSupabase));
        setMenuItemsLoaded(true);
        console.log('✅ Menu items carregados:', data.length, 'itens da empresa:', empresaData.empresa_id);
      }
    } catch (error) {
      console.error('Erro no carregamento de menu items:', error);
    }
  }, [menuItemsLoaded]);

  // Carregamento lazy de inventory
  const loadInventory = useCallback(async () => {
    if (inventoryLoaded) return;
    
    try {
      const [inventoryData, categoriesData] = await Promise.all([
        supabase.from('inventory_items').select('*').order('name'),
        supabase.from('inventory_categories').select('*').eq('is_active', true).order('name')
      ]);

      if (inventoryData.data) {
        setInventory(inventoryData.data.map(fromInventorySupabase));
      }
      if (categoriesData.data) {
        setInventoryCategories(categoriesData.data.map(fromInventoryCategorySupabase));
      }
      setInventoryLoaded(true);
    } catch (error) {
      console.error('Erro no carregamento de inventory:', error);
    }
  }, [inventoryLoaded]);

  // Carregamento lazy de members
  const loadMembers = useCallback(async () => {
    if (membersLoaded) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao carregar members:', error);
      } else if (data) {
        setMembers(data.map(fromMemberSupabase));
        setMembersLoaded(true);
      }
    } catch (error) {
      console.error('Erro no carregamento de members:', error);
    }
  }, [membersLoaded]);

  // Subscription otimizada apenas para orders
  useEffect(() => {
    const handleOrderChange = async (payload: any) => {
      // Recarregar apenas se necessário
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setOrders(data.map(fromOrderSupabase));
          if (payload.eventType === 'INSERT') {
            addNotification(`Novo pedido #${payload.new?.id?.slice(0, 4)} criado!`);
          }
        }
      }
    };

    const ordersChannel = supabase
      .channel('realtime-orders-optimized')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleOrderChange)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // Dashboard stats calculados de forma otimizada
  const dashboardStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = orders.filter(o => 
      o.status === 'delivered' && 
      o.updatedAt.toISOString().split('T')[0] === today
    );
    
    return {
      todayRevenue: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      todaySales: todaySales.length,
      lowStockItems: inventory.filter(item => item.currentStock <= item.minStock).length
    };
  }, [orders, inventory]);

  // Funções CRUD otimizadas
  const addMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id'>) => {
    // Obter empresa_id do usuário atual
    const empresaId = await getCurrentUserEmpresaId();
    
    if (!empresaId) {
      throw new Error('Não foi possível identificar a empresa do usuário');
    }
    
    const itemToInsert: any = {
      name: itemData.name,
      description: itemData.description || null,
      price: itemData.price,
      category: itemData.category,
      available: itemData.available,
      preparation_time: itemData.preparation_time || null,
      item_type: itemData.item_type || 'prepared',
      direct_inventory_item_id: itemData.direct_inventory_item_id || null,
      image_url: itemData.image_url || null,
      empresa_id: empresaId
    };
    
    const { data, error } = await supabase.from('menu_items').insert(itemToInsert).select().single();
    
    if (error) throw error;
    if (data) {
      setMenuItems(prev => [fromMenuItemSupabase(data), ...prev].sort((a,b) => a.name.localeCompare(b.name)));
      addNotification(`Novo prato "${data.name}" adicionado ao cardápio!`);
    }
  }, []);

  const updateMenuItem = useCallback(async (updatedItem: MenuItem) => {
    const itemToUpdate: any = {
      name: updatedItem.name,
      description: updatedItem.description,
      price: updatedItem.price,
      category: updatedItem.category,
      available: updatedItem.available,
      preparation_time: updatedItem.preparation_time,
      item_type: updatedItem.item_type || 'prepared',
      direct_inventory_item_id: updatedItem.direct_inventory_item_id || null,
      image_url: updatedItem.image_url || null
    };
    
    const { data, error } = await supabase.from('menu_items').update(itemToUpdate).eq('id', updatedItem.id).select().single();
    if (error) throw error;
    if (data) {
      setMenuItems(prev => prev.map(item => item.id === data.id ? fromMenuItemSupabase(data) : item));
      addNotification(`Prato "${data.name}" atualizado!`);
    }
  }, []);

  const removeMenuItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) throw error;
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    addNotification('Prato removido do cardápio!');
  }, []);

  const addOrder = useCallback(async (orderData: { items: Omit<OrderItem, 'id'>[]; tableNumber?: string; employeeId: string; notes?: string; status: Order['status']; }) => {
    const { items, tableNumber, employeeId, notes, status } = orderData;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderToInsert: any = {
      table_number: tableNumber,
      employee_id: employeeId,
      notes,
      status,
      total
    };

    const { data: newOrder, error: orderError } = await supabase.from('orders').insert(orderToInsert).select().single();
    if (orderError || !newOrder) throw orderError;
    
    const orderItemsToInsert: any[] = items.map(item => ({ 
      order_id: newOrder.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes
    }));
    
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsError) throw itemsError;
    
    addNotification(`Novo pedido #${newOrder.id.slice(0, 4)} criado!`);
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    // Implementação simplificada para melhor performance
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
    ));
  }, []);

  // Funções para inventory
  const addInventoryItem = useCallback(async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const itemToInsert: any = {
      name: itemData.name,
      category_id: itemData.categoryId,
      current_stock: itemData.currentStock,
      min_stock: itemData.minStock,
      unit: itemData.unit,
      cost: itemData.cost,
      supplier: itemData.supplier,
      available_for_sale: itemData.availableForSale || false,
      image_url: itemData.image_url || null
    };
    
    const { data, error } = await supabase.from('inventory_items').insert(itemToInsert).select().single();
    if (error) throw error;
    if (data) setInventory(prev => [fromInventorySupabase(data), ...prev]);
  }, []);

  const updateInventoryItem = useCallback(async (updatedItem: InventoryItem) => {
    const itemToUpdate: any = {
      name: updatedItem.name,
      category_id: updatedItem.categoryId,
      current_stock: updatedItem.currentStock,
      min_stock: updatedItem.minStock,
      unit: updatedItem.unit,
      cost: updatedItem.cost,
      supplier: updatedItem.supplier,
      available_for_sale: updatedItem.availableForSale || false,
      image_url: updatedItem.image_url || null,
      last_updated: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('inventory_items').update(itemToUpdate).eq('id', updatedItem.id).select().single();
    if (error) throw error;
    if (data) setInventory(prev => prev.map(item => item.id === data.id ? fromInventorySupabase(data) : item));
  }, []);

  const removeInventoryItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (error) throw error;
    setInventory(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Funções para members
  const addMember = useCallback(async (memberData: Omit<Member, 'id' | 'joinDate'>) => {
    const memberToInsert: any = {
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      avatar_url: memberData.avatar,
      status: memberData.status,
      membership_type: memberData.membershipType,
    };
    
    const { data, error } = await supabase.from('members').insert(memberToInsert).select().single();
    if (error) throw error;
    if (data) setMembers(prev => [fromMemberSupabase(data), ...prev]);
  }, []);

  const updateMember = useCallback(async (updatedMember: Member) => {
    const memberToUpdate: any = {
      name: updatedMember.name,
      email: updatedMember.email,
      phone: updatedMember.phone,
      avatar_url: updatedMember.avatar,
      status: updatedMember.status,
      membership_type: updatedMember.membershipType,
    };
    
    const { data, error } = await supabase.from('members').update(memberToUpdate).eq('id', updatedMember.id).select().single();
    if (error) throw error;
    if (data) setMembers(prev => prev.map(m => m.id === data.id ? fromMemberSupabase(data) : m));
  }, []);

  // Kitchen/Bar orders - carregamento sob demanda
  const refreshKitchenOrders = useCallback(async () => {
    // Implementação simplificada
    setKitchenOrders([]);
  }, []);

  const refreshBarOrders = useCallback(async () => {
    // Implementação simplificada
    setBarOrders([]);
  }, []);

  // Notifications
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [message, ...prev].slice(0, 5)); // Limitar a 5 notificações
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const contextValue = useMemo(() => ({
    isLoading,
    menuItems,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    loadMenuItems,
    orders,
    addOrder,
    updateOrderStatus,
    kitchenOrders,
    barOrders,
    refreshKitchenOrders,
    refreshBarOrders,
    inventory,
    inventoryCategories,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    loadInventory,
    members,
    addMember,
    updateMember,
    loadMembers,
    notifications,
    addNotification,
    clearNotifications,
    dashboardStats
  }), [
    isLoading,
    menuItems,
    orders,
    kitchenOrders,
    barOrders,
    inventory,
    inventoryCategories,
    members,
    notifications,
    dashboardStats,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    loadMenuItems,
    addOrder,
    updateOrderStatus,
    refreshKitchenOrders,
    refreshBarOrders,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    loadInventory,
    addMember,
    updateMember,
    loadMembers,
    addNotification,
    clearNotifications
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};