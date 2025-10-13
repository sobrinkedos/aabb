import { useState, useEffect } from 'react';

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

// Configuração da API REST direta - PROJETO DE DESENVOLVIMENTO
const SUPABASE_URL = 'https://wznycskqsavpmejwpksp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';

// Função para fazer requisições diretas à API REST
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const useProductCategories = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Carregando categorias via API REST...');
      
      const data = await apiRequest('inventory_categories?is_active=eq.true&order=name');
      
      console.log('📋 Resultado do carregamento:', data);
      
      setCategories(data || []);
    } catch (err) {
      console.error('❌ Erro ao carregar categorias:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      console.log('➕ Criando categoria via API REST:', categoryData);
      
      // Preparar dados com timestamps
      const dataToInsert = {
        ...categoryData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📤 Dados para inserir:', dataToInsert);
      
      const data = await apiRequest('inventory_categories', {
        method: 'POST',
        body: JSON.stringify(dataToInsert),
      });

      console.log('📝 Resultado da criação:', data);
      
      await loadCategories(); // Recarregar a lista
      return data[0]; // API REST retorna array
    } catch (err) {
      console.error('❌ Erro ao criar categoria:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<ProductCategory>) => {
    try {
      console.log('🔄 Atualizando categoria via API REST:', id, categoryData);
      
      const updateData = { 
        ...categoryData, 
        updated_at: new Date().toISOString() 
      };
      
      const data = await apiRequest(`inventory_categories?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      console.log('📝 Resultado da atualização:', data);
      
      await loadCategories(); // Recarregar a lista
      return data[0]; // API REST retorna array
    } catch (err) {
      console.error('❌ Erro ao atualizar categoria:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ Excluindo categoria via API REST:', id);
      
      const updateData = { 
        is_active: false, 
        updated_at: new Date().toISOString() 
      };
      
      await apiRequest(`inventory_categories?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      console.log('📝 Categoria excluída com sucesso');
      
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