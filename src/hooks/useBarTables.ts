import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarTable } from '../types';

export const useBarTables = () => {
  const [tables, setTables] = useState<BarTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bar_tables')
        .select('*')
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId: string, status: BarTable['status']) => {
    try {
      const { error } = await supabase
        .from('bar_tables')
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      
      // Atualizar o estado local
      setTables(prev => prev.map(table => 
        table.id === tableId ? { ...table, status } : table
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar mesa');
    }
  };

  const updateTablePosition = async (tableId: string, position_x: number, position_y: number) => {
    try {
      const { error } = await supabase
        .from('bar_tables')
        .update({ position_x, position_y })
        .eq('id', tableId);

      if (error) throw error;
      
      // Atualizar o estado local
      setTables(prev => prev.map(table => 
        table.id === tableId ? { ...table, position_x, position_y } : table
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar posição da mesa');
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return {
    tables,
    loading,
    error,
    refetch: fetchTables,
    updateTableStatus,
    updateTablePosition
  };
};