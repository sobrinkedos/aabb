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

// Versão super simples que não interfere com autenticação
export const useInventoryCategories = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para fazer requisições sem autenticação (já que RLS está desabilitado)
  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `https://wznycskqsavpmejwpksp.supabase.co/rest/v1/${endpoint}`;
    
    console.log('🌐 Fazendo requisição para:', url);
    console.log('📤 Opções:', options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📋 Dados recebidos:', result);
    return result;
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Carregando categorias...');
      
      const data = await makeRequest('inventory_categories?is_active=eq.true&order=name');
      
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
      console.log('➕ Criando categoria:', categoryData);
      
      const dataToInsert = {
        name: categoryData.name,
        description: categoryData.description || '',
        color: categoryData.color,
        icon: categoryData.icon || '',
        is_active: true
      };
      
      const data = await makeRequest('inventory_categories', {
        method: 'POST',
        body: JSON.stringify(dataToInsert),
      });
      
      await loadCategories();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.error('❌ Erro ao criar categoria:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<ProductCategory>) => {
    try {
      console.log('🔄 Atualizando categoria:', id, categoryData);
      
      const updateData = { 
        ...categoryData, 
        updated_at: new Date().toISOString() 
      };
      
      const data = await makeRequest(`inventory_categories?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      await loadCategories();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.error('❌ Erro ao atualizar categoria:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ Excluindo categoria:', id);
      
      const updateData = { 
        is_active: false, 
        updated_at: new Date().toISOString() 
      };
      
      await makeRequest(`inventory_categories?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      await loadCategories();
    } catch (err) {
      console.error('❌ Erro ao excluir categoria:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: loadCategories
  };
};

export default useInventoryCategories;