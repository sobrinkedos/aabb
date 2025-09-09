import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBarAttendance } from './useBarAttendance';
import {
  CashSession,
  CashSessionWithEmployee,
  CashTransaction,
  CashTransactionWithDetails,
  PaymentReconciliation,
  PaymentReconciliationData,
  OpenCashSessionData,
  CloseCashSessionData,
  ProcessComandaPaymentData,
  ProcessRefundData,
  ProcessAdjustmentData,
  DailySummary,
  MonthlyCashReport,
  EmployeePerformanceReport,
  CashValidationResult,
  TransactionFilters,
  SessionFilters,
  UseCashManagementReturn,
  CashManagementState,
  PaymentMethod,
  TransactionType,
  CashSessionStatus
} from '../types/cash-management';
import { ComandaWithItems } from '../types/bar-attendance';

export const useCashManagement = (): UseCashManagementReturn => {
  const { user } = useAuth();
  const { fecharComanda, recarregarDados: recarregarBarAttendance } = useBarAttendance();
  
  const [state, setState] = useState<CashManagementState>({
    currentSession: null,
    pendingComandas: [],
    todaysTransactions: [],
    todaysSessions: [],
    todaysSummary: {
      session_date: new Date().toISOString().split('T')[0],
      total_sessions: 0,
      total_sales: 0,
      total_transactions: 0,
      by_payment_method: [],
      by_employee: [],
      discrepancies: [],
      avg_ticket: 0,
      peak_hours: []
    },
    loading: true,
    error: null
  });

  // ===== FUNÇÕES AUXILIARES =====

  const updateState = useCallback((updates: Partial<CashManagementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Erro em ${context}:`, error);
    updateState({ 
      error: `Erro em ${context}: ${error.message || 'Erro desconhecido'}`,
      loading: false 
    });
  }, [updateState]);

  // ===== CARREGAR DADOS INICIAIS =====

  const loadInitialData = useCallback(async () => {
    if (!user) {
      console.log('useCashManagement: Usuário não encontrado, pulando carregamento');
      return;
    }

    try {
      console.log('useCashManagement: Iniciando carregamento para usuário:', user);
      updateState({ loading: true, error: null });

      const today = new Date().toISOString().split('T')[0];
      console.log('useCashManagement: Data atual:', today);

      // Carregar sessão atual do funcionário
      console.log('useCashManagement: Buscando sessão para usuário ID:', user.id);
      const { data: currentSessionData, error: sessionError } = await (supabase as any)
        .from('cash_sessions')
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      console.log('useCashManagement: Resultado da busca de sessão:', { currentSessionData, sessionError });

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error('Erro ao carregar sessão:', sessionError);
        throw sessionError;
      }

      // Carregar comandas pendentes de pagamento
      const { data: pendingComandasData, error: comandasError } = await (supabase as any)
        .from('comandas')
        .select('*')
        .eq('status', 'pending_payment')
        .order('opened_at', { ascending: false });

      if (comandasError) throw comandasError;

      // Carregar transações do dia
      const { data: transactionsData, error: transactionsError } = await (supabase as any)
        .from('cash_transactions')
        .select('*')
        .gte('processed_at', `${today}T00:00:00.000Z`)
        .lt('processed_at', `${today}T23:59:59.999Z`)
        .order('processed_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Carregar todas as sessões do dia
      const { data: sessionsData, error: sessionsDataError } = await (supabase as any)
        .from('cash_sessions')
        .select('*')
        .eq('session_date', today)
        .order('opened_at', { ascending: false });

      if (sessionsDataError) throw sessionsDataError;

      // Processar dados
      console.log('Dados da sessão atual:', currentSessionData);
      console.log('Usuário atual:', user);
      
      const currentSession: CashSessionWithEmployee | null = currentSessionData ? {
        ...currentSessionData,
        employee: { 
          id: user.id, 
          name: user.name || user.email || 'Usuário', 
          role: user.role || 'employee' 
        },
        supervisor: undefined
      } : null;

      console.log('Sessão processada:', currentSession);

      const pendingComandas: ComandaWithItems[] = pendingComandasData?.map((comanda: any) => ({
        ...comanda,
        items: [],
        table: undefined,
        customer: undefined
      })) || [];

      const todaysTransactions: CashTransactionWithDetails[] = transactionsData?.map((transaction: any) => ({
        ...transaction,
        comanda: undefined,
        processed_by_employee: { id: user.id, name: user.email || 'Usuário' },
        session: undefined
      })) || [];

      const todaysSessions: CashSessionWithEmployee[] = sessionsData?.map((session: any) => ({
        ...session,
        employee: { id: user.id, name: user.email || 'Usuário', role: 'employee' }
      })) || [];

      // Gerar resumo do dia
      const todaysSummary = await generateDailySummary(new Date());

      updateState({
        currentSession,
        pendingComandas,
        todaysTransactions,
        todaysSessions,
        todaysSummary,
        loading: false
      });

    } catch (error) {
      handleError(error, 'carregamento inicial');
    }
  }, [user, updateState, handleError]);

  // ===== FUNÇÕES DE SESSÃO DE CAIXA =====

  const openCashSession = useCallback(async (data: OpenCashSessionData): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('Iniciando abertura de caixa para usuário:', user.id);
      updateState({ loading: true, error: null });

      const sessionData = {
        employee_id: user.id,
        opening_amount: data.opening_amount,
        opening_notes: data.opening_notes,
        supervisor_approval_id: data.supervisor_approval_id,
        status: 'open' as CashSessionStatus
      };

      console.log('Dados da sessão:', sessionData);

      const { data: newSession, error } = await (supabase as any)
        .from('cash_sessions')
        .insert(sessionData)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao inserir sessão:', error);
        throw error;
      }

      console.log('Sessão criada com sucesso:', newSession);
      await loadInitialData();
    } catch (error) {
      handleError(error, 'abertura de caixa');
      throw error;
    }
  }, [user, updateState, handleError, loadInitialData]);

  const closeCashSession = useCallback(async (data: CloseCashSessionData): Promise<void> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão aberta');

    try {
      updateState({ loading: true, error: null });

      const cashDiscrepancy = data.closing_amount - state.currentSession.expected_amount;

      // Atualizar sessão
      const { error: sessionError } = await (supabase as any)
        .from('cash_sessions')
        .update({
          status: 'closed' as CashSessionStatus,
          closed_at: new Date().toISOString(),
          closing_amount: data.closing_amount,
          cash_discrepancy: cashDiscrepancy,
          closing_notes: data.closing_notes
        })
        .eq('id', state.currentSession.id);

      if (sessionError) throw sessionError;

      // Inserir dados de reconciliação
      const reconciliationInserts = data.reconciliation.map(recon => ({
        cash_session_id: state.currentSession!.id,
        payment_method: recon.payment_method,
        expected_amount: recon.expected_amount,
        actual_amount: recon.actual_amount,
        transaction_count: recon.transaction_count,
        reconciled_by: user!.id,
        notes: recon.notes
      }));

      const { error: reconError } = await (supabase as any)
        .from('payment_reconciliation')
        .insert(reconciliationInserts);

      if (reconError) throw reconError;

      await loadInitialData();
    } catch (error) {
      handleError(error, 'fechamento de caixa');
      throw error;
    }
  }, [state.currentSession, user, updateState, handleError, loadInitialData]);

  const getCurrentSession = useCallback((): CashSessionWithEmployee | null => {
    return state.currentSession;
  }, [state.currentSession]);

  // ===== FUNÇÕES DE TRANSAÇÃO =====

  const processComandaPayment = useCallback(async (data: ProcessComandaPaymentData): Promise<void> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão de caixa aberta');

    try {
      updateState({ loading: true, error: null });

      // Fechar comanda usando o hook do bar attendance
      await fecharComanda(data.comanda_id, data.payment_method, data.notes);

      // Registrar transação no caixa
      const transactionData = {
        cash_session_id: state.currentSession.id,
        comanda_id: data.comanda_id,
        transaction_type: 'sale' as TransactionType,
        payment_method: data.payment_method,
        amount: data.amount,
        processed_by: user!.id,
        reference_number: data.reference_number,
        customer_name: data.customer_name,
        notes: data.notes
      };

      const { error: transactionError } = await (supabase as any)
        .from('cash_transactions')
        .insert(transactionData);

      if (transactionError) throw transactionError;

      // Atualizar métricas do funcionário
      await atualizarMetricasVenda(data.amount);

      // Recarregar dados
      await loadInitialData();
      await recarregarBarAttendance();

    } catch (error) {
      handleError(error, 'processamento de pagamento');
      throw error;
    }
  }, [state.currentSession, user, fecharComanda, updateState, handleError, loadInitialData, recarregarBarAttendance]);

  const processRefund = useCallback(async (data: ProcessRefundData): Promise<void> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão de caixa aberta');

    try {
      updateState({ loading: true, error: null });

      const transactionData = {
        cash_session_id: state.currentSession.id,
        transaction_type: 'refund' as TransactionType,
        payment_method: data.refund_method,
        amount: -Math.abs(data.amount), // Valor negativo para estorno
        processed_by: user!.id,
        notes: `Estorno: ${data.reason}. Transação original: ${data.original_transaction_id}`
      };

      const { error } = await (supabase as any)
        .from('cash_transactions')
        .insert(transactionData);

      if (error) throw error;

      await loadInitialData();
    } catch (error) {
      handleError(error, 'processamento de estorno');
      throw error;
    }
  }, [state.currentSession, user, updateState, handleError, loadInitialData]);

  const processAdjustment = useCallback(async (data: ProcessAdjustmentData): Promise<void> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão de caixa aberta');

    try {
      updateState({ loading: true, error: null });

      const adjustmentAmount = data.adjustment_type === 'add' ? data.amount : -data.amount;

      const transactionData = {
        cash_session_id: state.currentSession.id,
        transaction_type: 'adjustment' as TransactionType,
        payment_method: data.payment_method || 'dinheiro',
        amount: adjustmentAmount,
        processed_by: user!.id,
        notes: `Ajuste ${data.adjustment_type === 'add' ? 'positivo' : 'negativo'}: ${data.reason}`
      };

      const { error } = await (supabase as any)
        .from('cash_transactions')
        .insert(transactionData);

      if (error) throw error;

      await loadInitialData();
    } catch (error) {
      handleError(error, 'processamento de ajuste');
      throw error;
    }
  }, [state.currentSession, user, updateState, handleError, loadInitialData]);

  // ===== FUNÇÕES DE RELATÓRIO =====

  const generateDailySummary = useCallback(async (date?: Date): Promise<DailySummary> => {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    try {
      // Usar a view criada na migration
      const { data, error } = await (supabase as any)
        .from('daily_cash_summary')
        .select('*')
        .eq('session_date', dateStr);

      if (error) {
        console.warn('Erro ao buscar view daily_cash_summary, usando dados padrão:', error);
        // Retornar dados padrão se a view não existir ainda
        return {
          session_date: dateStr,
          total_sessions: 0,
          total_sales: 0,
          total_transactions: 0,
          by_payment_method: [],
          by_employee: [],
          discrepancies: [],
          avg_ticket: 0,
          peak_hours: []
        };
      }

      // Processar dados para o formato esperado
      const sessions = data || [];
      
      const totalSales = sessions.reduce((sum: number, s: any) => sum + (s.cash_sales + s.debit_sales + s.credit_sales + s.pix_sales), 0);
      const totalTransactions = sessions.reduce((sum: number, s: any) => sum + s.total_transactions, 0);

      const byPaymentMethod = [
        { payment_method: 'dinheiro' as PaymentMethod, amount: sessions.reduce((sum: number, s: any) => sum + s.cash_sales, 0), transaction_count: 0, percentage: 0, expected_amount: 0, actual_amount: 0, discrepancy: 0 },
        { payment_method: 'cartao_debito' as PaymentMethod, amount: sessions.reduce((sum: number, s: any) => sum + s.debit_sales, 0), transaction_count: 0, percentage: 0, expected_amount: 0, actual_amount: 0, discrepancy: 0 },
        { payment_method: 'cartao_credito' as PaymentMethod, amount: sessions.reduce((sum: number, s: any) => sum + s.credit_sales, 0), transaction_count: 0, percentage: 0, expected_amount: 0, actual_amount: 0, discrepancy: 0 },
        { payment_method: 'pix' as PaymentMethod, amount: sessions.reduce((sum: number, s: any) => sum + s.pix_sales, 0), transaction_count: 0, percentage: 0, expected_amount: 0, actual_amount: 0, discrepancy: 0 }
      ];

      // Calcular percentuais
      byPaymentMethod.forEach(method => {
        method.percentage = totalSales > 0 ? (method.amount / totalSales) * 100 : 0;
      });

      return {
        session_date: dateStr,
        total_sessions: sessions.length,
        total_sales: totalSales,
        total_transactions: totalTransactions,
        by_payment_method: byPaymentMethod,
        by_employee: sessions.map((s: any) => ({
          employee_id: s.employee_id,
          employee_name: s.employee_name,
          session_count: 1,
          total_sales: s.cash_sales + s.debit_sales + s.credit_sales + s.pix_sales,
          transaction_count: s.total_transactions,
          avg_ticket: s.total_transactions > 0 ? (s.cash_sales + s.debit_sales + s.credit_sales + s.pix_sales) / s.total_transactions : 0,
          cash_discrepancy: s.cash_discrepancy || 0,
          session_duration: '8:00' // Placeholder
        })),
        discrepancies: sessions.filter((s: any) => Math.abs(s.cash_discrepancy || 0) > 0).map((s: any) => ({
          employee_id: s.employee_id,
          employee_name: s.employee_name,
          session_id: s.employee_id, // Usando employee_id como placeholder
          cash_discrepancy: s.cash_discrepancy || 0,
          payment_discrepancies: [],
          total_discrepancy: s.cash_discrepancy || 0
        })),
        avg_ticket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        peak_hours: [] // TODO: Implementar análise de horários de pico
      };

    } catch (error) {
      console.error('Erro ao gerar resumo diário:', error);
      throw error;
    }
  }, []);

  const getDailySummary = useCallback(async (date?: Date): Promise<DailySummary> => {
    return generateDailySummary(date);
  }, [generateDailySummary]);

  const getMonthlyCashReport = useCallback(async (month: string): Promise<MonthlyCashReport> => {
    // TODO: Implementar relatório mensal
    throw new Error('Relatório mensal ainda não implementado');
  }, []);

  const getEmployeePerformance = useCallback(async (
    employeeId: string, 
    period: { start: Date; end: Date }
  ): Promise<EmployeePerformanceReport> => {
    // TODO: Implementar relatório de performance
    throw new Error('Relatório de performance ainda não implementado');
  }, []);

  // ===== FUNÇÕES DE VALIDAÇÃO =====

  const validateCashCount = useCallback(async (amount: number): Promise<CashValidationResult> => {
    if (!state.currentSession) {
      return {
        isValid: false,
        warnings: [],
        errors: [{ type: 'invalid_state', message: 'Nenhuma sessão ativa' }],
        suggestions: ['Abra uma sessão de caixa primeiro']
      };
    }

    const discrepancy = amount - state.currentSession.expected_amount;
    const discrepancyPercentage = Math.abs(discrepancy / state.currentSession.expected_amount) * 100;

    const warnings: any[] = [];
    const errors: any[] = [];
    const suggestions: string[] = [];

    if (Math.abs(discrepancy) > 10) {
      warnings.push({
        type: 'discrepancy' as const,
        message: `Discrepância alta: R$ ${discrepancy.toFixed(2)}`,
        severity: 'high' as const,
        data: { discrepancy, percentage: discrepancyPercentage }
      });
      suggestions.push('Recontagem recomendada');
    }

    return {
      isValid: Math.abs(discrepancy) <= 5,
      warnings,
      errors,
      suggestions
    };
  }, [state.currentSession]);

  const validateSession = useCallback(async (sessionId: string): Promise<CashValidationResult> => {
    // TODO: Implementar validação de sessão
    return {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };
  }, []);

  // ===== FUNÇÕES UTILITÁRIAS =====

  const refreshData = useCallback(async (): Promise<void> => {
    await loadInitialData();
  }, [loadInitialData]);

  const exportReport = useCallback(async (type: 'daily' | 'monthly', format: 'pdf' | 'excel'): Promise<void> => {
    // TODO: Implementar exportação de relatórios
    throw new Error('Exportação de relatórios ainda não implementada');
  }, []);

  const searchTransactions = useCallback(async (filters: TransactionFilters): Promise<CashTransactionWithDetails[]> => {
    try {
      let query = supabase
        .from('cash_transactions')
        .select(`
          *,
          comandas(id, customer_name, table_id, total),
          profiles!cash_transactions_processed_by_fkey(id, name),
          cash_sessions(id, session_date, employee_id)
        `);

      if (filters.start_date) {
        query = query.gte('processed_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('processed_at', filters.end_date);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.employee_id) {
        query = query.eq('processed_by', filters.employee_id);
      }
      if (filters.session_id) {
        query = query.eq('cash_session_id', filters.session_id);
      }
      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }
      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }

      const { data, error } = await query.order('processed_at', { ascending: false });

      if (error) throw error;

      return (data as any)?.map((transaction: any) => ({
        ...transaction,
        comanda: transaction.comandas || undefined,
        processed_by_employee: transaction.profiles || undefined,
        session: transaction.cash_sessions || undefined
      })) || [];

    } catch (error) {
      console.error('Erro na busca de transações:', error);
      throw error;
    }
  }, []);

  const searchSessions = useCallback(async (filters: SessionFilters): Promise<CashSessionWithEmployee[]> => {
    try {
      let query = supabase
        .from('cash_sessions')
        .select(`
          *,
          profiles!cash_sessions_employee_id_fkey(id, name, role)
        `);

      if (filters.start_date) {
        query = query.gte('session_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('session_date', filters.end_date);
      }
      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.has_discrepancy) {
        query = query.neq('cash_discrepancy', 0);
      }

      const { data, error } = await query.order('session_date', { ascending: false });

      if (error) throw error;

      return (data as any)?.map((session: any) => ({
        ...session,
        employee: session.profiles || undefined
      })) || [];

    } catch (error) {
      console.error('Erro na busca de sessões:', error);
      throw error;
    }
  }, []);

  // ===== FUNÇÃO AUXILIAR PARA MÉTRICAS =====

  const atualizarMetricasVenda = useCallback(async (valor: number): Promise<void> => {
    if (!user) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { error } = await (supabase as any).rpc('atualizar_metricas_venda', {
        p_employee_id: user.id,
        p_date: hoje,
        p_sale_amount: valor
      });

      if (error) {
        console.warn('Erro ao atualizar métricas:', error);
      }
    } catch (error) {
      console.warn('Erro ao atualizar métricas:', error);
    }
  }, [user]);

  // ===== EFEITOS =====

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Subscription para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Subscription para sessões de caixa
    const cashSessionsChannel = supabase
      .channel('cash-sessions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_sessions' },
        (payload) => {
          console.log('Mudança em sessões de caixa:', payload);
          loadInitialData();
        }
      )
      .subscribe();

    channels.push(cashSessionsChannel);

    // Subscription para transações
    const transactionsChannel = supabase
      .channel('cash-transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_transactions' },
        (payload) => {
          console.log('Mudança em transações:', payload);
          loadInitialData();
        }
      )
      .subscribe();

    channels.push(transactionsChannel);

    // Subscription para comandas
    const comandasChannel = supabase
      .channel('comandas-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        (payload) => {
          console.log('Mudança em comandas:', payload);
          loadInitialData();
        }
      )
      .subscribe();

    channels.push(comandasChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, loadInitialData]);

  return {
    ...state,
    openCashSession,
    closeCashSession,
    getCurrentSession,
    processComandaPayment,
    processRefund,
    processAdjustment,
    getDailySummary,
    getMonthlyCashReport,
    getEmployeePerformance,
    validateCashCount,
    validateSession,
    refreshData,
    exportReport,
    searchTransactions,
    searchSessions
  };
};