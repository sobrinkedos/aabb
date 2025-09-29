import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useProductCategories = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (supabaseError) throw supabaseError;
      
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      
      await loadCategories(); // Recarregar a lista
      return data;
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<ProductCategory>) => {
    try {
      console.log('🔄 Atualizando categoria:', id, categoryData);
      
      const { data, error } = await supabase
        .from('product_categories')
        .update({ ...categoryData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      console.log('📝 Resultado da atualização:', { data, error });

      if (error) throw error;
      
      await loadCategories(); // Recarregar a lista
      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar categoria:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ Excluindo categoria:', id);
      
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      console.log('📝 Resultado da exclusão:', { error });

      if (error) throw error;
      
      await loadCategories(); // Recarregar a lista
    } catch (err) {
      console.error('❌ Erro ao excluir categoria:', err);
      throw err;
    }
  };

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id);
  };

  const getCategoriesByColor = (color: string) => {
    return categories.filter(category => category.color === color);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByColor,
    refresh: loadCategories
  };
};

export default useProductCategories;