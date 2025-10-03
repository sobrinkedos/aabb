import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem, Order, InventoryItem, InventoryCategory, Member, Sale, OrderItem } from '../types';
import type { Database } from '../types/supabase';
import { useAuth } from './AuthContextSimple';

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
  image_url: item.image_url || undefined,
  // Campos de precificação
  salePrice: (item as any).sale_price || undefined,
  marginPercentage: (item as any).margin_percentage || undefined,
  pricingMethod: (item as any).pricing_method || 'margin'
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
        // Para itens diretos, usar o nome do produto do estoque se disponível
        name: isDirectItem && inventoryItem?.name 
            ? inventoryItem.name 
            : item.name,
        description: item.description || '',
        price: item.price,
        category: item.category as MenuItem['category'],
        // Para itens diretos, usar image_url do inventory_items se disponível
        image_url: isDirectItem && inventoryItem?.image_url 
            ? inventoryItem.image_url 
            : item.image_url || undefined,
        available: item.available,
        preparation_time: item.preparation_time || undefined,
        item_type: (item.item_type as MenuItem['item_type']) || 'prepared',
        direct_inventory_item_id: item.direct_inventory_item_id || undefined,
        // Campos de precificação
        costPerServing: item.cost_per_serving || undefined,
        marginPercentage: item.margin_percentage || undefined,
        pricingMethod: item.pricing_method || 'margin'
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
  menuItems: MenuItem[];
  addMenuItem: (itemData: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  removeMenuItem: (itemId: string) => Promise<void>;
  loadMenuItems: () => Promise<void>;
  
  orders: Order[];
  addOrder: (orderData: { items: Omit<OrderItem, 'id'>[]; tableNumber?: string; employeeId: string; notes?: string; status: Order['status']; }) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  
  kitchenOrders: Order[];
  barOrders: Order[];
  refreshKitchenOrders: () => Promise<void>;
  refreshBarOrders: () => Promise<void>;
  
  inventory: InventoryItem[];
  inventoryCategories: InventoryCategory[];
  addInventoryItem: (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (itemId: string) => Promise<void>;
  
  members: Member[];
  addMember: (memberData: Omit<Member, 'id' | 'joinDate'>) => Promise<void>;
  updateMember: (member: Member) => Promise<void>;
  loadMembers: () => Promise<void>;
  loadFullInventory: () => Promise<void>;
  syncInventoryToMenu: () => Promise<void>;
  
  notifications: string[];
  addNotification: (message: string) => void;
  clearNotifications: () => void;

  // sales: Sale[];
  // addSale: (saleData: Omit<TablesInsert<'sales'>, 'id' | 'timestamp'>) => Promise<void>;
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
  const { user } = useAuth(); // Adicionar hook de autenticação
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  // const [sales, setSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch initial data - OTIMIZADO para carregar apenas dados essenciais
  useEffect(() => {
    const fetchData = async () => {
      // CORREÇÃO: Só carregar dados se usuário estiver autenticado
      if (!user) {
        console.log('AppContext: Usuário não autenticado, não carregando dados');
        return;
      }

      try {
        // Buscar empresa do usuário atual
        const { data: usuarioEmpresa, error: empresaError } = await supabase
          .from('usuarios_empresa')
          .select('empresa_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .single();

        if (empresaError || !usuarioEmpresa) {
          console.error('AppContext: Erro ao buscar empresa do usuário:', empresaError);
          return;
        }

        const empresaId = usuarioEmpresa.empresa_id;
        console.log('AppContext: Carregando dados para empresa:', empresaId);

        // Carregar apenas inventory para dashboard (estoque baixo)
        const inventoryData = await supabase.rpc('get_low_stock_items', { limit_count: 10 });

        // Carregar categorias FILTRADAS por empresa
        const categoriesData = await supabase
          .from('inventory_categories')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('is_active', true)
          .order('name');

        console.log('AppContext: Categorias carregadas:', categoriesData.data?.length || 0);

        if (inventoryData.data) setInventory(inventoryData.data.map(fromInventorySupabase));
        if (categoriesData.data) setInventoryCategories(categoriesData.data.map(fromInventoryCategorySupabase));
        
        // Menu items e members serão carregados sob demanda
      } catch (error) {
        console.error('AppContext: Erro ao carregar dados:', error);
      }
    };
    fetchData();
  }, [user]); // Depende do usuário logado



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


  const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    console.log('=== addMenuItem INICIADO ===');
    console.log('Dados recebidos:', itemData);
    
    const itemToInsert: any = {
      name: itemData.name,
      description: itemData.description || null,
      price: itemData.price,
      category: itemData.category,
      available: itemData.available,
      preparation_time: itemData.preparation_time || null,
      item_type: itemData.item_type || 'prepared',
      direct_inventory_item_id: itemData.direct_inventory_item_id || null,
      image_url: itemData.image_url || null
    };
    
    console.log('Dados formatados para Supabase:', itemToInsert);
    
    const { data, error } = await supabase.from('menu_items').insert(itemToInsert).select().single();
    
    console.log('Resposta do Supabase:');
    console.log('- Data:', data);
    console.log('- Error:', error);
    
    if (error) { 
      console.error('=== ERRO NO SUPABASE ===');
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Detalhes do erro:', error.details);
      console.error('Hint do erro:', error.hint);
      throw error;
    }
    if (data) {
      console.log('Item inserido com sucesso, atualizando estado...');
      setMenuItems(prev => [fromMenuItemSupabase(data), ...prev].sort((a,b) => a.name.localeCompare(b.name)));
      addNotification(`Novo prato "${(data as any).name}" adicionado ao cardápio!`);
      console.log('Estado atualizado com sucesso!');
    }
    console.log('=== addMenuItem FINALIZADO ===');
  };

  const updateMenuItem = async (updatedItem: MenuItem) => {
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
    if (error) { console.error(error); return; }
    if (data) {
      setMenuItems(prev => prev.map(item => item.id === (data as any).id ? fromMenuItemSupabase(data) : item).sort((a,b) => a.name.localeCompare(b.name)));
      addNotification(`Prato "${(data as any).name}" atualizado!`);
    }
  };

  const removeMenuItem = async (itemId: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) { console.error(error); return; }
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    addNotification('Prato removido do cardápio!');
  };

  const addOrder = async (orderData: { items: Omit<OrderItem, 'id'>[]; tableNumber?: string; employeeId: string; notes?: string; status: Order['status']; }) => {
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
    if (orderError || !newOrder) {
      console.error('Error creating order:', orderError); return;
    }
    
    const orderItemsToInsert: any[] = items.map(item => ({ 
        order_id: (newOrder as any).id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsError) {
        console.error('Error creating order items:', itemsError);
    } else {
        addNotification(`Novo pedido #${(newOrder as any).id.slice(0, 4)} criado!`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      console.log('🔄 updateOrderStatus chamado:', { orderId, status });
      
      // CORREÇÃO: Para comandas, usar CommandManager
      if (orderId.startsWith('comanda-')) {
        console.log('🍽️ Processando comanda com CommandManager');
        
        try {
          const { CommandManager } = await import('../services/command-manager');
          const commandManager = CommandManager.getInstance();
          
          // Extrair comandaId do orderId (formato: comanda-{uuid}-{timestamp})
          const comandaId = orderId.replace('comanda-', '').split('-').slice(0, 5).join('-');
          
          console.log('📋 Buscando comanda:', comandaId);
          
          // Buscar comanda
          let comanda = await commandManager.buscarComanda(comandaId);
          
          // Se não encontrar, criar uma comanda de teste
          if (!comanda) {
            console.log('⚠️ Comanda não encontrada, criando uma de teste');
            comanda = await commandManager.criarComanda({
              funcionario_id: 'user-demo',
              quantidade_pessoas: 1,
              observacoes: `Comanda de teste para ${orderId}`
            });
            
            // Adicionar um item de teste
            await commandManager.adicionarItem(comanda.id, {
              produto_id: 'prod-001',
              nome_produto: 'Hambúrguer Teste',
              quantidade: 1,
              preco_unitario: 25.90,
              observacoes: 'Item de teste'
            });
            
            // Recarregar comanda com itens
            comanda = await commandManager.buscarComanda(comanda.id);
          }
          
          // Atualizar status de todos os itens pendentes
          if (comanda?.itens) {
            const itensPendentes = comanda.itens.filter(item => 
              item.status === 'pendente' || item.status === 'preparando'
            );
            
            console.log(`🔄 Atualizando ${itensPendentes.length} itens da comanda`);
            
            for (const item of itensPendentes) {
              // Mapear status da Order para ItemStatus
              let itemStatus: any;
              switch (status) {
                case 'pending':
                  itemStatus = 'pendente';
                  break;
                case 'preparing':
                  itemStatus = 'preparando';
                  break;
                case 'ready':
                  itemStatus = 'pronto';
                  break;
                case 'delivered':
                  itemStatus = 'entregue';
                  break;
                default:
                  itemStatus = status;
              }
              
              await commandManager.atualizarStatusItem(comanda.id, item.id, itemStatus);
            }
            
            console.log('✅ Itens da comanda atualizados com sucesso!');
          }
          
          // CORREÇÃO: Também atualizar no Supabase para refletir na interface
          console.log('🔄 Atualizando também no Supabase para refletir na interface...');
          
          try {
            // Buscar itens da comanda no Supabase
            const { data: supabaseItems, error: fetchError } = await supabase
              .from('comanda_items')
              .select('*')
              .eq('comanda_id', comandaId)
              .in('status', ['pending', 'preparing', 'ready']);

            if (fetchError) {
              console.warn('⚠️ Erro ao buscar itens no Supabase:', fetchError);
            } else if (supabaseItems && supabaseItems.length > 0) {
              // Atualizar todos os itens no Supabase
              const { error: updateError } = await supabase
                .from('comanda_items')
                .update({ status } as any)
                .eq('comanda_id', comandaId)
                .in('status', ['pending', 'preparing', 'ready']);

              if (updateError) {
                console.warn('⚠️ Erro ao atualizar no Supabase:', updateError);
              } else {
                console.log('✅ Supabase também atualizado!');
              }
            } else {
              console.log('ℹ️ Nenhum item encontrado no Supabase para atualizar');
            }
          } catch (supabaseError) {
            console.warn('⚠️ Erro na sincronização com Supabase:', supabaseError);
          }
          
          // Atualizar estado local imediatamente para feedback visual
          console.log('🔄 Atualizando estado local para feedback imediato...');
          
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId 
                ? { ...order, status, updatedAt: new Date() }
                : order
            )
          );
          
          // Recarregar pedidos do servidor
          console.log('🔄 Recarregando pedidos do servidor...');
          await fetchKitchenOrders();
          await fetchBarOrders();
          
          console.log('✅ Processo completo finalizado!');
          return;
          
        } catch (commandError) {
          console.error('❌ Erro no CommandManager:', commandError);
          console.log('🔄 Continuando com lógica original...');
        }
      }
      
      // Verificar se é um pedido de balcão (começa com 'balcao-')
      if (orderId.startsWith('balcao-')) {
        // Extrair o ID real do pedido de balcão
        const realBalcaoOrderId = orderId.replace('balcao-', '');
        console.log('Atualizando pedido de balcão:', realBalcaoOrderId);
        
        // Para pedidos de balcão, atualizar o status do pedido inteiro
        // Mapear status da Order para status do balcao_order
        let balcaoStatus: string;
        switch (status) {
          case 'pending':
            balcaoStatus = 'paid';
            break;
          case 'preparing':
            balcaoStatus = 'preparing';
            break;
          case 'ready':
            balcaoStatus = 'ready';
            break;
          default:
            balcaoStatus = status;
        }
        
        const { error } = await supabase
          .from('balcao_orders')
          .update({ 
            status: balcaoStatus,
            preparation_started_at: status === 'preparing' ? new Date().toISOString() : undefined,
            preparation_completed_at: status === 'ready' ? new Date().toISOString() : undefined
          } as any)
          .eq('id', realBalcaoOrderId);

        if (error) throw error;
        console.log('Pedido de balcão atualizado com sucesso');
      } else {
        // CORREÇÃO: Usar CommandManager para comandas
        console.log('🔄 Processando comanda com CommandManager');
        
        // Importar CommandManager
        const { CommandManager } = await import('../services/command-manager');
        const commandManager = CommandManager.getInstance();
        
        // Extrair comandaId do orderId
        let realComandaId: string;
        let timeKey: string;
        
        if (orderId.startsWith('comanda-')) {
          // Formato: comanda-{uuid}-{timeKey}
          // Remover o prefixo 'comanda-'
          const withoutPrefix = orderId.replace('comanda-', '');
          
          // Encontrar onde termina o UUID (após 5 grupos separados por hífen)
          // UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          const uuidMatch = withoutPrefix.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(.+)$/i);
          
          if (uuidMatch) {
            realComandaId = uuidMatch[1];
            timeKey = uuidMatch[2];
          } else {
            // Fallback: assumir que é só o UUID sem timestamp
            realComandaId = withoutPrefix;
            timeKey = '';
          }
        } else {
          // Formato original sem prefixo
          const parts = orderId.split('-');
          realComandaId = parts.slice(0, 5).join('-');
          timeKey = parts.slice(5).join('-');
        }
        
        console.log('Decomposição do ID:', { orderId, realComandaId, timeKey });
        
        // Validar se o realComandaId é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(realComandaId)) {
          console.error('ID da comanda inválido:', realComandaId);
          throw new Error(`ID da comanda inválido: ${realComandaId}`);
        }

        // Se não há timeKey, usar abordagem baseada em timestamp
        if (!timeKey) {
          // Buscar itens mais recentes da comanda
          const { data: currentItems, error: fetchError } = await supabase
            .from('comanda_items')
            .select('*')
            .eq('comanda_id', realComandaId)
            .in('status', ['pending', 'preparing', 'ready'])
            .order('added_at', { ascending: false });

          if (fetchError) {
            console.error('Erro na busca dos itens da comanda:', fetchError);
            throw fetchError;
          }

          if (currentItems && currentItems.length > 0) {
            const itemIds = currentItems.map(item => (item as any).id);
            console.log('Atualizando todos os itens pendentes:', itemIds, 'para status:', status);
            
            const { error } = await supabase
              .from('comanda_items')
              .update({ status } as any)
              .in('id', itemIds);

            if (error) throw error;
            console.log('Atualização realizada com sucesso');
          } else {
            console.log('Nenhum item encontrado para atualizar');
          }
        } else {
          // Usar timeKey para filtrar itens específicos
          // Converter timeKey (formato: "ano-mês-dia-hora-minuto") para intervalo de tempo em UTC
          const timeKeyParts = timeKey.split('-');
          console.log('Partes do timeKey:', timeKeyParts);
          
          const [year, month, day, hour, minute] = timeKeyParts.map(Number);
          console.log('Valores parseados:', { year, month, day, hour, minute });
          
          // Validar se todos os valores são números válidos
          if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
            console.error('❌ Valores de data inválidos:', { year, month, day, hour, minute });
            throw new Error(`Valores de data inválidos no timeKey: ${timeKey}`);
          }

          // Buscar itens específicos deste pedido baseado no timestamp
          const { data: currentItems, error: fetchError } = await supabase
            .from('comanda_items')
            .select('*')
            .eq('comanda_id', realComandaId)
            .in('status', ['pending', 'preparing', 'ready']);

          if (fetchError) {
            console.error('Erro na busca dos itens da comanda:', fetchError);
            throw fetchError;
          }

          // Filtrar itens que pertencem a este pedido específico (mesmo minuto)
          const itemsToUpdate = currentItems?.filter(item => {
            const addedAt = new Date((item as any).added_at);
            const itemTimeKey = `${addedAt.getFullYear()}-${addedAt.getMonth()}-${addedAt.getDate()}-${addedAt.getHours()}-${addedAt.getMinutes()}`;
            return timeKey === itemTimeKey;
          }) || [];

          console.log('Itens encontrados para atualizar:', itemsToUpdate.length);

          // Atualizar apenas os itens deste pedido específico
          if (itemsToUpdate.length > 0) {
            const itemIds = itemsToUpdate.map(item => (item as any).id);
            console.log('Atualizando itens:', itemIds, 'para status:', status);
            
            const { error } = await supabase
              .from('comanda_items')
              .update({ status } as any)
              .in('id', itemIds);

            if (error) throw error;
            console.log('Atualização realizada com sucesso');
          } else {
            console.log('Nenhum item encontrado para atualizar');
          }
        }
      }
      
      // Recarregar pedidos da cozinha e do bar
      await fetchKitchenOrders();
      await fetchBarOrders();
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    console.log('📦 Adicionando item ao inventário:', itemData);
    
    // CORREÇÃO CRÍTICA: Usar empresa do usuário logado, não hardcoded
    if (!user) {
      console.error('❌ Usuário não autenticado');
      alert('Você precisa estar logado para adicionar itens');
      return;
    }

    // Buscar empresa do usuário atual
    const { data: usuarioEmpresa, error: empresaError } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single();

    if (empresaError || !usuarioEmpresa) {
      console.error('❌ Erro ao buscar empresa do usuário:', empresaError);
      alert('Erro: Não foi possível identificar sua empresa. Entre em contato com o suporte.');
      return;
    }

    const empresaId = usuarioEmpresa.empresa_id;
    console.log('🏢 Usando empresa do usuário logado:', empresaId);

    // Validar dados obrigatórios
    if (!itemData.name || !itemData.unit) {
      console.error('❌ Dados obrigatórios faltando:', { name: itemData.name, unit: itemData.unit });
      alert('Nome e unidade são obrigatórios!');
      return;
    }

    const itemToInsert: any = {
        name: itemData.name.trim(),
        category_id: itemData.categoryId || null,
        current_stock: Number(itemData.currentStock) || 0,
        min_stock: Number(itemData.minStock) || 0,
        unit: itemData.unit.trim(),
        cost: itemData.cost ? Number(itemData.cost) : null,
        supplier: itemData.supplier?.trim() || null,
        available_for_sale: Boolean(itemData.availableForSale),
        image_url: itemData.image_url?.trim() || null,
        empresa_id: empresaId,
        // Campos de precificação
        sale_price: itemData.salePrice ? Number(itemData.salePrice) : null,
        margin_percentage: itemData.marginPercentage ? Number(itemData.marginPercentage) : null,
        pricing_method: itemData.pricingMethod || 'margin'
    };
    
    console.log('📤 Dados para inserir (validados):', itemToInsert);
    
    // Verificar se já existe um item com o mesmo nome para esta empresa
    console.log('🔍 Verificando se item já existe...');
    const { data: existingItems, error: checkError } = await supabase
      .from('inventory_items')
      .select('id, name')
      .eq('name', itemToInsert.name)
      .eq('empresa_id', empresaId);
    
    if (checkError) {
      console.error('❌ Erro ao verificar item existente:', checkError);
      alert('Erro ao verificar se o item já existe: ' + checkError.message);
      return;
    }
    
    if (existingItems && existingItems.length > 0) {
      console.warn('⚠️ Item já existe:', existingItems[0]);
      alert('Já existe um item com este nome no inventário!');
      return;
    }
    
    console.log('✅ Nome disponível, prosseguindo com inserção...');
    
    // Inserção direta e simples
    console.log('🔄 Inserindo item...');
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(itemToInsert)
      .select()
      .single();
    
    console.log('📝 Resultado da inserção:', { data, error });
    
    if (error) { 
      console.error('❌ Erro ao inserir item:', error);
      console.error('❌ Detalhes completos do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        statusCode: (error as any).statusCode,
        statusText: (error as any).statusText
      });
      
      alert('Erro ao salvar produto: ' + error.message + ' (Código: ' + error.code + ')');
      return; 
    }
    if (data) {
      console.log('✅ Item inserido com sucesso!');
      setInventory(prev => [fromInventorySupabase(data), ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    }
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
    console.log('🔄 Atualizando item do inventário:', updatedItem);
    
    // CORREÇÃO: Buscar empresa do usuário logado
    if (!user) {
      console.error('❌ Usuário não autenticado');
      alert('Você precisa estar logado para atualizar itens');
      return;
    }

    // Buscar empresa do usuário atual
    const { data: usuarioEmpresa, error: empresaError } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single();

    if (empresaError || !usuarioEmpresa) {
      console.error('❌ Erro ao buscar empresa do usuário:', empresaError);
      alert('Erro: Não foi possível identificar sua empresa. Entre em contato com o suporte.');
      return;
    }

    const empresaId = usuarioEmpresa.empresa_id;
    
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
        last_updated: new Date().toISOString(),
        empresa_id: empresaId, // Usar empresa do usuário logado
        // Campos de precificação
        sale_price: updatedItem.salePrice ? Number(updatedItem.salePrice) : null,
        margin_percentage: updatedItem.marginPercentage ? Number(updatedItem.marginPercentage) : null,
        pricing_method: updatedItem.pricingMethod || 'margin'
    };
    
    console.log('📤 Dados para atualizar:', itemToUpdate);
    
    const { data, error } = await supabase.from('inventory_items').update(itemToUpdate).eq('id', updatedItem.id).select().single();
    
    console.log('📝 Resultado da atualização:', { data, error });
    
    if (error) { 
      console.error('❌ Erro ao atualizar item:', error); 
      alert('Erro ao atualizar produto: ' + error.message);
      return; 
    }
    if (data) {
      console.log('✅ Item atualizado com sucesso!');
      setInventory(prev => prev.map(item => item.id === data.id ? fromInventorySupabase(data) : item).sort((a,b) => a.name.localeCompare(b.name)));
      
      // Recarregar menu items se o item está disponível para venda
      if (data.available_for_sale) {
        console.log('🔄 Recarregando menu items devido à atualização de precificação...');
        await loadMenuItems(true);
      }
    }
  };

  const removeInventoryItem = async (itemId: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (error) { console.error(error); return; }
    setInventory(prev => prev.filter(item => item.id !== itemId));
  };

  const addMember = async (memberData: Omit<Member, 'id' | 'joinDate'>) => {
    const memberToInsert: any = {
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
    const memberToUpdate: any = {
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

  // const addSale = async (saleData: Omit<TablesInsert<'sales'>, 'id' | 'timestamp'>) => {
  //   const { data, error } = await supabase.from('sales').insert(saleData).select().single();
  //   if (error) { console.error(error); return; }
  //   if (data) setSales(prev => [data as Sale, ...prev]);
  // };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev].slice(0, 10));
  };

  const clearNotifications = () => setNotifications([]);

  // Funções de carregamento lazy
  const loadMenuItems = useCallback(async (forceReload = false) => {
    console.log('📋 Carregando menu items...', forceReload ? '(FORÇADO)' : '');
    
    // Determinar empresa_id baseado no ambiente
    const currentUrl = window.location.hostname;
    const isProduction = currentUrl.includes('vercel.app') || 
                        currentUrl.includes('aabb-system.vercel.app') ||
                        import.meta.env.VITE_ENVIRONMENT === 'production' || 
                        import.meta.env.VERCEL_ENV === 'production' ||
                        import.meta.env.VITE_SUPABASE_URL?.includes('jtfdzjmravketpkwjkvp');
    
    const empresaId = '9e445c5a-a382-444d-94f8-9d126ed6414e'; // Sempre usar empresa de produção
    
    console.log('🏢 Carregando menu items para empresa_id:', empresaId);
    
    const { data, error } = await supabase.from('menu_items').select(`
      *,
      inventory_items!left(name, image_url, current_stock, available_for_sale)
    `)
    .eq('empresa_id', empresaId)
    .eq('available', true)
    .order('category')
    .order('name');
    
    if (error) {
      console.error('Erro ao carregar menu items:', error);
      return;
    }
    
    console.log('📋 Menu items carregados:', data?.length || 0);
    if (data) {
      setMenuItems(data.map(fromMenuItemSupabase));
      console.log('💰 Preços atualizados dos menu items:', data.map(item => ({ name: item.name, price: item.price })));
    }
  }, []); // Sem dependências pois usa valores estáticos

  const loadMembers = async () => {
    if (members.length > 0) return; // Já carregado
    
    const { data, error } = await supabase.from('members').select('*').order('name');
    
    if (error) {
      console.error('Erro ao carregar members:', error);
      return;
    }
    
    if (data) setMembers(data.map(fromMemberSupabase));
  };

  const loadFullInventory = useCallback(async () => {
    console.log('📦 Carregando inventário completo...');
    
    // CORREÇÃO: Usar empresa do usuário logado
    if (!user) {
      console.log('⚠️ Usuário não autenticado, não carregando inventário');
      return;
    }

    // Buscar empresa do usuário atual
    const { data: usuarioEmpresa, error: empresaError } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single();

    if (empresaError || !usuarioEmpresa) {
      console.error('❌ Erro ao buscar empresa do usuário:', empresaError);
      return;
    }

    const empresaId = usuarioEmpresa.empresa_id;
    console.log('🏢 Carregando inventário para empresa do usuário:', empresaId);

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('name');
    
    if (error) {
      console.error('❌ Erro ao carregar inventory completo:', error);
      return;
    }
    
    console.log('✅ Inventário carregado:', data?.length || 0, 'itens');
    if (data) setInventory(data.map(fromInventorySupabase));
  }, [user]); // Depende do usuário logado

  // Função para sincronizar produtos do inventário com o menu
  const syncInventoryToMenu = useCallback(async () => {
    console.log('🔄 Sincronizando produtos do inventário com o menu...');
    
    if (!user) {
      console.log('⚠️ Usuário não autenticado, não sincronizando');
      return;
    }

    try {
      // Buscar empresa do usuário atual
      const { data: usuarioEmpresa, error: empresaError } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (empresaError || !usuarioEmpresa) {
        console.error('❌ Erro ao buscar empresa do usuário:', empresaError);
        return;
      }

      const empresaId = usuarioEmpresa.empresa_id;

      // Buscar produtos do inventário marcados para venda
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('available_for_sale', true);

      if (inventoryError) {
        console.error('❌ Erro ao buscar produtos do inventário:', inventoryError);
        return;
      }

      if (!inventoryItems || inventoryItems.length === 0) {
        console.log('📦 Nenhum produto marcado para venda encontrado');
        return;
      }

      console.log('📦 Produtos marcados para venda:', inventoryItems.length);

      // Buscar itens do menu existentes do tipo 'direct'
      const { data: existingMenuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('direct_inventory_item_id')
        .eq('empresa_id', empresaId)
        .eq('item_type', 'direct');

      console.log('🔍 Itens do menu existentes:', existingMenuItems, 'Erro:', menuError);

      if (menuError) {
        console.error('❌ Erro ao buscar itens do menu:', menuError);
        // Continuar mesmo com erro para tentar criar os itens
      }

      const existingInventoryIds = new Set(
        existingMenuItems?.map(item => item.direct_inventory_item_id).filter(Boolean) || []
      );

      console.log('🔍 IDs de inventário já no menu:', Array.from(existingInventoryIds));

      // Filtrar produtos que ainda não têm item no menu
      const newInventoryItems = inventoryItems.filter(
        item => !existingInventoryIds.has(item.id)
      );

      console.log('🆕 Produtos para criar no menu:', newInventoryItems.length, newInventoryItems.map(i => i.name));

      if (newInventoryItems.length === 0) {
        console.log('✅ Todos os produtos já estão sincronizados com o menu');
        return;
      }

      console.log('🆕 Criando', newInventoryItems.length, 'novos itens no menu');

      // Criar itens do menu para os produtos do inventário
      const menuItemsToCreate = newInventoryItems.map(item => ({
        name: item.name,
        description: `Produto do estoque: ${item.name}`,
        price: (item as any).sale_price || item.cost * 1.5, // Usar preço de venda ou custo + 50%
        category: 'Produtos do Estoque',
        available: true,
        item_type: 'direct',
        direct_inventory_item_id: item.id,
        empresa_id: empresaId,
        image_url: item.image_url,
        preparation_time: 0 // Produtos diretos não precisam de preparo
      }));

      console.log('📝 Tentando criar itens:', menuItemsToCreate);

      const { data: createdItems, error: createError } = await supabase
        .from('menu_items')
        .insert(menuItemsToCreate)
        .select();

      if (createError) {
        console.error('❌ Erro ao criar itens do menu:', createError);
        console.error('📋 Dados que tentamos inserir:', menuItemsToCreate);
        
        // Tentar criar um por vez para identificar qual está falhando
        for (const item of menuItemsToCreate) {
          console.log('🔄 Tentando criar item individual:', item.name);
          const { data: singleItem, error: singleError } = await supabase
            .from('menu_items')
            .insert([item])
            .select();
            
          if (singleError) {
            console.error(`❌ Erro ao criar ${item.name}:`, singleError);
          } else {
            console.log(`✅ Criado ${item.name}:`, singleItem);
          }
        }
        return;
      }

      console.log('✅ Criados', createdItems?.length || 0, 'novos itens no menu:', createdItems);
      
      // Recarregar menu items
      await loadMenuItems();
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  }, [user]);

  // Buscar pedidos da cozinha a partir dos comanda_items
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [barOrders, setBarOrders] = useState<Order[]>([]);

  // Função para buscar pedidos do bar (todos os itens)
  const fetchBarOrders = async () => {
    try {
      // Buscar pedidos de comandas
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
        .in('status', ['pending', 'preparing', 'ready'])
        .order('added_at', { ascending: true });

      if (comandaError) throw comandaError;

      // Buscar pedidos de balcão (apenas pagos)
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
        .in('balcao_order.status', ['paid', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (balcaoError) throw balcaoError;

      // Agrupar itens por comanda E por timestamp de adição para criar pedidos separados
      const orderMap = new Map<string, Order>();
      
      // Processar pedidos de comandas
      comandaData?.forEach(item => {
        const comandaId = item.comanda?.id;
        if (!comandaId) return;

        // Criar chave única baseada na comanda + timestamp (agrupando por minuto)
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
          // Incluir dados do menu item diretamente
          menuItem: item.menu_item ? {
            id: item.menu_item.id,
            // Para itens diretos, usar o nome do produto do estoque se disponível
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
           orderMap.set(orderKey, {
             id: orderKey,
             tableNumber: 'Balcão',
             items: [],
             status: item.balcao_order.status === 'paid' ? 'pending' as Order['status'] : 
                    item.balcao_order.status === 'preparing' ? 'preparing' as Order['status'] : 
                    'ready' as Order['status'],
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
           // Incluir dados do menu item diretamente
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

      setBarOrders(Array.from(orderMap.values()));
    } catch (error) {
      console.error('Erro ao buscar pedidos do bar:', error);
    }
  };

  // Função para buscar pedidos da cozinha (apenas itens preparados)
  const fetchKitchenOrders = async () => {
    try {
      // Buscar pedidos de comandas (apenas itens preparados)
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
          menu_item:menu_items!inner(*)
        `)
        .in('status', ['pending', 'preparing'])
        .neq('menu_item.item_type', 'direct') // Excluir itens diretos do estoque
        .order('added_at', { ascending: true });

      if (comandaError) throw comandaError;

      // Buscar pedidos de balcão (apenas itens preparados e pagos)
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
          menu_item:menu_items!inner(*)
        `)
        .in('balcao_order.status', ['paid', 'preparing'])
        .neq('menu_item.item_type', 'direct') // Excluir itens diretos do estoque
        .order('created_at', { ascending: true });

      if (balcaoError) throw balcaoError;

      // Agrupar itens por comanda E por timestamp de adição para criar pedidos separados
      const orderMap = new Map<string, Order>();

      // Processar pedidos de comandas
      comandaData?.forEach(item => {
        const comandaId = item.comanda?.id;
        if (!comandaId) return;

        // Criar chave única baseada na comanda + timestamp (agrupando por minuto)
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
          // Incluir dados do menu item diretamente
          menuItem: item.menu_item ? {
            id: item.menu_item.id,
            name: item.menu_item.name,
            category: item.menu_item.category,
            preparationTime: item.menu_item.preparation_time
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
          orderMap.set(orderKey, {
            id: orderKey,
            tableNumber: 'Balcão',
            items: [],
            status: item.balcao_order.status === 'paid' ? 'pending' as Order['status'] : 'preparing' as Order['status'],
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
          // Incluir dados do menu item diretamente
          menuItem: item.menu_item ? {
            id: item.menu_item.id,
            name: item.menu_item.name,
            category: item.menu_item.category,
            preparationTime: item.menu_item.preparation_time
          } : undefined
        });
        order.total += item.unit_price * item.quantity;
      });

      setKitchenOrders(Array.from(orderMap.values()));
    } catch (error) {
      console.error('Erro ao buscar pedidos da cozinha:', error);
    }
  };

  // Buscar pedidos da cozinha e do bar quando o componente monta
  useEffect(() => {
    fetchKitchenOrders();
    fetchBarOrders();
    
    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'comanda_items'
        },
        (payload) => {
          console.log('🔥 SUBSCRIPTION ATIVADA - comanda_items:', payload);
          console.log('Event Type:', payload.eventType);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          // Aguardar um pouco para garantir que a transação foi commitada
          setTimeout(() => {
            console.log('🔄 Recarregando pedidos da cozinha e bar...');
            fetchKitchenOrders();
            fetchBarOrders();
          }, 100);
          
          // Log adicional para debug
          if (payload.eventType === 'INSERT') {
            console.log('✅ Novo item inserido na comanda');
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Item da comanda atualizado');
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Item da comanda removido');
          }
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
          console.log('🔥 SUBSCRIPTION ATIVADA - comandas:', payload);
          // Recarregar pedidos quando comandas mudarem também
          setTimeout(() => {
            console.log('🔄 Recarregando pedidos da cozinha e bar (comandas)...');
            fetchKitchenOrders();
            fetchBarOrders();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'balcao_orders'
        },
        (payload) => {
          console.log('🔥 SUBSCRIPTION ATIVADA - balcao_orders:', payload);
          console.log('Event Type:', payload.eventType);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          // Verificar se é mudança de status de pending_payment para paid
          if (payload.eventType === 'UPDATE' && 
              payload.old?.status === 'pending_payment' && 
              payload.new?.status === 'paid') {
            console.log('🎉 PEDIDO PAGO DETECTADO! Forçando atualização imediata...');
            // Atualização imediata + fallback
            fetchKitchenOrders();
            fetchBarOrders();
          }
          
          // Recarregar pedidos quando pedidos de balcão mudarem
          setTimeout(() => {
            console.log('🔄 Recarregando pedidos da cozinha e bar (balcão)...');
            fetchKitchenOrders();
            fetchBarOrders();
          }, 1000); // Aumentado para 1000ms para garantir sincronização
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
          console.log('🔥 SUBSCRIPTION ATIVADA - balcao_order_items:', payload);
          console.log('Event Type:', payload.eventType);
          
          // Recarregar pedidos quando itens de balcão mudarem
          setTimeout(() => {
            console.log('🔄 Recarregando pedidos da cozinha e bar (itens balcão)...');
            fetchKitchenOrders();
            fetchBarOrders();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription kitchen-orders:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription ativa e funcionando!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription!');
        }
      });

    return () => {
      console.log('🔌 Desconectando subscription kitchen-orders');
      subscription.unsubscribe();
    };
  }, []);

  // Carregar inventário quando usuário estiver autenticado
  useEffect(() => {
    if (user) {
      console.log('👤 Usuário autenticado, carregando inventário...');
      loadFullInventory();
      loadMembers();
    }
  }, [user, loadFullInventory]);

  // Filtrar apenas pedidos que realmente existem
  const activeKitchenOrders = kitchenOrders.filter(order => order.items.length > 0);

  // Filtrar apenas pedidos que realmente existem
  const activeBarOrders = barOrders.filter(order => order.items.length > 0);

  return (
    <AppContext.Provider value={{
      menuItems, addMenuItem, updateMenuItem, removeMenuItem, loadMenuItems,
      orders, addOrder, updateOrderStatus, 
      kitchenOrders: activeKitchenOrders,
      barOrders: activeBarOrders,
      refreshKitchenOrders: fetchKitchenOrders,
      refreshBarOrders: fetchBarOrders,
      inventory, inventoryCategories, addInventoryItem, updateInventoryItem, removeInventoryItem, loadFullInventory, syncInventoryToMenu,
      members, addMember, updateMember, loadMembers,
      notifications, addNotification, clearNotifications,
      // sales, addSale
    }}>
      {children}
    </AppContext.Provider>
  );
};
