import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarTable, BarTableInsert, BarTableUpdate, TableStatus } from '../types/bar-attendance';
import { organizeTablesInGrid, DEFAULT_LAYOUT_CONFIG } from '../utils/table-layout';

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

  const createTable = async (tableData: Omit<BarTableInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bar_tables')
        .insert({
          ...tableData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar o estado local
      setTables(prev => [...prev, data]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar mesa');
    }
  };

  const updateTable = async (tableId: string, updates: Partial<BarTableUpdate>) => {
    try {
      const { data, error } = await supabase
        .from('bar_tables')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar o estado local
      setTables(prev => prev.map(table => 
        table.id === tableId ? data : table
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar mesa');
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('bar_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;
      
      // Atualizar o estado local
      setTables(prev => prev.filter(table => table.id !== tableId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir mesa');
    }
  };

  const updateTableStatus = async (tableId: string, status: TableStatus) => {
    return updateTable(tableId, { status });
  };

  const updateTablePosition = async (tableId: string, position_x: number, position_y: number) => {
    try {
      const { error } = await supabase
        .from('bar_tables')
        .update({ position_x, position_y, updated_at: new Date().toISOString() })
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

  const getTableById = (tableId: string) => {
    return tables.find(table => table.id === tableId);
  };

  const getTableByNumber = (number: string) => {
    return tables.find(table => table.number === number);
  };

  const getAvailableTables = () => {
    return tables.filter(table => table.status === 'available');
  };

  const getOccupiedTables = () => {
    return tables.filter(table => table.status === 'occupied');
  };

  const getTablesByStatus = (status: TableStatus) => {
    return tables.filter(table => table.status === status);
  };

  // Função para organizar todas as mesas automaticamente
  const organizeTablesAutomatically = async (layoutWidth: number = 800, layoutHeight: number = 600) => {
    const config = {
      ...DEFAULT_LAYOUT_CONFIG,
      layoutWidth,
      layoutHeight
    };
    
    const organizedTables = organizeTablesInGrid(tables, config);
    
    const updatePromises = organizedTables.map(({ id, position }) => 
      updateTablePosition(id, position.x, position.y)
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      throw new Error('Erro ao organizar mesas automaticamente');
    }
  };

  useEffect(() => {
    fetchTables();

    // Configurar real-time subscription
    const subscription = supabase
      .channel('bar_tables_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bar_tables' },
        (payload) => {
          console.log('Mudança em mesas:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTables(prev => [...prev, payload.new as BarTable]);
          } else if (payload.eventType === 'UPDATE') {
            setTables(prev => prev.map(table => 
              table.id === payload.new.id ? payload.new as BarTable : table
            ));
          } else if (payload.eventType === 'DELETE') {
            setTables(prev => prev.filter(table => table.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    tables,
    loading,
    error,
    refetch: fetchTables,
    createTable,
    updateTable,
    deleteTable,
    updateTableStatus,
    updateTablePosition,
    organizeTablesAutomatically,
    getTableById,
    getTableByNumber,
    getAvailableTables,
    getOccupiedTables,
    getTablesByStatus
  };
};