import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';
import { useAuth } from '../contexts/AuthContextSimple';
import { useBarAttendance } from './useBarAttendance';
import { useApp } from '../contexts/AppContext';
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
  ProcessCashWithdrawalData,
  ProcessTreasuryTransferData,
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
  const { refreshKitchenOrders, refreshBarOrders } = useApp();
  
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
      total_cash_withdrawals: 0,
      total_treasury_transfers: 0,
      cash_balance: 0,
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

      // Carregar TODAS as transações (sem filtro de data primeiro para testar)
      console.log('🔍 Buscando TODAS as transações...');
      
      const { data: allTransactionsEver, error: allError } = await (supabase as any)
        .from('cash_transactions')
        .select('id, transaction_type, payment_method, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('📊 Últimas 10 transações no banco:', allTransactionsEver?.length || 0);
      if (allTransactionsEver && allTransactionsEver.length > 0) {
        console.table(allTransactionsEver.map((t: any) => ({
          id: t.id.slice(-8),
          tipo: t.transaction_type,
          metodo: t.payment_method,
          valor: t.amount,
          data: new Date(t.created_at).toLocaleDateString('pt-BR')
        })));
      }

      // Buscar transações do dia (primeiro tentar created_at, depois processed_at)
      console.log('🔍 Buscando transações para o dia:', today);
      
      let transactionsData: any[] = [];
      let transactionsError: any = null;
      
      // Tentar buscar por created_at primeiro
      const { data: createdAtData, error: createdAtError } = await (supabase as any)
        .from('cash_transactions')
        .select(`
          *,
          comandas(id, customer_name, table_id, total),
          profiles!cash_transactions_processed_by_fkey(id, name),
          cash_sessions(id, session_date, employee_id)
        `)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (!createdAtError && createdAtData) {
        transactionsData = createdAtData;
        console.log('📊 Transações encontradas por created_at:', transactionsData.length);
      }

      // Se não encontrou por created_at, tentar por processed_at
      if (transactionsData.length === 0) {
        const { data: processedAtData, error: processedAtError } = await (supabase as any)
          .from('cash_transactions')
          .select(`
            *,
            comandas(id, customer_name, table_id, total),
            profiles!cash_transactions_processed_by_fkey(id, name),
            cash_sessions(id, session_date, employee_id)
          `)
          .gte('processed_at', `${today}T00:00:00.000Z`)
          .lt('processed_at', `${today}T23:59:59.999Z`)
          .order('processed_at', { ascending: false });

        if (!processedAtError && processedAtData) {
          transactionsData = processedAtData;
          console.log('📊 Transações encontradas por processed_at:', transactionsData.length);
        } else {
          transactionsError = processedAtError;
        }
      }

      console.log('📊 Transações de hoje encontradas:', transactionsData?.length || 0);
      if (transactionsData && transactionsData.length > 0) {
        console.log('📋 Primeira transação de hoje:', transactionsData[0]);
        console.log('💰 Métodos de pagamento de hoje:', [...new Set(transactionsData.map((t: any) => t.payment_method))]);
      }

      if (transactionsError) {
        console.error('❌ Erro ao buscar transações:', transactionsError);
        throw transactionsError;
      }

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
          name: user.name || 'Usuário', 
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
        comanda: transaction.comandas || undefined,
        processed_by_employee: transaction.profiles || { id: user.id, name: user.name || 'Usuário' },
        session: transaction.cash_sessions || undefined
      })) || [];

      const todaysSessions: CashSessionWithEmployee[] = sessionsData?.map((session: any) => ({
        ...session,
        employee: { id: user.id, name: user.name || 'Usuário', role: 'employee' }
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

  // ===== FUNÇÕES AUXILIARES PARA HISTÓRICO =====

  const getLastClosedSessionBalance = useCallback(async (employeeId?: string): Promise<number> => {
    try {
      const targetEmployeeId = employeeId || user?.id;
      if (!targetEmployeeId) return 0;

      // Buscar a última sessão fechada do funcionário
      const { data: lastSession, error } = await (supabase as any)
        .from('cash_sessions')
        .select('closing_amount, session_date')
        .eq('employee_id', targetEmployeeId)
        .eq('status', 'closed')
        .order('session_date', { ascending: false })
        .order('closed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar última sessão fechada:', error);
        return 0;
      }

      return lastSession?.closing_amount || 0;
    } catch (error) {
      console.error('Erro ao obter saldo da última sessão:', error);
      return 0;
    }
  }, [user]);

  const getDailyCashMovement = useCallback(async (date: string): Promise<{
    sessions: CashSessionWithEmployee[];
    transactions: CashTransactionWithDetails[];
    summary: {
      opening_total: number;
      closing_total: number;
      sales_total: number;
      cash_sales: number;
      card_sales: number;
      pix_sales: number;
      adjustments: number;
      discrepancy_total: number;
      transaction_count: number;
    };
  }> => {
    try {
      // Buscar todas as sessões do dia
      const { data: sessionsData, error: sessionsError } = await (supabase as any)
        .from('cash_sessions')
        .select(`
          *,
          profiles!cash_sessions_employee_id_fkey(id, name, role)
        `)
        .eq('session_date', date)
        .order('opened_at', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Buscar todas as transações do dia
      console.log('🔍 Buscando transações para movimento do dia:', date);
      
      const { data: transactionsData, error: transactionsError } = await (supabase as any)
        .from('cash_transactions')
        .select(`
          *,
          comandas(id, customer_name, table_id, total),
          profiles!cash_transactions_processed_by_fkey(id, name),
          cash_sessions(id, session_date, employee_id)
        `)
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lt('created_at', `${date}T23:59:59.999Z`)
        .order('created_at', { ascending: true });

      console.log('📊 Transações encontradas para movimento:', transactionsData?.length || 0);

      if (transactionsError) throw transactionsError;

      // Processar dados
      const sessions: CashSessionWithEmployee[] = sessionsData?.map((session: any) => ({
        ...session,
        employee: session.profiles || { id: session.employee_id, name: 'Usuário', role: 'employee' }
      })) || [];

      const transactions: CashTransactionWithDetails[] = transactionsData?.map((transaction: any) => ({
        ...transaction,
        comanda: transaction.comandas || undefined,
        processed_by_employee: transaction.profiles || { id: transaction.processed_by, name: 'Usuário' },
        session: transaction.cash_sessions || undefined
      })) || [];

      // Calcular resumo
      const opening_total = sessions.reduce((sum, session) => sum + (session.opening_amount || 0), 0);
      const closing_total = sessions.reduce((sum, session) => sum + (session.closing_amount || 0), 0);
      const discrepancy_total = sessions.reduce((sum, session) => sum + (session.cash_discrepancy || 0), 0);

      const sales_transactions = transactions.filter(t => t.transaction_type === 'sale');
      const sales_total = sales_transactions.reduce((sum, t) => sum + t.amount, 0);
      const cash_sales = sales_transactions.filter(t => t.payment_method === 'dinheiro').reduce((sum, t) => sum + t.amount, 0);
      const card_sales = sales_transactions.filter(t => ['cartao_debito', 'cartao_credito'].includes(t.payment_method)).reduce((sum, t) => sum + t.amount, 0);
      const pix_sales = sales_transactions.filter(t => t.payment_method === 'pix').reduce((sum, t) => sum + t.amount, 0);
      const adjustments = transactions.filter(t => t.transaction_type === 'adjustment').reduce((sum, t) => sum + t.amount, 0);

      return {
        sessions,
        transactions,
        summary: {
          opening_total,
          closing_total,
          sales_total,
          cash_sales,
          card_sales,
          pix_sales,
          adjustments,
          discrepancy_total,
          transaction_count: transactions.length
        }
      };
    } catch (error) {
      console.error('Erro ao obter movimento diário:', error);
      // Retornar dados padrão em caso de erro
      return {
        sessions: [],
        transactions: [],
        summary: {
          opening_total: 0,
          closing_total: 0,
          sales_total: 0,
          cash_sales: 0,
          card_sales: 0,
          pix_sales: 0,
          adjustments: 0,
          discrepancy_total: 0,
          transaction_count: 0
        }
      };
    }
  }, []);

  // ===== FUNÇÕES DE SESSÃO DE CAIXA =====

  const openCashSession = useCallback(async (data: OpenCashSessionData): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('Iniciando abertura de caixa para usuário:', user.id);
      updateState({ loading: true, error: null });

      // Buscar empresa_id do usuário
      console.log('Buscando empresa_id para o usuário...');
      const { data: usuarioEmpresa, error: empresaError } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (empresaError) {
        console.error('Erro ao buscar empresa do usuário:', empresaError);
        // Usar empresa padrão se não encontrar
        console.log('Usando empresa padrão...');
      }

      const empresa_id = (usuarioEmpresa as any)?.empresa_id || '1'; // Fallback para empresa padrão

      const sessionData = {
        employee_id: user.id,
        empresa_id: empresa_id,
        opening_amount: data.opening_amount,
        opening_notes: data.opening_notes,
        supervisor_approval_id: data.supervisor_approval_id,
        status: 'open' as CashSessionStatus
      };

      console.log('Dados da sessão com empresa_id:', sessionData);

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
    console.log('🏦 Processando pagamento de comanda...');
    console.log('📊 Sessão atual:', state.currentSession);
    console.log('💳 Dados do pagamento:', data);

    if (!state.currentSession) {
      console.error('❌ Nenhuma sessão de caixa aberta!');
      throw new Error('Nenhuma sessão de caixa aberta');
    }

    try {
      updateState({ loading: true, error: null });

      // Fechar comanda usando o hook do bar attendance
      await fecharComanda(data.comanda_id, data.payment_method, data.notes);

      // Registrar transação no caixa
      console.log('💰 Criando transação de pagamento...');
      // Obter empresa_id do usuário atual
      const empresaId = await getCurrentUserEmpresaId();
      
      if (!empresaId) {
        throw new Error('Não foi possível identificar a empresa do usuário');
      }

      const transactionData = {
        cash_session_id: state.currentSession.id,
        comanda_id: data.comanda_id,
        transaction_type: 'sale' as TransactionType,
        payment_method: data.payment_method,
        amount: data.amount,
        processed_by: user!.id,
        reference_number: data.reference_number,
        customer_name: data.customer_name,
        notes: data.notes,
        empresa_id: empresaId
      };

      console.log('📋 Dados da transação:', transactionData);

      const { data: insertedTransaction, error: transactionError } = await (supabase as any)
        .from('cash_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Erro ao inserir transação:', transactionError);
        throw transactionError;
      }

      console.log('✅ Transação criada com sucesso:', insertedTransaction);

      // Atualizar métricas do funcionário
      await atualizarMetricasVenda(data.amount);

      // Recarregar dados
      await loadInitialData();
      await recarregarBarAttendance();
      
      // Forçar atualização dos monitores se for pagamento de balcão
      if (data.notes && data.notes.includes('balcão')) {
        console.log('🔄 Forçando atualização dos monitores após pagamento de balcão...');
        
        // Atualização imediata
        setTimeout(async () => {
          await Promise.all([
            refreshKitchenOrders(),
            refreshBarOrders()
          ]);
          console.log('🚀 Monitores atualizados imediatamente!');
        }, 500);
        
        // Atualização backup
        setTimeout(async () => {
          await Promise.all([
            refreshKitchenOrders(),
            refreshBarOrders()
          ]);
          console.log('🎉 Atualização backup dos monitores concluída!');
        }, 2000);
      }

    } catch (error) {
      handleError(error, 'processamento de pagamento');
      throw error;
    }
  }, [state.currentSession, user, fecharComanda, updateState, handleError, loadInitialData, recarregarBarAttendance]);

  const processRefund = useCallback(async (data: ProcessRefundData): Promise<void> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão de caixa aberta');

    try {
      updateState({ loading: true, error: null });

      // Obter empresa_id do usuário atual
      const empresaId = await getCurrentUserEmpresaId();
      
      if (!empresaId) {
        throw new Error('Não foi possível identificar a empresa do usuário');
      }

      const transactionData = {
        cash_session_id: state.currentSession.id,
        transaction_type: 'refund' as TransactionType,
        payment_method: data.refund_method,
        amount: -Math.abs(data.amount), // Valor negativo para estorno
        processed_by: user!.id,
        notes: `Estorno: ${data.reason}. Transação original: ${data.original_transaction_id}`,
        empresa_id: empresaId
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

      // Obter empresa_id do usuário atual
      const empresaId = await getCurrentUserEmpresaId();
      
      if (!empresaId) {
        throw new Error('Não foi possível identificar a empresa do usuário');
      }

      const adjustmentAmount = data.adjustment_type === 'add' ? data.amount : -data.amount;

      const transactionData = {
        cash_session_id: state.currentSession.id,
        transaction_type: 'adjustment' as TransactionType,
        payment_method: data.payment_method || 'dinheiro',
        amount: adjustmentAmount,
        processed_by: user!.id,
        notes: `Ajuste ${data.adjustment_type === 'add' ? 'positivo' : 'negativo'}: ${data.reason}`,
        empresa_id: empresaId
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

  // ===== FUNÇÕES DE SAÍDA DE DINHEIRO E TRANSFERÊNCIA =====

  const processCashWithdrawal = useCallback(async (data: ProcessCashWithdrawalData): Promise<string> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão de caixa aberta');

    try {
      updateState({ loading: true, error: null });

      // Obter empresa_id do usuário atual
      const empresaId = await getCurrentUserEmpresaId();
      
      if (!empresaId) {
        throw new Error('Não foi possível identificar a empresa do usuário');
      }

      const transactionData = {
        cash_session_id: state.currentSession.id,
        transaction_type: 'adjustment' as TransactionType, // Usando 'adjustment' temporariamente até migrar o banco
        payment_method: 'dinheiro' as PaymentMethod,
        amount: -Math.abs(data.amount), // Valor negativo para saída
        processed_by: user!.id,
        notes: `[SAÍDA] ${data.purpose}: ${data.reason}. Autorizado por: ${data.authorized_by}${data.recipient ? `. Destinatário: ${data.recipient}` : ''}`,
        empresa_id: empresaId
      };

      const { data: newTransaction, error } = await (supabase as any)
        .from('cash_transactions')
        .insert(transactionData)
        .select('*')
        .single();

      if (error) throw error;

      // Atualizar valor esperado da sessão
      const newExpectedAmount = state.currentSession.expected_amount - data.amount;
      const { error: sessionError } = await (supabase as any)
        .from('cash_sessions')
        .update({ expected_amount: newExpectedAmount })
        .eq('id', state.currentSession.id);

      if (sessionError) throw sessionError;

      await loadInitialData();
      return newTransaction.id; // Retorna ID da transação para o comprovante
    } catch (error) {
      handleError(error, 'processamento de saída de dinheiro');
      throw error;
    }
  }, [state.currentSession, user, updateState, handleError, loadInitialData]);

  const processTreasuryTransfer = useCallback(async (data: ProcessTreasuryTransferData): Promise<string> => {
    if (!state.currentSession) throw new Error('Nenhuma sessão de caixa aberta');

    try {
      updateState({ loading: true, error: null });

      // Obter empresa_id do usuário atual
      const empresaId = await getCurrentUserEmpresaId();
      
      if (!empresaId) {
        throw new Error('Não foi possível identificar a empresa do usuário');
      }

      // Criar transação de transferência
      const transactionData = {
        cash_session_id: state.currentSession.id,
        transaction_type: 'adjustment' as TransactionType, // Usando 'adjustment' temporariamente até migrar o banco
        payment_method: 'dinheiro' as PaymentMethod,
        amount: -Math.abs(data.amount), // Valor negativo para transferência
        processed_by: user!.id,
        notes: `[TRANSFERÊNCIA TESOURARIA] Autorizado por: ${data.authorized_by}${data.treasury_receipt_number ? `. Comprovante: ${data.treasury_receipt_number}` : ''}${data.notes ? `. Obs: ${data.notes}` : ''}`,
        empresa_id: empresaId
      };

      const { data: newTransaction, error } = await (supabase as any)
        .from('cash_transactions')
        .insert(transactionData)
        .select('*')
        .single();

      if (error) throw error;

      // Atualizar valor esperado da sessão
      const newExpectedAmount = state.currentSession.expected_amount - data.amount;
      const { error: sessionError } = await (supabase as any)
        .from('cash_sessions')
        .update({ expected_amount: newExpectedAmount })
        .eq('id', state.currentSession.id);

      if (sessionError) throw sessionError;

      await loadInitialData();
      return newTransaction.id; // Retorna ID da transação para o comprovante
    } catch (error) {
      handleError(error, 'processamento de transferência para tesouraria');
      throw error;
    }
  }, [state.currentSession, user, updateState, handleError, loadInitialData]);

  // ===== FUNÇÕES DE RELATÓRIO =====

  const generateDailySummary = useCallback(async (date?: Date): Promise<DailySummary> => {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    try {
      // Buscar TODAS as transações do dia (tentando ambos os campos de data)
      console.log('🔍 Gerando resumo para o dia:', dateStr);
      
      let allTransactionsData: any[] = [];
      
      // Tentar buscar por created_at primeiro
      const { data: createdData, error: createdError } = await (supabase as any)
        .from('cash_transactions')
        .select(`
          *,
          comandas(id, customer_name, table_id, total),
          profiles!cash_transactions_processed_by_fkey(id, name),
          cash_sessions(id, session_date, employee_id)
        `)
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lt('created_at', `${dateStr}T23:59:59.999Z`);

      if (!createdError && createdData) {
        allTransactionsData = createdData;
        console.log('📊 Resumo: transações por created_at:', allTransactionsData.length);
      }

      // Se não encontrou, tentar por processed_at
      if (allTransactionsData.length === 0) {
        const { data: processedData, error: processedError } = await (supabase as any)
          .from('cash_transactions')
          .select(`
            *,
            comandas(id, customer_name, table_id, total),
            profiles!cash_transactions_processed_by_fkey(id, name),
            cash_sessions(id, session_date, employee_id)
          `)
          .gte('processed_at', `${dateStr}T00:00:00.000Z`)
          .lt('processed_at', `${dateStr}T23:59:59.999Z`);

        if (!processedError && processedData) {
          allTransactionsData = processedData;
          console.log('📊 Resumo: transações por processed_at:', allTransactionsData.length);
        }
      }

      const transactionsError = null; // Simplificado para não quebrar o fluxo

      console.log('📊 TODAS as transações encontradas:', allTransactionsData?.length || 0);
      
      // Filtrar apenas vendas para o resumo
      const transactionsData = allTransactionsData?.filter((t: any) => t.transaction_type === 'sale') || [];
      console.log('💰 Transações de venda:', transactionsData.length);
      
      if (allTransactionsData && allTransactionsData.length > 0) {
        console.log('📋 Tipos de transação encontrados:', [...new Set(allTransactionsData.map((t: any) => t.transaction_type))]);
        console.log('💳 Métodos de pagamento encontrados:', [...new Set(allTransactionsData.map((t: any) => t.payment_method))]);
        console.log('🔍 Primeira transação:', allTransactionsData[0]);
      }

      if (transactionsError) {
        console.error('Erro ao buscar transações para resumo:', transactionsError);
        throw transactionsError;
      }

      // Buscar sessões do dia
      const { data: sessionsData, error: sessionsError } = await (supabase as any)
        .from('cash_sessions')
        .select(`
          *,
          profiles!cash_sessions_employee_id_fkey(id, name, role)
        `)
        .eq('session_date', dateStr);

      if (sessionsError) {
        console.error('Erro ao buscar sessões para resumo:', sessionsError);
        throw sessionsError;
      }

      const transactions = transactionsData || [];
      const sessions = sessionsData || [];

      console.log('🧮 Iniciando cálculo de totais...');
      console.log('📊 Transações para calcular:', transactions.length);

      // Calcular totais por método de pagamento de forma mais simples
      const paymentMethodTotals: any = {};
      
      transactions.forEach((transaction: any, index: number) => {
        const method = transaction.payment_method || 'desconhecido';
        const amount = Number(transaction.amount) || 0;
        
        console.log(`💳 [${index + 1}] ${method}: R$ ${amount}`);
        
        if (!paymentMethodTotals[method]) {
          paymentMethodTotals[method] = { amount: 0, count: 0 };
        }
        
        paymentMethodTotals[method].amount += amount;
        paymentMethodTotals[method].count += 1;
      });

      console.log('📊 Totais finais por método:', paymentMethodTotals);

      const totalSales = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalTransactions = transactions.length;

      // Criar array de métodos de pagamento com dados reais
      console.log('🏗️ Criando array de métodos de pagamento...');
      
      const allMethods = ['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia'];
      const byPaymentMethod = allMethods.map(method => {
        const methodData = paymentMethodTotals[method] || { amount: 0, count: 0 };
        const percentage = totalSales > 0 ? (methodData.amount / totalSales) * 100 : 0;
        
        console.log(`📋 ${method}: R$ ${methodData.amount} (${methodData.count} transações) - ${percentage.toFixed(1)}%`);
        
        return {
          payment_method: method as PaymentMethod,
          amount: methodData.amount,
          transaction_count: methodData.count,
          percentage: percentage,
          expected_amount: methodData.amount,
          actual_amount: methodData.amount,
          discrepancy: 0
        };
      });

      console.log('✅ Array de métodos criado:', byPaymentMethod);

      // Calcular performance por funcionário
      const employeePerformance = transactions.reduce((acc: any, transaction: any) => {
        const employeeId = transaction.processed_by;
        const employeeName = transaction.profiles?.name || 'Funcionário';
        
        if (!acc[employeeId]) {
          acc[employeeId] = {
            employee_id: employeeId,
            employee_name: employeeName,
            session_count: 0,
            total_sales: 0,
            transaction_count: 0,
            avg_ticket: 0,
            cash_discrepancy: 0,
            session_duration: '8:00'
          };
        }
        
        acc[employeeId].total_sales += transaction.amount;
        acc[employeeId].transaction_count += 1;
        
        return acc;
      }, {});

      // Calcular ticket médio para cada funcionário
      Object.values(employeePerformance).forEach((emp: any) => {
        emp.avg_ticket = emp.transaction_count > 0 ? emp.total_sales / emp.transaction_count : 0;
      });

      // Calcular saídas de dinheiro e transferências
      const { data: withdrawalsData } = await (supabase as any)
        .from('cash_transactions')
        .select('amount, notes, transaction_type')
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lt('created_at', `${dateStr}T23:59:59.999Z`)
        .in('transaction_type', ['adjustment', 'refund']);

      const totalWithdrawals = (withdrawalsData || [])
        .filter((t: any) => t.notes?.includes('[SAÍDA]'))
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      const totalTransfers = (withdrawalsData || [])
        .filter((t: any) => t.notes?.includes('[TRANSFERÊNCIA TESOURARIA]'))
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      return {
        session_date: dateStr,
        total_sessions: sessions.length,
        total_sales: totalSales,
        total_transactions: totalTransactions,
        total_cash_withdrawals: totalWithdrawals,
        total_treasury_transfers: totalTransfers,
        cash_balance: totalSales - totalWithdrawals - totalTransfers,
        by_payment_method: byPaymentMethod,
        by_employee: Object.values(employeePerformance),
        discrepancies: sessions
          .filter((s: any) => Math.abs(s.cash_discrepancy || 0) > 0)
          .map((s: any) => ({
            employee_id: s.employee_id,
            employee_name: s.profiles?.name || 'Funcionário',
            session_id: s.id,
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
    processCashWithdrawal,
    processTreasuryTransfer,
    getDailySummary,
    getMonthlyCashReport,
    getEmployeePerformance,
    validateCashCount,
    validateSession,
    refreshData,
    exportReport,
    searchTransactions,
    searchSessions,
    getLastClosedSessionBalance,
    getDailyCashMovement
  };
};