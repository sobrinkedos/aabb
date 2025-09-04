import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem, InventoryItem } from '../types';

export const useMenuItems = (includeDirectItems: boolean = false) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching menu items...');
      
      // Verificar se o Supabase está configurado
      try {
        // Teste simples de conexão
        const { data: testData, error: testError } = await supabase
          .from('menu_items')
          .select('count')
          .limit(1);
          
        if (testError && testError.message.includes('JWT')) {
          // Erro de autenticação indica que Supabase não está configurado
          throw new Error('Supabase não configurado');
        }
      } catch (configError) {
        console.error('Supabase não configurado. Criando dados mock...', configError);
        
        // Dados de exemplo quando não há configuração
        const mockItems: MenuItem[] = [
          {
            id: 'mock-1',
            name: 'Cerveja Pilsen',
            description: 'Cerveja gelada 350ml',
            price: 8.50,
            category: 'Bebidas',
            image_url: undefined,
            available: true,
            preparation_time: 0,
            item_type: 'prepared',
            direct_inventory_item_id: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            name: 'Refrigerante',
            description: 'Coca-Cola 350ml',
            price: 5.00,
            category: 'Bebidas',
            image_url: undefined,
            available: true,
            preparation_time: 0,
            item_type: 'prepared',
            direct_inventory_item_id: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-3',
            name: 'Porção de Batata',
            description: 'Batata frita crocante',
            price: 15.00,
            category: 'Petiscos',
            image_url: undefined,
            available: true,
            preparation_time: 15,
            item_type: 'prepared',
            direct_inventory_item_id: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setMenuItems(mockItems);
        setError('Dados de exemplo sendo exibidos. Configure o Supabase para usar dados reais.');
        return;
      }
      
      // Primeiro, vamos verificar se há dados na tabela
      const { data: allData, error: allError } = await supabase
        .from('menu_items')
        .select('*');
      
      console.log('All menu items:', allData, 'Error:', allError);
      
      // Buscar itens do menu baseado no filtro
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          inventory_items!left(
            image_url,
            current_stock,
            min_stock,
            unit,
            available_for_sale
          )
        `)
        .eq('available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      // Se não incluir itens diretos, filtrar apenas preparados
      if (!includeDirectItems) {
        query = query.neq('item_type', 'direct');
      }
      
      const { data, error } = await query;

      console.log('Available menu items:', data, 'Error:', error);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No menu items found - creating sample data');
        // Se não há dados, vamos criar alguns de exemplo
        const sampleItems = [
          {
            name: 'Cerveja Pilsen',
            description: 'Cerveja gelada 350ml',
            price: 8.50,
            category: 'Bebidas',
            available: true
          },
          {
            name: 'Refrigerante',
            description: 'Coca-Cola 350ml',
            price: 5.00,
            category: 'Bebidas',
            available: true
          }
        ];
        
        const { data: insertData, error: insertError } = await supabase
          .from('menu_items')
          .insert(sampleItems)
          .select();
          
        console.log('Sample data inserted:', insertData, 'Error:', insertError);
        
        if (!insertError && insertData) {
          const mappedItems: MenuItem[] = insertData.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category || '',
            image_url: item.image_url || undefined,
            available: (item as any).available || false,
            preparation_time: (item as any).preparation_time || 0,
            item_type: (item as any).item_type || 'prepared',
            direct_inventory_item_id: (item as any).direct_inventory_item_id || undefined,
            created_at: item.created_at || undefined,
            updated_at: (item as any).updated_at || undefined
          }));
          setMenuItems(mappedItems);
          return;
        }
      }
      
      // Mapear para a estrutura esperada
      const mappedItems: MenuItem[] = (data || []).map(item => {
        const inventoryItem = (item as any).inventory_items;
        
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
          category: item.category || '',
          // Para itens diretos, usar image_url do inventory_items se disponível
          image_url: (item as any).item_type === 'direct' && inventoryItem?.image_url 
            ? inventoryItem.image_url 
            : item.image_url || undefined,
          available: (item as any).available || false,
          preparation_time: (item as any).preparation_time || 0,
          item_type: (item as any).item_type || 'prepared',
          direct_inventory_item_id: (item as any).direct_inventory_item_id || undefined,
          created_at: item.created_at || undefined,
          updated_at: (item as any).updated_at || undefined,
          inventory_items: inventoryItem ? {
            id: '',
            name: '',
            currentStock: inventoryItem.current_stock || 0,
            minStock: inventoryItem.min_stock || 0,
            unit: inventoryItem.unit || 'unidades',
            lastUpdated: new Date(),
            cost: 0,
            availableForSale: inventoryItem.available_for_sale || false,
            image_url: inventoryItem.image_url || undefined
          } : undefined
        };
      });
      
      console.log('Mapped items:', mappedItems);
      setMenuItems(mappedItems);
    } catch (err) {
      console.error('Error in fetchMenuItems:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens do menu');
    } finally {
      setLoading(false);
    }
  };

  const getItemsByCategory = (category: string) => {
    return menuItems.filter(item => item.category === category);
  };

  const getAvailableItems = () => {
    return menuItems.filter(item => item.available);
  };

  useEffect(() => {
    fetchMenuItems();
  }, [includeDirectItems]);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenuItems,
    getItemsByCategory,
    getAvailableItems
  };
};