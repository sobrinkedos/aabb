import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarTable,
  Comanda,
  ComandaItem,
  AttendanceMetrics,
  TableWithComanda,
  ComandaWithItems,
  BalcaoOrder,
  TableStatus,
  ComandaStatus,
  ComandaItemStatus,
  BillSplitConfig,
  BarNotification
} from '../types/bar-attendance';

interface UseBarAttendanceState {
  mesas: TableWithComanda[];
  comandas: ComandaWithItems[];
  metricas: AttendanceMetrics | null;
  notificacoes: BarNotification[];
  loading: boolean;
  error: string | null;
}

interface UseBarAttendanceReturn extends UseBarAttendanceState {
  // Funções de CRUD para comandas
  criarComanda: (mesaId?: string, nomeCliente?: string, numeroPessoas?: number) => Promise<string>;
  atualizarComanda: (comandaId: string, dados: Partial<Comanda>) => Promise<void>;
  fecharComanda: (comandaId: string, metodoPagamento: string, observacoes?: string) => Promise<void>;
  adicionarItemComanda: (comandaId: string, menuItemId: string, quantidade: number, observacoes?: string) => Promise<void>;
  removerItemComanda: (itemId: string) => Promise<void>;
  atualizarStatusItem: (itemId: string, status: ComandaItemStatus) => Promise<void>;
  
  // Funções de gerenciamento de mesas
  ocuparMesa: (mesaId: string, comandaId?: string) => Promise<void>;
  liberarMesa: (mesaId: string) => Promise<void>;
  reservarMesa: (mesaId: string, nomeCliente: string, horario: Date) => Promise<void>;
  limparMesa: (mesaId: string) => Promise<void>;
  atualizarStatusMesa: (mesaId: string, status: TableStatus) => Promise<void>;
  
  // Funções para pedidos no balcão
  processarPedidoBalcao: (pedido: BalcaoOrder) => Promise<string>;
  
  // Funções de divisão de conta
  dividirConta: (comandaId: string, configuracao: BillSplitConfig) => Promise<void>;
  
  // Funções de métricas
  atualizarMetricas: () => Promise<void>;
  
  // Funções de notificações
  marcarNotificacaoLida: (notificacaoId: string) => Promise<void>;
  limparNotificacoes: () => Promise<void>;
  
  // Funções de utilidade
  recarregarDados: () => Promise<void>;
  obterComandaPorMesa: (mesaId: string) => ComandaWithItems | undefined;
  obterMesaPorNumero: (numero: string) => TableWithComanda | undefined;
}

