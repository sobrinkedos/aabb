import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Comanda, 
  ComandaInsert, 
  ComandaUpdate, 
  ComandaWithItems,
  ComandaItem,
  ComandaStatus 
} from '../types/bar-attendance';

export const useComandas = () => {
  const [comandas, setComandasState] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComandas = async () => {
    try {
      setLoading(true);
      console.log('useComandas - Fetching comandas...');
      
      const { data, error } = await supabase
        .from('comandas')
        .select(`
          *,
          bar_tables (
            id,
            number,
            capacity
          ),
          comanda_items (
            *,
            menu_items (
              name,
              price,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      console.log('useComandas - Query result:', { data, error });
      
      if (error) throw error;
      setComandasState(data || []);
      console.log('useComandas - Comandas set:', data || []);
    } catch (err) {
      console.error('useComandas - Error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar comandas');
    } finally {
      setLoading(false);
    }
  };

  const createComanda = async (comandaData: Omit<ComandaInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🔄 createComanda chamada com dados:', comandaData);
      
      // Usar mesmo empresa_id dos outros componentes
      const empresaId = 'df96edf7-f7d8-457a-a490-dd485855fc7d';
      
      const insertData = {
        ...comandaData,
        status: 'open',
        opened_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        empresa_id: empresaId // Adicionar empresa_id para RLS
      };
      
      console.log('📝 Dados que serão inseridos:', insertData);
      
      const { data, error } = await supabase
        .from('comandas')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar o estado local
      setComandasState(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar comanda');
    }
  };

  const updateComanda = async (comandaId: string, updates: Partial<ComandaUpdate>) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaId)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar o estado local
      setComandasState(prev => prev.map(comanda => 
        comanda.id === comandaId ? data : comanda
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar comanda');
    }
  };

  const closeComanda = async (comandaId: string, paymentMethod?: string) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaId)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar o estado local
      setComandasState(prev => prev.map(comanda => 
        comanda.id === comandaId ? data : comanda
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao fechar comanda');
    }
  };

  // Função específica para finalizar comandas após pagamento
  const finalizarComandasPagas = async (comandaIds: string[], paymentMethod: string) => {
    try {
      const updatePromises = comandaIds.map(comandaId => 
        supabase
          .from('comandas')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            payment_method: paymentMethod,
            updated_at: new Date().toISOString()
          })
          .eq('id', comandaId)
          .select()
          .single()
      );

      const results = await Promise.all(updatePromises);
      
      // Verificar se houve erros
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao finalizar ${errors.length} comandas`);
      }

      // Atualizar estado local
      const updatedComandas = results.map(result => result.data).filter(Boolean);
      setComandasState(prev => prev.map(comanda => {
        const updated = updatedComandas.find(updated => updated.id === comanda.id);
        return updated || comanda;
      }));

      return updatedComandas;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao finalizar comandas pagas');
    }
  };

  const deleteComanda = async (comandaId: string) => {
    try {
      const { error } = await supabase
        .from('comandas')
        .delete()
        .eq('id', comandaId);

      if (error) throw error;
      
      // Atualizar o estado local
      setComandasState(prev => prev.filter(comanda => comanda.id !== comandaId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir comanda');
    }
  };

  // Funções específicas para relacionamento com mesas
  const getComandasByTableId = (tableId: string) => {
    return comandas.filter(comanda => comanda.table_id === tableId);
  };

  const getOpenComandasByTableId = (tableId: string) => {
    return comandas.filter(comanda => 
      comanda.table_id === tableId && comanda.status === 'open'
    );
  };

  const getPendingPaymentComandasByTableId = (tableId: string) => {
    return comandas.filter(comanda => 
      comanda.table_id === tableId && comanda.status === 'pending_payment'
    );
  };

  const createComandaForTable = async (
    tableId: string, 
    employeeId: string, 
    customerName?: string,
    peopleCount?: number
  ) => {
    return createComanda({
      table_id: tableId,
      employee_id: employeeId,
      customer_name: customerName,
      people_count: peopleCount
    });
  };

  const transferComandaToTable = async (comandaId: string, newTableId: string) => {
    return updateComanda(comandaId, { table_id: newTableId });
  };

  const mergeComandas = async (sourceComandaId: string, targetComandaId: string) => {
    try {
      // Buscar itens da comanda origem
      const { data: sourceItems, error: itemsError } = await supabase
        .from('comanda_items')
        .select('*')
        .eq('comanda_id', sourceComandaId);

      if (itemsError) throw itemsError;

      // Transferir itens para comanda destino
      const updatePromises = sourceItems.map(item => 
        supabase
          .from('comanda_items')
          .update({ comanda_id: targetComandaId })
          .eq('id', item.id)
      );

      await Promise.all(updatePromises);

      // Excluir comanda origem
      await deleteComanda(sourceComandaId);

      // Recalcular total da comanda destino
      await recalculateComandaTotal(targetComandaId);

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao mesclar comandas');
    }
  };

  const recalculateComandaTotal = async (comandaId: string) => {
    try {
      const { data: items, error } = await supabase
        .from('comanda_items')
        .select('price, quantity')
        .eq('comanda_id', comandaId);

      if (error) throw error;

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return updateComanda(comandaId, { total });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao recalcular total');
    }
  };

  // Funções de filtro e busca
  const getComandaById = (comandaId: string) => {
    return comandas.find(comanda => comanda.id === comandaId);
  };

  const getOpenComandas = () => {
    return comandas.filter(comanda => comanda.status === 'open');
  };

  const getComandasByStatus = (status: ComandaStatus) => {
    return comandas.filter(comanda => comanda.status === status);
  };

  const getComandasByEmployee = (employeeId: string) => {
    return comandas.filter(comanda => comanda.employee_id === employeeId);
  };

  const getComandasByCustomer = (customerName: string) => {
    return comandas.filter(comanda => 
      comanda.customer_name?.toLowerCase().includes(customerName.toLowerCase())
    );
  };

  // Estatísticas
  const getTotalSales = () => {
    return comandas
      .filter(comanda => comanda.status === 'closed')
      .reduce((sum, comanda) => sum + (comanda.total || 0), 0);
  };

  const getAverageComandaValue = () => {
    const closedComandas = comandas.filter(comanda => comanda.status === 'closed');
    if (closedComandas.length === 0) return 0;
    
    const total = closedComandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0);
    return total / closedComandas.length;
  };

  useEffect(() => {
    fetchComandas();

    // Configurar real-time subscription
    const subscription = supabase
      .channel('comandas_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        (payload) => {
          console.log('Mudança em comandas:', payload);
          
          if (payload.eventType === 'INSERT') {
            setComandasState(prev => [payload.new as Comanda, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setComandasState(prev => prev.map(comanda => 
              comanda.id === payload.new.id ? payload.new as Comanda : comanda
            ));
          } else if (payload.eventType === 'DELETE') {
            setComandasState(prev => prev.filter(comanda => comanda.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    comandas,
    loading,
    error,
    refetch: fetchComandas,
    
    // CRUD básico
    createComanda,
    updateComanda,
    closeComanda,
    deleteComanda,
    finalizarComandasPagas,
    
    // Relacionamento com mesas
    getComandasByTableId,
    getOpenComandasByTableId,
    getPendingPaymentComandasByTableId,
    createComandaForTable,
    transferComandaToTable,
    mergeComandas,
    recalculateComandaTotal,
    
    // Filtros e busca
    getComandaById,
    getOpenComandas,
    getComandasByStatus,
    getComandasByEmployee,
    getComandasByCustomer,
    
    // Estatísticas
    getTotalSales,
    getAverageComandaValue
  };
};