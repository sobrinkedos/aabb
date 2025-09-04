import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Comanda, ComandaItem } from '../types';
import { BillSplitConfig, BillSplit } from '../types/bar-attendance';

export const useComandas = () => {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComandas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comandas')
        .select(`
          *,
          table:bar_tables(*),
          customer:bar_customers(*),
          employee:profiles(*),
          items:comanda_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setComandas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar comandas');
    } finally {
      setLoading(false);
    }
  };

  const createComanda = async (comandaData: {
    table_id?: string;
    customer_id?: string;
    customer_name?: string;
    employee_id: string;
    people_count: number;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .insert([comandaData])
        .select(`
          *,
          table:bar_tables(*),
          customer:bar_customers(*),
          employee:profiles(*)
        `)
        .single();

      if (error) throw error;
      
      // Adicionar a nova comanda ao estado
      setComandas(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar comanda');
    }
  };

  const updateComandaStatus = async (comandaId: string, status: Comanda['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('comandas')
        .update(updateData)
        .eq('id', comandaId);

      if (error) throw error;
      
      // Atualizar o estado local
      setComandas(prev => prev.map(comanda => 
        comanda.id === comandaId ? { ...comanda, status, ...updateData } : comanda
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar comanda');
    }
  };

  const addItemToComanda = async (comandaId: string, itemData: {
    menu_item_id: string;
    quantity: number;
    price: number;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('comanda_items')
        .insert([{ comanda_id: comandaId, ...itemData }])
        .select(`
          *,
          menu_item:menu_items(*)
        `)
        .single();

      if (error) throw error;
      
      // Atualizar o estado local adicionando o item à comanda
      setComandas(prev => prev.map(comanda => {
        if (comanda.id === comandaId) {
          return {
            ...comanda,
            items: [...(comanda.items || []), data]
          };
        }
        return comanda;
      }));
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao adicionar item à comanda');
    }
  };

  const updateItemStatus = async (itemId: string, status: ComandaItem['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'ready') {
        updateData.prepared_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('comanda_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
      
      // Atualizar o estado local
      setComandas(prev => prev.map(comanda => ({
        ...comanda,
        items: comanda.items?.map(item => 
          item.id === itemId ? { ...item, status, ...updateData } : item
        )
      })));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar item');
    }
  };

  const getComandaByTable = async (tableId: string) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .select(`
          *,
          table:bar_tables(*),
          customer:bar_customers(*),
          employee:profiles(*),
          items:comanda_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .eq('table_id', tableId)
        .eq('status', 'open')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao buscar comanda da mesa');
    }
  };

  const removeItemFromComanda = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('comanda_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      // Atualizar o estado local removendo o item
      setComandas(prev => prev.map(comanda => ({
        ...comanda,
        items: comanda.items?.filter(item => item.id !== itemId)
      })));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao remover item da comanda');
    }
  };

  const createBillSplit = async (comandaId: string, splitConfig: BillSplitConfig) => {
    try {
      const { data, error } = await supabase
        .from('bill_splits')
        .insert([{
          comanda_id: comandaId,
          split_type: splitConfig.type,
          person_count: splitConfig.person_count,
          splits: splitConfig.splits,
          service_charge_percentage: splitConfig.service_charge_percentage,
          discount_amount: splitConfig.discount_amount
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar divisão de conta');
    }
  };

  const getBillSplit = async (comandaId: string) => {
    try {
      const { data, error } = await supabase
        .from('bill_splits')
        .select('*')
        .eq('comanda_id', comandaId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao buscar divisão de conta');
    }
  };

  const processMultiplePayments = async (comandaId: string, payments: Array<{
    person_name: string;
    amount: number;
    payment_method: string;
    status: string;
  }>) => {
    try {
      // Atualizar status da comanda para fechada
      await updateComandaStatus(comandaId, 'closed');

      // Em uma implementação real, aqui você registraria cada pagamento individual
      // Por exemplo, criando registros na tabela de pagamentos
      
      // Simular processamento dos pagamentos
      console.log('Processando pagamentos múltiplos:', payments);
      
      return { success: true, payments };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao processar pagamentos');
    }
  };

  useEffect(() => {
    fetchComandas();
  }, []);

  return {
    comandas,
    loading,
    error,
    refetch: fetchComandas,
    createComanda,
    updateComandaStatus,
    addItemToComanda,
    updateItemStatus,
    getComandaByTable,
    removeItemFromComanda,
    createBillSplit,
    getBillSplit,
    processMultiplePayments
  };
};