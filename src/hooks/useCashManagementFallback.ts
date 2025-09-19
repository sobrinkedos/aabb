import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import {
  CashManagementState,
  UseCashManagementReturn,
  OpenCashSessionData,
  CloseCashSessionData,
  ProcessComandaPaymentData,
  DailySummary
} from '../types/cash-management';

// Hook de fallback que funciona sem as tabelas de caixa
export const useCashManagementFallback = (): UseCashManagementReturn => {
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
    loading: false, // Sem loading para evitar problemas
    error: null
  });

  const updateState = useCallback((updates: Partial<CashManagementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Funções mock que retornam sucesso sem fazer nada
  const openCashSession = useCallback(async (data: OpenCashSessionData): Promise<void> => {
    console.log('Mock: Abrindo caixa com valor:', data.opening_amount);
    // Simular abertura de sessão
    updateState({
      currentSession: {
        id: 'mock-session-id',
        employee_id: user?.id || 'mock-user',
        session_date: new Date().toISOString().split('T')[0],
        opened_at: new Date().toISOString(),
        closed_at: null,
        opening_amount: data.opening_amount,
        closing_amount: null,
        expected_amount: data.opening_amount,
        cash_discrepancy: null,
        status: 'open',
        supervisor_approval_id: data.supervisor_approval_id,
        opening_notes: data.opening_notes,
        closing_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        employee: {
          id: user?.id || 'mock-user',
          name: user?.name || 'Usuário Mock',
          role: user?.role || 'employee'
        }
      }
    });
  }, [user, updateState]);

  const closeCashSession = useCallback(async (data: CloseCashSessionData): Promise<void> => {
    console.log('Mock: Fechando caixa com valor:', data.closing_amount);
    updateState({ currentSession: null });
  }, [updateState]);

  const getCurrentSession = useCallback(() => {
    return state.currentSession;
  }, [state.currentSession]);

  const processComandaPayment = useCallback(async (data: ProcessComandaPaymentData): Promise<void> => {
    console.log('Mock: Processando pagamento da comanda:', data.comanda_id);
  }, []);

  const processRefund = useCallback(async (data: any): Promise<void> => {
    console.log('Mock: Processando estorno:', data);
  }, []);

  const processAdjustment = useCallback(async (data: any): Promise<void> => {
    console.log('Mock: Processando ajuste:', data);
  }, []);

  const getDailySummary = useCallback(async (date?: Date): Promise<DailySummary> => {
    return state.todaysSummary;
  }, [state.todaysSummary]);

  const getMonthlyCashReport = useCallback(async (month: string) => {
    throw new Error('Relatório mensal ainda não implementado');
  }, []);

  const getEmployeePerformance = useCallback(async (employeeId: string, period: any) => {
    throw new Error('Relatório de performance ainda não implementado');
  }, []);

  const validateCashCount = useCallback(async (amount: number) => {
    return {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };
  }, []);

  const validateSession = useCallback(async (sessionId: string) => {
    return {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    console.log('Mock: Atualizando dados');
  }, []);

  const exportReport = useCallback(async (type: 'daily' | 'monthly', format: 'pdf' | 'excel'): Promise<void> => {
    throw new Error('Exportação ainda não implementada');
  }, []);

  const searchTransactions = useCallback(async (filters: any) => {
    return [];
  }, []);

  const searchSessions = useCallback(async (filters: any) => {
    return [];
  }, []);

  // Efeito para simular carregamento inicial
  useEffect(() => {
    updateState({ loading: false });
  }, [updateState]);

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