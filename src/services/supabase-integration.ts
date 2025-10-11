/**
 * Serviço de Integração com Supabase
 * 
 * Centraliza todas as operações de banco de dados para o módulo de vendas
 */

import { supabase } from '../lib/supabase';
import { 
  Command, 
  CommandItem, 
  CashSession, 
  Transaction, 
  PaymentPending,
  ComandaStatus 
} from '../types/sales-management';
import type { Database } from '../types/supabase';

type SupabaseComanda = Database['public']['Tables']['comandas']['Row'];
type SupabaseComandaInsert = Database['public']['Tables']['comandas']['Insert'];
type SupabaseComandaUpdate = Database['public']['Tables']['comandas']['Update'];

type SupabaseCashSession = Database['public']['Tables']['cash_sessions']['Row'];
type SupabaseCashSessionInsert = Database['public']['Tables']['cash_sessions']['Insert'];

type SupabaseCashTransaction = Database['public']['Tables']['cash_transactions']['Row'];
type SupabaseCashTransactionInsert = Database['public']['Tables']['cash_transactions']['Insert'];

export class SupabaseIntegration {
  private static instance: SupabaseIntegration;

  static getInstance(): SupabaseIntegration {
    if (!SupabaseIntegration.instance) {
      SupabaseIntegration.instance = new SupabaseIntegration();
    }
    return SupabaseIntegration.instance;
  }

  // ===== COMANDAS =====

  /**
   * Converte comanda do Supabase para o formato da aplicação
   */
  private mapComandaFromSupabase(supabaseComanda: SupabaseComanda, items?: any[]): Command {
    return {
      id: supabaseComanda.id,
      mesa_id: supabaseComanda.table_id || undefined,
      cliente_id: supabaseComanda.customer_id || undefined,
      nome_cliente: supabaseComanda.customer_name || undefined,
      funcionario_id: supabaseComanda.employee_id,
      status: this.mapStatusFromSupabase(supabaseComanda.status),
      total: supabaseComanda.total || 0,
      quantidade_pessoas: supabaseComanda.people_count || 1,
      aberta_em: supabaseComanda.opened_at || supabaseComanda.created_at || new Date().toISOString(),
      fechada_em: supabaseComanda.closed_at || undefined,
      observacoes: supabaseComanda.notes || undefined,
      created_at: supabaseComanda.created_at || new Date().toISOString(),
      updated_at: supabaseComanda.updated_at || supabaseComanda.created_at || new Date().toISOString(),
      data_abertura: supabaseComanda.opened_at || supabaseComanda.created_at || new Date().toISOString(),
      itens: items || []
    };
  }

  /**
   * Converte status do Supabase para o formato da aplicação
   */
  private mapStatusFromSupabase(status: string | null): ComandaStatus {
    switch (status) {
      case 'open': return ComandaStatus.ABERTA;
      case 'pending_payment': return ComandaStatus.PENDENTE_PAGAMENTO;
      case 'closed': return ComandaStatus.FECHADA;
      case 'cancelled': return ComandaStatus.CANCELADA;
      default: return ComandaStatus.ABERTA;
    }
  }

  /**
   * Converte status da aplicação para o formato do Supabase
   */
  private mapStatusToSupabase(status: ComandaStatus): string {
    switch (status) {
      case ComandaStatus.ABERTA: return 'open';
      case ComandaStatus.PENDENTE_PAGAMENTO: return 'pending_payment';
      case ComandaStatus.FECHADA: return 'closed';
      case ComandaStatus.CANCELADA: return 'cancelled';
      default: return 'open';
    }
  }

  /**
   * Busca uma comanda por ID
   */
  async getComanda(comandaId: string): Promise<Command | null> {
    try {
      const { data: comanda, error } = await supabase
        .from('comandas')
        .select(`
          *,
          comanda_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price,
            status,
            notes,
            created_at
          )
        `)
        .eq('id', comandaId)
        .single();

      if (error) {
        console.error('Erro ao buscar comanda:', error);
        return null;
      }

      return this.mapComandaFromSupabase(comanda, comanda.comanda_items || []);
    } catch (error) {
      console.error('Erro ao buscar comanda:', error);
      return null;
    }
  }

