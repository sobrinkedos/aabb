import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  CashSession,
  CashSessionWithEmployee,
  OpenCashSessionData,
  CloseCashSessionData,
  UseCashManagementReturn,
  CashManagementState
} from '../types/cash-management';

export const useCashManagement = (): UseCashManagementReturn => {
  const { user } = useAuth();
  
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

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    if (!user) return;

    try {
      updateState({ loading: true, error: null });

      // Fazer query simples
      const { data: sessionData, error: simpleError } = await supabase
        .from('cash_sessions' as any)
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      if (simpleError && simpleError.code !== 'PGRST116') {
        throw simpleError;
      }

      const currentSession: CashSessionWithEmployee | null = sessionData ? {
        ...sessionData as CashSession,
        employee: { id: user.id, name: user.email || 'Usuário', role: 'employee' }
      } : null;

      updateState({
        currentSession,
        pendingComandas: [],
        todaysTransactions: [],
        todaysSessions: [],
        loading: false
      });

    } catch (error) {
      handleError(error, 'carregamento inicial');
    }
  }, [user, updateState, handleError]);

  // Abrir sessão de caixa
  const openCashSession = useCallback(async (data: OpenCashSessionData): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      updateState({ loading: true, error: null });

      const sessionData = {
        employee_id: user.id,
        opening_amount: data.opening_amount,
        opening_notes: data.opening_notes,
        supervisor_approval_id: data.supervisor_approval_id,
        status: 'open'
      };

      const { data: newSession, error } = await supabase
        .from('cash_sessions' as any)
        .insert(sessionData)
        .select('*')
        .single();

      if (error) throw error;

      await loadInitialData();
    } catch (error) {
      handleError(error, 'abertura de caixa');
      throw error;
    }
  }, [user, updateState, handleError, loadInitialData]);

  // Fechar sessão de caixa
  const closeCashSession = useCallback(async (data: CloseCashSessionData): Promise<void> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão aberta');

    try {
      updateState({ loading: true, error: null });

      const cashDiscrepancy = data.closing_amount - state.currentSession.expected_amount;

      const { error: sessionError } = await supabase
        .from('cash_sessions' as any)
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_amount: data.closing_amount,
          cash_discrepancy: cashDiscrepancy,
          closing_notes: data.closing_notes
        })
        .eq('id', state.currentSession.id);

      if (sessionError) throw sessionError;

      const reconciliationInserts = data.reconciliation.map(recon => ({
        cash_session_id: state.currentSession!.id,
        payment_method: recon.payment_method,
        expected_amount: recon.expected_amount,
        actual_amount: recon.actual_amount,
        transaction_count: recon.transaction_count,
        reconciled_by: user!.id,
        notes: recon.notes
      }));

      const { error: reconError } = await supabase
        .from('payment_reconciliation' as any)
        .insert(reconciliationInserts);

      if (reconError) throw reconError;

      await loadInitialData();
    } catch (error) {
      handleError(error, 'fechamento de caixa');
      throw error;
    }
  }, [state.currentSession, user, updateState, handleError, loadInitialData]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Retornar funções básicas por enquanto
  return {
    // Estado
    currentSession: state.currentSession,
    pendingComandas: state.pendingComandas,
    todaysTransactions: state.todaysTransactions,
    todaysSessions: state.todaysSessions,
    todaysSummary: state.todaysSummary,
    loading: state.loading,
    error: state.error,

    // Funções de sessão
    openCashSession,
    closeCashSession,
    getCurrentSession: () => state.currentSession,

    // Funções de transação (implementação básica)
    processComandaPayment: async () => { throw new Error('Não implementado ainda'); },
    processRefund: async () => { throw new Error('Não implementado ainda'); },
    processAdjustment: async () => { throw new Error('Não implementado ainda'); },

    // Funções de relatório (implementação básica)
    generateDailySummary: async () => state.todaysSummary,
    generateMonthlySummary: async () => ({
      month: new Date().toISOString().slice(0, 7),
      total_sessions: 0,
      total_sales: 0,
      total_transactions: 0,
      employees_performance: [],
      top_payment_methods: [],
      daily_breakdown: [],
      avg_discrepancy: 0,
      peak_days: []
    }),

    // Funções de filtro
    getTransactionsByFilters: async () => [],
    getSessionsByFilters: async () => [],

    // Funções de validação
    validateCashAmount: async () => ({ isValid: true, errors: [] }),
    validateSession: async () => ({ isValid: true, errors: [] }),

    // Função de reload
    reloadData: loadInitialData
  };
};