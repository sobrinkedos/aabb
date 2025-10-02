import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContextSimple';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  empresa_id: string;
}

// Hook simplificado usando cliente Supabase padrão
export const useInventoryCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias filtradas por empresa
  const loadCategories = async () => {
    if (!user) {
      console.log('useInventoryCategories: Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Carregando categorias para usuário:', user.id);
      
      // Buscar empresa do usuário atual
      const { data: usuarioEmpresa, error: empresaError } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (empresaError || !usuarioEmpresa) {
        console.error('useInventoryCategories: Erro ao buscar empresa:', empresaError);
        setError('Erro ao identificar empresa do usuário');
        return;
      }

      const empresaId = usuarioEmpresa.empresa_id;
      console.log('📋 Carregando categorias para empresa:', empresaId);

      // Carregar categorias da empresa
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('useInventoryCategories: Erro ao carregar categorias:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Categorias carregadas:', data?.length || 0);
      setCategories(data || []);
      
    } catch (err) {
      console.error('❌ Erro ao carregar categorias:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('➕ Criando categoria:', categoryData);
      
      // Buscar empresa do usuário atual
      const { data: usuarioEmpresa, error: empresaError } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (empresaError || !usuarioEmpresa) {
        throw new Error('Erro ao identificar empresa do usuário');
      }

      const { data, error } = await supabase
        .from('inventory_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description || '',
          color: categoryData.color,
          icon: categoryData.icon || 'tag',
          is_active: true,
          empresa_id: usuarioEmpresa.empresa_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Categoria criada:', data);
      await loadCategories(); // Recarregar lista
      return data;
      
    } catch (err) {
      console.error('❌ Erro ao criar categoria:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<ProductCategory>) => {
    try {
      console.log('✏️ Atualizando categoria:', id, categoryData);
      
      const { data, error } = await supabase
        .from('inventory_categories')
        .update({
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          icon: categoryData.icon,
          is_active: categoryData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Categoria atualizada:', data);
      await loadCategories(); // Recarregar lista
      return data;
      
    } catch (err) {
      console.error('❌ Erro ao atualizar categoria:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ Deletando categoria:', id);
      
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Categoria deletada');
      await loadCategories(); // Recarregar lista
      
    } catch (err) {
      console.error('❌ Erro ao deletar categoria:', err);
      throw err;
    }
  };

  // Carregar categorias quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};