export const useBarAttendance = (): UseBarAttendanceReturn => {
  const { user } = useAuth();
  
  const [state, setState] = useState<UseBarAttendanceState>({
    mesas: [],
    comandas: [],
    metricas: null,
    notificacoes: [],
    loading: true,
    error: null
  });

  // Função para atualizar estado com tratamento de erro
  const atualizarEstado = useCallback((updates: Partial<UseBarAttendanceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Função para tratar erros
  const tratarErro = useCallback((error: any, contexto: string) => {
    console.error(`Erro em ${contexto}:`, error);
    atualizarEstado({ 
      error: `Erro em ${contexto}: ${error.message || 'Erro desconhecido'}`,
      loading: false 
    });
  }, [atualizarEstado]);

  // Carregar dados iniciais
  const carregarDadosIniciais = useCallback(async () => {
    if (!user) return;

    try {
      atualizarEstado({ loading: true, error: null });

      // Carregar mesas com comandas ativas
      const { data: mesasData, error: mesasError } = await supabase
        .from('bar_tables')
        .select(`
          *,
          comandas!comandas_table_id_fkey(
            id,
            customer_name,
            people_count,
            total,
            opened_at,
            status,
            comanda_items(
              id,
              quantity,
              price,
              status
            )
          )
        `)
        .order('number');

      if (mesasError) throw mesasError;

      // Processar dados das mesas
      const mesasProcessadas: TableWithComanda[] = mesasData?.map(mesa => {
        const comandaAtiva = mesa.comandas?.find((c: any) => c.status === 'open');
        return {
          ...mesa,
          currentComanda: comandaAtiva || undefined,
          occupiedSince: comandaAtiva?.opened_at || undefined,
          currentTotal: comandaAtiva?.total || 0,
          peopleCount: comandaAtiva?.people_count || 0
        };
      }) || [];

      // Carregar todas as comandas abertas
      const { data: comandasData, error: comandasError } = await supabase
        .from('comandas')
        .select(`
          *,
          bar_tables(number, capacity),
          bar_customers(name, phone),
          comanda_items(
            *,
            menu_items(name, price, category)
          )
        `)
        .in('status', ['open', 'pending_payment'])
        .order('opened_at', { ascending: false });

      if (comandasError) throw comandasError;

      const comandasProcessadas: ComandaWithItems[] = comandasData?.map(comanda => ({
        ...comanda,
        items: comanda.comanda_items || [],
        table: comanda.bar_tables || undefined,
        customer: comanda.bar_customers || undefined
      })) || [];

      // Carregar métricas do funcionário atual
      const { data: metricasData, error: metricasError } = await supabase
        .from('attendance_metrics')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (metricasError) {
        console.warn('Erro ao carregar métricas:', metricasError);
      }

      atualizarEstado({
        mesas: mesasProcessadas,
        comandas: comandasProcessadas,
        metricas: metricasData || null,
        loading: false
      });

    } catch (error) {
      tratarErro(error, 'carregamento inicial');
    }
  }, [user, atualizarEstado, tratarErro]);

  // Configurar subscriptions em tempo real
  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Subscription para mesas
    const mesasChannel = supabase
      .channel('bar-tables-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bar_tables' },
        (payload) => {
          console.log('Mudança em mesas:', payload);
          carregarDadosIniciais();
        }
      )
      .subscribe();

    channels.push(mesasChannel);

    // Subscription para comandas
    const comandasChannel = supabase
      .channel('comandas-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        (payload) => {
          console.log('Mudança em comandas:', payload);
          carregarDadosIniciais();
        }
      )
      .subscribe();

    channels.push(comandasChannel);

    // Subscription para itens de comanda
    const itensChannel = supabase
      .channel('comanda-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_items' },
        (payload) => {
          console.log('Mudança em itens de comanda:', payload);
          carregarDadosIniciais();
        }
      )
      .subscribe();

    channels.push(itensChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, carregarDadosIniciais]);

  // Carregar dados iniciais quando o usuário estiver disponível
  useEffect(() => {
    if (user) {
      carregarDadosIniciais();
    }
  }, [user, carregarDadosIniciais]);

  // CRUD de Comandas
  const criarComanda = useCallback(async (
    mesaId?: string, 
    nomeCliente?: string, 
    numeroPessoas?: number
  ): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      atualizarEstado({ loading: true, error: null });

      const { data, error } = await supabase
        .from('comandas')
        .insert({
          table_id: mesaId || null,
          customer_name: nomeCliente || null,
          people_count: numeroPessoas || 1,
          employee_id: user.id,
          status: 'open',
          opened_at: new Date().toISOString(),
          total: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Se há mesa associada, atualizar status da mesa
      if (mesaId) {
        await atualizarStatusMesa(mesaId, 'occupied');
      }

      await carregarDadosIniciais();
      return data.id;

    } catch (error) {
      tratarErro(error, 'criação de comanda');
      throw error;
    }
  }, [user, atualizarEstado, tratarErro, carregarDadosIniciais]);

  // Função base para atualizar comanda (definida antes das que a utilizam)
  const atualizarComanda = useCallback(async (
    comandaId: string, 
    dados: Partial<Comanda>
  ): Promise<void> => {
    try {
      atualizarEstado({ loading: true, error: null });

      const { error } = await supabase
        .from('comandas')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaId);

      if (error) throw error;

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'atualização de comanda');
      throw error;
    }
  }, [atualizarEstado, tratarErro, carregarDadosIniciais]);

  // Função base para atualizar status da mesa (definida primeiro)
  const atualizarStatusMesa = useCallback(async (
    mesaId: string, 
    status: TableStatus
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('bar_tables')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', mesaId);

      if (error) throw error;

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'atualização de status da mesa');
      throw error;
    }
  }, [tratarErro, carregarDadosIniciais]);

  // Função para liberar mesa (definida depois de atualizarStatusMesa)
  const liberarMesa = useCallback(async (mesaId: string): Promise<void> => {
    try {
      await atualizarStatusMesa(mesaId, 'cleaning');
      
      // Após 5 minutos, marcar como disponível automaticamente
      setTimeout(async () => {
        await atualizarStatusMesa(mesaId, 'available');
      }, 5 * 60 * 1000);

    } catch (error) {
      tratarErro(error, 'liberação de mesa');
      throw error;
    }
  }, [atualizarStatusMesa, tratarErro]);

  // Função para atualizar métricas de venda (definida antes das que a usam)
  const atualizarMetricasVenda = useCallback(async (valorVenda: number): Promise<void> => {
    if (!user) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data: metricas, error: buscaError } = await supabase
        .from('attendance_metrics')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', hoje)
        .single();

      if (buscaError && buscaError.code !== 'PGRST116') throw buscaError;

      if (metricas) {
        // Atualizar métricas existentes
        const { error } = await supabase
          .from('attendance_metrics')
          .update({
            total_sales: (metricas.total_sales || 0) + valorVenda,
            orders_count: (metricas.orders_count || 0) + 1,
            comandas_count: (metricas.comandas_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', metricas.id);

        if (error) throw error;
      } else {
        // Criar novas métricas
        const { error } = await supabase
          .from('attendance_metrics')
          .insert({
            employee_id: user.id,
            date: hoje,
            total_sales: valorVenda,
            orders_count: 1,
            comandas_count: 1
          });

        if (error) throw error;
      }

    } catch (error) {
      console.error('Erro ao atualizar métricas de venda:', error);
    }
  }, [user]);

  const fecharComanda = useCallback(async (
    comandaId: string, 
    metodoPagamento: string, 
    observacoes?: string
  ): Promise<void> => {
    try {
      atualizarEstado({ loading: true, error: null });

      // Buscar comanda para obter mesa associada
      const { data: comanda, error: comandaError } = await supabase
        .from('comandas')
        .select('table_id, total')
        .eq('id', comandaId)
        .single();

      if (comandaError) throw comandaError;

      // Fechar comanda
      const { error: updateError } = await supabase
        .from('comandas')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          payment_method: metodoPagamento,
          notes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaId);

      if (updateError) throw updateError;

      // Se há mesa associada, liberar mesa
      if (comanda.table_id) {
        await liberarMesa(comanda.table_id);
      }

      // Atualizar métricas do funcionário
      await atualizarMetricasVenda(comanda.total || 0);

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'fechamento de comanda');
      throw error;
    }
  }, [atualizarEstado, tratarErro, carregarDadosIniciais, liberarMesa, atualizarMetricasVenda]);

  const adicionarItemComanda = useCallback(async (
    comandaId: string, 
    menuItemId: string, 
    quantidade: number, 
    observacoes?: string
  ): Promise<void> => {
    try {
      atualizarEstado({ loading: true, error: null });

      // Buscar preço do item
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .select('price')
        .eq('id', menuItemId)
        .single();

      if (menuError) throw menuError;

      // Adicionar item à comanda
      const { error: itemError } = await supabase
        .from('comanda_items')
        .insert({
          comanda_id: comandaId,
          menu_item_id: menuItemId,
          quantity: quantidade,
          price: menuItem.price,
          notes: observacoes,
          status: 'pending',
          added_at: new Date().toISOString()
        });

      if (itemError) throw itemError;

      // Atualizar total da comanda
      const { data: itens, error: itensError } = await supabase
        .from('comanda_items')
        .select('quantity, price')
        .eq('comanda_id', comandaId);

      if (itensError) throw itensError;

      const novoTotal = itens.reduce((total, item) => 
        total + (item.quantity * item.price), 0
      );

      await atualizarComanda(comandaId, { total: novoTotal });

    } catch (error) {
      tratarErro(error, 'adição de item à comanda');
      throw error;
    }
  }, [atualizarEstado, tratarErro, atualizarComanda]);

  const removerItemComanda = useCallback(async (itemId: string): Promise<void> => {
    try {
      atualizarEstado({ loading: true, error: null });

      // Buscar comanda_id antes de remover
      const { data: item, error: itemError } = await supabase
        .from('comanda_items')
        .select('comanda_id')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Remover item
      const { error: deleteError } = await supabase
        .from('comanda_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      // Recalcular total da comanda
      const { data: itensRestantes, error: itensError } = await supabase
        .from('comanda_items')
        .select('quantity, price')
        .eq('comanda_id', item.comanda_id);

      if (itensError) throw itensError;

      const novoTotal = itensRestantes.reduce((total, item) => 
        total + (item.quantity * item.price), 0
      );

      await atualizarComanda(item.comanda_id, { total: novoTotal });

    } catch (error) {
      tratarErro(error, 'remoção de item da comanda');
      throw error;
    }
  }, [atualizarEstado, tratarErro, atualizarComanda]);

  const atualizarStatusItem = useCallback(async (
    itemId: string, 
    status: ComandaItemStatus
  ): Promise<void> => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      // Adicionar timestamp específico baseado no status
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

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'atualização de status do item');
      throw error;
    }
  }, [tratarErro, carregarDadosIniciais]);

  // Gerenciamento de Mesas
  const ocuparMesa = useCallback(async (
    mesaId: string, 
    comandaId?: string
  ): Promise<void> => {
    try {
      await atualizarStatusMesa(mesaId, 'occupied');
      
      if (comandaId) {
        await atualizarComanda(comandaId, { table_id: mesaId });
      }

    } catch (error) {
      tratarErro(error, 'ocupação de mesa');
      throw error;
    }
  }, [atualizarStatusMesa, atualizarComanda, tratarErro]);



  const reservarMesa = useCallback(async (
    mesaId: string, 
    nomeCliente: string, 
    horario: Date
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('bar_tables')
        .update({
          status: 'reserved',
          notes: `Reservado para ${nomeCliente} às ${horario.toLocaleTimeString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', mesaId);

      if (error) throw error;

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'reserva de mesa');
      throw error;
    }
  }, [tratarErro, carregarDadosIniciais]);

  const limparMesa = useCallback(async (mesaId: string): Promise<void> => {
    try {
      await atualizarStatusMesa(mesaId, 'available');
    } catch (error) {
      tratarErro(error, 'limpeza de mesa');
      throw error;
    }
  }, [atualizarStatusMesa, tratarErro]);

  // Pedidos no Balcão
  const processarPedidoBalcao = useCallback(async (
    pedido: BalcaoOrder
  ): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      atualizarEstado({ loading: true, error: null });

      // Criar comanda para pedido do balcão
      const { data: comanda, error: comandaError } = await supabase
        .from('comandas')
        .insert({
          customer_name: pedido.customer?.name || 'Cliente Balcão',
          employee_id: user.id,
          status: 'closed', // Pedido do balcão já é pago
          opened_at: new Date().toISOString(),
          closed_at: new Date().toISOString(),
          total: pedido.total,
          payment_method: pedido.payment_method || 'dinheiro',
          notes: pedido.notes
        })
        .select()
        .single();

      if (comandaError) throw comandaError;

      // Adicionar itens à comanda
      const itensParaInserir = pedido.items.map(item => ({
        comanda_id: comanda.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        status: 'delivered' as ComandaItemStatus,
        added_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      }));

      const { error: itensError } = await supabase
        .from('comanda_items')
        .insert(itensParaInserir);

      if (itensError) throw itensError;

      // Atualizar métricas
      await atualizarMetricasVenda(pedido.total);

      await carregarDadosIniciais();
      return comanda.id;

    } catch (error) {
      tratarErro(error, 'processamento de pedido do balcão');
      throw error;
    }
  }, [user, atualizarEstado, tratarErro, carregarDadosIniciais]);

  // Divisão de Conta
  const dividirConta = useCallback(async (
    comandaId: string, 
    configuracao: BillSplitConfig
  ): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      atualizarEstado({ loading: true, error: null });

      const { error } = await supabase
        .from('bill_splits')
        .insert({
          comanda_id: comandaId,
          split_type: configuracao.type,
          person_count: configuracao.person_count,
          splits: configuracao.splits,
          total_amount: configuracao.splits.reduce((total, split) => total + split.total, 0),
          service_charge: configuracao.service_charge_percentage || 0,
          discount_amount: configuracao.discount_amount || 0,
          created_by: user.id
        });

      if (error) throw error;

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'divisão de conta');
      throw error;
    }
  }, [user, atualizarEstado, tratarErro, carregarDadosIniciais]);

  // Métricas
  const atualizarMetricas = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Buscar métricas existentes do dia
      const { data: metricasExistentes } = await supabase
        .from('attendance_metrics')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', hoje)
        .single();

      // Calcular métricas do dia
      const { data: comandasHoje } = await supabase
        .from('comandas')
        .select('total, opened_at, closed_at')
        .eq('employee_id', user.id)
        .gte('opened_at', `${hoje}T00:00:00`)
        .lt('opened_at', `${hoje}T23:59:59`);

      const totalVendas = comandasHoje?.reduce((total, comanda) => 
        total + (comanda.total || 0), 0
      ) || 0;

      const contadorComandas = comandasHoje?.length || 0;

      const dadosMetricas = {
        employee_id: user.id,
        date: hoje,
        comandas_count: contadorComandas,
        total_sales: totalVendas,
        orders_count: contadorComandas,
        updated_at: new Date().toISOString()
      };

      if (metricasExistentes) {
        // Atualizar métricas existentes
        const { error } = await supabase
          .from('attendance_metrics')
          .update(dadosMetricas)
          .eq('id', metricasExistentes.id);

        if (error) throw error;
      } else {
        // Criar novas métricas
        const { error } = await supabase
          .from('attendance_metrics')
          .insert(dadosMetricas);

        if (error) throw error;
      }

      await carregarDadosIniciais();

    } catch (error) {
      tratarErro(error, 'atualização de métricas');
    }
  }, [user, tratarErro, carregarDadosIniciais]);



  // Notificações
  const marcarNotificacaoLida = useCallback(async (notificacaoId: string): Promise<void> => {
    atualizarEstado({
      notificacoes: state.notificacoes.map(notif => 
        notif.id === notificacaoId ? { ...notif, read: true } : notif
      )
    });
  }, [state.notificacoes, atualizarEstado]);

  const limparNotificacoes = useCallback(async (): Promise<void> => {
    atualizarEstado({ notificacoes: [] });
  }, [atualizarEstado]);

  // Funções de utilidade
  const recarregarDados = useCallback(async (): Promise<void> => {
    await carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const obterComandaPorMesa = useCallback((mesaId: string): ComandaWithItems | undefined => {
    return state.comandas.find(comanda => comanda.table_id === mesaId && comanda.status === 'open');
  }, [state.comandas]);

  const obterMesaPorNumero = useCallback((numero: string): TableWithComanda | undefined => {
    return state.mesas.find(mesa => mesa.number === numero);
  }, [state.mesas]);

  return {
    // Estado
    ...state,
    
    // CRUD de comandas
    criarComanda,
    atualizarComanda,
    fecharComanda,
    adicionarItemComanda,
    removerItemComanda,
    atualizarStatusItem,
    
    // Gerenciamento de mesas
    ocuparMesa,
    liberarMesa,
    reservarMesa,
    limparMesa,
    atualizarStatusMesa,
    
    // Pedidos no balcão
    processarPedidoBalcao,
    
    // Divisão de conta
    dividirConta,
    
    // Métricas
    atualizarMetricas,
    
    // Notificações
    marcarNotificacaoLida,
    limparNotificacoes,
    
    // Utilidades
    recarregarDados,
    obterComandaPorMesa,
    obterMesaPorNumero
  };
};