  /**
   * Lista comandas abertas
   */
  async getComandasAbertas(): Promise<Command[]> {
    try {
      const { data: comandas, error } = await supabase
        .from('comandas')
        .select(`
          *,
          comanda_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price,
            status,
            notes,
            created_at
          )
        `)
        .in('status', ['open', 'pending_payment'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar comandas abertas:', error);
        return [];
      }

      return comandas.map(comanda => 
        this.mapComandaFromSupabase(comanda, comanda.comanda_items || [])
      );
    } catch (error) {
      console.error('Erro ao buscar comandas abertas:', error);
      return [];
    }
  }

  /**
   * Atualiza o status de uma comanda
   */
  async updateComandaStatus(comandaId: string, status: ComandaStatus): Promise<boolean> {
    try {
      const updateData: SupabaseComandaUpdate = {
        status: this.mapStatusToSupabase(status),
        updated_at: new Date().toISOString()
      };

      if (status === ComandaStatus.FECHADA) {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('comandas')
        .update(updateData)
        .eq('id', comandaId);

      if (error) {
        console.error('Erro ao atualizar status da comanda:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status da comanda:', error);
      return false;
    }
  }

  // ===== SESSÕES DE CAIXA =====

  /**
   * Converte sessão de caixa do Supabase para o formato da aplicação
   */
  private mapCashSessionFromSupabase(supabaseSession: SupabaseCashSession): CashSession {
    return {
      id: supabaseSession.id,
      operator_id: supabaseSession.employee_id,
      opened_at: supabaseSession.opened_at || supabaseSession.created_at || new Date().toISOString(),
      closed_at: supabaseSession.closed_at || undefined,
      initial_amount: supabaseSession.initial_amount || 0,
      status: supabaseSession.status === 'closed' ? 'closed' : 'open',
      transactions: [],
      cash_movements: [],
      expected_amount: supabaseSession.expected_amount || 0,
      actual_amount: supabaseSession.actual_amount || 0,
      discrepancy: supabaseSession.cash_discrepancy || 0
    };
  }

  /**
   * Busca a sessão de caixa atual (aberta)
   */
  async getCurrentCashSession(): Promise<CashSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma sessão encontrada
          return null;
        }
        console.error('Erro ao buscar sessão de caixa atual:', error);
        return null;
      }

      return this.mapCashSessionFromSupabase(session);
    } catch (error) {
      console.error('Erro ao buscar sessão de caixa atual:', error);
      return null;
    }
  }

  /**
   * Abre uma nova sessão de caixa
   */
  async openCashSession(initialAmount: number, operatorId: string): Promise<CashSession | null> {
    try {
      const sessionData: SupabaseCashSessionInsert = {
        employee_id: operatorId,
        initial_amount: initialAmount,
        expected_amount: initialAmount,
        actual_amount: 0,
        cash_discrepancy: 0,
        status: 'open',
        opened_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: session, error } = await supabase
        .from('cash_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao abrir sessão de caixa:', error);
        return null;
      }

      return this.mapCashSessionFromSupabase(session);
    } catch (error) {
      console.error('Erro ao abrir sessão de caixa:', error);
      return null;
    }
  }

  /**
   * Fecha uma sessão de caixa
   */
  async closeCashSession(sessionId: string, actualAmount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_sessions')
        .update({
          status: 'closed',
          actual_amount: actualAmount,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Erro ao fechar sessão de caixa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao fechar sessão de caixa:', error);
      return false;
    }
  }

  // ===== TRANSAÇÕES =====

  /**
   * Cria uma transação de pagamento
   */
  async createPaymentTransaction(
    sessionId: string,
    comandaId: string,
    amount: number,
    paymentMethod: string,
    operatorId: string,
    observations?: string
  ): Promise<string | null> {
    try {
      const transactionData: SupabaseCashTransactionInsert = {
        cash_session_id: sessionId,
        comanda_id: comandaId,
        transaction_type: 'sale',
        amount: amount,
        payment_method: paymentMethod,
        processed_by: operatorId,
        processed_at: new Date().toISOString(),
        notes: observations,
        created_at: new Date().toISOString()
      };

      const { data: transaction, error } = await supabase
        .from('cash_transactions')
        .insert(transactionData)
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao criar transação:', error);
        return null;
      }

      return transaction.id;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return null;
    }
  }

  /**
   * Busca transações de uma sessão
   */
  async getSessionTransactions(sessionId: string): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('cash_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações:', error);
        return [];
      }

      return transactions.map(transaction => ({
        id: transaction.id,
        type: transaction.transaction_type as any,
        amount: transaction.amount,
        payment_method: transaction.payment_method as any,
        command_id: transaction.comanda_id || undefined,
        cash_session_id: transaction.cash_session_id,
        processed_at: transaction.processed_at || transaction.created_at || new Date().toISOString(),
        processed_by: transaction.processed_by,
        observations: transaction.notes || undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
  }

  // ===== PENDÊNCIAS =====

  /**
   * Cria uma pendência de pagamento (usando a tabela payment_reconciliation)
   */
  async createPaymentPending(
    comandaId: string,
    amount: number,
    commissionPercentage: number,
    commissionAmount: number,
    paymentMethod: string,
    sessionId: string,
    observations?: string
  ): Promise<string | null> {
    try {
      const pendingData = {
        comanda_id: comandaId,
        cash_session_id: sessionId,
        expected_amount: amount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        payment_method: paymentMethod,
        status: 'pending',
        notes: observations,
        created_at: new Date().toISOString()
      };

      const { data: pending, error } = await supabase
        .from('payment_reconciliation')
        .insert(pendingData)
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao criar pendência:', error);
        return null;
      }

      return pending.id;
    } catch (error) {
      console.error('Erro ao criar pendência:', error);
      return null;
    }
  }

  /**
   * Busca pendências de pagamento
   */
  async getPendingPayments(sessionId?: string): Promise<PaymentPending[]> {
    try {
      let query = supabase
        .from('payment_reconciliation')
        .select('*')
        .eq('status', 'pending');

      if (sessionId) {
        query = query.eq('cash_session_id', sessionId);
      }

      const { data: pendings, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pendências:', error);
        return [];
      }

      return pendings.map(pending => ({
        id: pending.id,
        command_id: pending.comanda_id || '',
        amount: pending.expected_amount || 0,
        commission_percentage: pending.commission_percentage || 0,
        commission_amount: pending.commission_amount || 0,
        payment_method: pending.payment_method as any,
        status: 'pending' as const,
        created_at: pending.created_at || new Date().toISOString(),
        observations: pending.notes || undefined,
        cash_session_id: pending.cash_session_id || ''
      }));
    } catch (error) {
      console.error('Erro ao buscar pendências:', error);
      return [];
    }
  }

  /**
   * Processa uma pendência de pagamento
   */
  async processPendingPayment(pendingId: string, transactionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_reconciliation')
        .update({
          status: 'processed',
          transaction_id: transactionId,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingId);

      if (error) {
        console.error('Erro ao processar pendência:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao processar pendência:', error);
      return false;
    }
  }
}