import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
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
  }, []);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenuItems,
    getItemsByCategory,
    getAvailableItems
  };
};