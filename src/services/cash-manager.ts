/**
 * Gerenciador de Caixa para o Módulo de Gestão de Vendas
 * 
 * Esta classe é responsável por controlar sessões de caixa, registrar transações,
 * gerenciar sangrias/suprimentos e calcular divergências no fechamento
 * 
 * VERSÃO REAL - Integrada com Supabase
 */

import { 
  CashSession, 
  CashClosing, 
  Transaction, 
  PaymentData, 
  PaymentPending,
  CashMovement,
  PaymentMethod,
  CashSessionStatus
} from '../types/sales-management';
import { SupabaseIntegration } from './supabase-integration';

export class CashManager {
  private static instance: CashManager;
  private supabaseIntegration: SupabaseIntegration;
  private currentSession: CashSession | null = null;
  private transactions: Transaction[] = [];
  private pendingPayments: PaymentPending[] = [];
  private cashMovements: CashMovement[] = [];

  private constructor() {
    this.supabaseIntegration = SupabaseIntegration.getInstance();
    this.loadCurrentSession();
  }

  static getInstance(): CashManager {
    if (!CashManager.instance) {
      CashManager.instance = new CashManager();
    }
    return CashManager.instance;
  }

  /**
   * Carrega a sessão atual do banco de dados
   */
  private async loadCurrentSession(): Promise<void> {
    try {
      this.currentSession = await this.supabaseIntegration.getCurrentCashSession();
      if (this.currentSession) {
        // Carregar transações e pendências da sessão atual
        await this.loadSessionData();
      }
    } catch (error) {
      console.error('Erro ao carregar sessão atual:', error);
    }
  }

  /**
   * Carrega dados da sessão atual (transações e pendências)
   */
  private async loadSessionData(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Carregar transações
      this.transactions = await this.supabaseIntegration.getSessionTransactions(this.currentSession.id);
      
      // Carregar pendências
      this.pendingPayments = await this.supabaseIntegration.getPendingPayments(this.currentSession.id);
      
      // Atualizar dados da sessão
      this.currentSession.transactions = this.transactions;
      this.currentSession.expected_amount = this.calculateExpectedAmount();
    } catch (error) {
      console.error('Erro ao carregar dados da sessão:', error);
    }
  }

  /**
   * Abre uma nova sessão de caixa
   * @param initialAmount Valor inicial do caixa
   * @param operatorId ID do operador responsável
   * @returns Sessão de caixa criada
   */
  async openCash(initialAmount: number, operatorId: string): Promise<CashSession> {
    // Verificar se já existe uma sessão aberta
    const existingSession = await this.supabaseIntegration.getCurrentCashSession();
    if (existingSession) {
      throw new Error('Já existe uma sessão de caixa aberta. Feche a sessão atual antes de abrir uma nova.');
    }

    // Criar nova sessão no banco
    const session = await this.supabaseIntegration.openCashSession(initialAmount, operatorId);
    if (!session) {
      throw new Error('Erro ao criar sessão de caixa no banco de dados');
    }

    this.currentSession = session;
    this.transactions = [];
    this.pendingPayments = [];
    this.cashMovements = [];
    
    // Registrar movimento de abertura
    await this.registerCashMovement({
      type: 'opening',
      amount: initialAmount,
      description: 'Abertura de caixa',
      operator_id: operatorId
    });

    return session;
  }

  /**
   * Fecha a sessão de caixa atual
   * @param actualAmount Valor físico contado no caixa
   * @param operatorId ID do operador responsável
   * @returns Resultado do fechamento
   */
  async closeCash(actualAmount: number, operatorId: string): Promise<CashClosing> {
    if (!this.currentSession || this.currentSession.status !== 'open') {
      throw new Error('Não há sessão de caixa aberta para fechar.');
    }

    // Recarregar dados mais recentes
    await this.loadSessionData();

    const expectedAmount = this.calculateExpectedAmount();
    const discrepancy = actualAmount - expectedAmount;

    // Fechar sessão no banco
    const success = await this.supabaseIntegration.closeCashSession(this.currentSession.id, actualAmount);
    if (!success) {
      throw new Error('Erro ao fechar sessão no banco de dados');
    }

    // Atualizar sessão local
    this.currentSession.status = 'closed';
    this.currentSession.closed_at = new Date().toISOString();
    this.currentSession.actual_amount = actualAmount;
    this.currentSession.expected_amount = expectedAmount;
    this.currentSession.discrepancy = discrepancy;

    // Criar resultado do fechamento
    const closing: CashClosing = {
      id: `CLOSE-${Date.now()}`,
      session_id: this.currentSession.id,
      operator_id: operatorId,
      closed_at: new Date().toISOString(),
      initial_amount: this.currentSession.initial_amount,
      expected_amount: expectedAmount,
      actual_amount: actualAmount,
      discrepancy: discrepancy,
      total_sales: this.calculateTotalSales(),
      total_withdrawals: this.calculateTotalWithdrawals(),
      total_deposits: this.calculateTotalDeposits(),
      payment_summary: this.generatePaymentSummary(),
      requires_justification: Math.abs(discrepancy) > 5.00, // Divergência > R$ 5,00
      justification: discrepancy !== 0 ? 'Divergência detectada no fechamento' : undefined
    };

    // Registrar movimento de fechamento
    await this.registerCashMovement({
      type: 'closing',
      amount: actualAmount,
      description: `Fechamento de caixa - Divergência: R$ ${discrepancy.toFixed(2)}`,
      operator_id: operatorId
    });

    // Limpar sessão atual
    this.currentSession = null;
    this.transactions = [];
    this.pendingPayments = [];
    this.cashMovements = [];

    return closing;
  }

  /**
   * Registra uma transação no caixa
   * @param transaction Dados da transação
   */
  async registerTransaction(transaction: Transaction): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'open') {
      throw new Error('Não há sessão de caixa aberta para registrar transação.');
    }

    // Adicionar timestamp se não existir
    if (!transaction.processed_at) {
      transaction.processed_at = new Date().toISOString();
    }

    // Associar à sessão atual
    transaction.cash_session_id = this.currentSession.id;

    // Adicionar à lista de transações
    this.transactions.push(transaction);
    this.currentSession.transactions.push(transaction);

    // Atualizar valor esperado
    this.currentSession.expected_amount = this.calculateExpectedAmount();
  }

  /**
   * Cria uma pendência de pagamento no caixa
   * @param paymentData Dados do pagamento
   * @returns Pendência criada
   */
  async createPaymentPending(paymentData: PaymentData): Promise<PaymentPending> {
    if (!this.currentSession || this.currentSession.status !== 'open') {
      throw new Error('Não há sessão de caixa aberta para criar pendência.');
    }

    // Criar pendência no banco
    const pendingId = await this.supabaseIntegration.createPaymentPending(
      paymentData.command_id || `CMD-${Date.now()}`,
      paymentData.valor_total,
      paymentData.percentual_comissao,
      paymentData.valor_comissao,
      paymentData.metodo_pagamento,
      this.currentSession.id,
      paymentData.observacoes
    );

    if (!pendingId) {
      throw new Error('Erro ao criar pendência no banco de dados');
    }

    const pending: PaymentPending = {
      id: pendingId,
      command_id: paymentData.command_id || `CMD-${Date.now()}`,
      amount: paymentData.valor_total,
      commission_percentage: paymentData.percentual_comissao,
      commission_amount: paymentData.valor_comissao,
      payment_method: paymentData.metodo_pagamento,
      status: 'pending',
      created_at: new Date().toISOString(),
      observations: paymentData.observacoes,
      cash_session_id: this.currentSession.id
    };

    this.pendingPayments.push(pending);
    return pending;
  }

  /**
   * Processa uma pendência de pagamento
   * @param pendingId ID da pendência
   * @param operatorId ID do operador
   */
  async processPendingPayment(pendingId: string, operatorId: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Não há sessão de caixa aberta.');
    }

    const pending = this.pendingPayments.find(p => p.id === pendingId);
    if (!pending) {
      throw new Error('Pendência de pagamento não encontrada.');
    }

    if (pending.status !== 'pending') {
      throw new Error('Pendência já foi processada.');
    }

    // Criar transação no banco
    const transactionId = await this.supabaseIntegration.createPaymentTransaction(
      this.currentSession.id,
      pending.command_id,
      pending.amount,
      pending.payment_method,
      operatorId,
      pending.observations
    );

    if (!transactionId) {
      throw new Error('Erro ao criar transação no banco de dados');
    }

    // Processar pendência no banco
    const success = await this.supabaseIntegration.processPendingPayment(pendingId, transactionId);
    if (!success) {
      throw new Error('Erro ao processar pendência no banco de dados');
    }

    // Criar transação local
    const transaction: Transaction = {
      id: transactionId,
      type: 'venda',
      amount: pending.amount,
      payment_method: pending.payment_method,
      command_id: pending.command_id,
      cash_session_id: this.currentSession.id,
      processed_at: new Date().toISOString(),
      processed_by: operatorId,
      observations: pending.observations
    };

    // Atualizar dados locais
    this.transactions.push(transaction);
    pending.status = 'paid';
    pending.paid_at = new Date().toISOString();
    pending.transaction_id = transaction.id;

    // Atualizar valor esperado da sessão
    this.currentSession.expected_amount = this.calculateExpectedAmount();
  }

  /**
   * Registra sangria ou suprimento no caixa
   * @param movement Dados do movimento
   */
  async registerCashMovement(movement: Omit<CashMovement, 'id' | 'timestamp'>): Promise<CashMovement> {
    if (!this.currentSession && movement.type !== 'opening') {
      throw new Error('Não há sessão de caixa aberta para registrar movimento.');
    }

    const cashMovement: CashMovement = {
      id: this.generateMovementId(),
      type: movement.type,
      amount: movement.amount,
      description: movement.description,
      operator_id: movement.operator_id,
      timestamp: new Date().toISOString(),
      justification: movement.justification,
      authorized_by: movement.authorized_by
    };

    this.cashMovements.push(cashMovement);
    
    if (this.currentSession) {
      this.currentSession.cash_movements.push(cashMovement);
      
      // Atualizar valor esperado baseado no tipo de movimento
      if (movement.type === 'withdrawal') {
        this.currentSession.expected_amount -= movement.amount;
      } else if (movement.type === 'deposit') {
        this.currentSession.expected_amount += movement.amount;
      }
    }

    return cashMovement;
  }

  /**
   * Calcula o valor esperado no caixa
   */
  calculateExpectedAmount(): number {
    if (!this.currentSession) {
      return 0;
    }

    let expected = this.currentSession.initial_amount;

    // Somar vendas em dinheiro
    const cashSales = this.transactions
      .filter(t => t.type === 'venda' && t.payment_method === 'dinheiro')
      .reduce((sum, t) => sum + t.amount, 0);

    expected += cashSales;

    // Subtrair sangrias
    const withdrawals = this.cashMovements
      .filter(m => m.type === 'withdrawal')
      .reduce((sum, m) => sum + m.amount, 0);

    expected -= withdrawals;

    // Somar suprimentos
    const deposits = this.cashMovements
      .filter(m => m.type === 'deposit')
      .reduce((sum, m) => sum + m.amount, 0);

    expected += deposits;

    return expected;
  }

  /**
   * Obtém a sessão de caixa atual
   */
  getCurrentSession(): CashSession | null {
    return this.currentSession;
  }

  /**
   * Obtém todas as pendências de pagamento
   */
  async getPendingPayments(): Promise<PaymentPending[]> {
    if (!this.currentSession) {
      return [];
    }

    try {
      // Buscar pendências atualizadas do banco
      this.pendingPayments = await this.supabaseIntegration.getPendingPayments(this.currentSession.id);
      return this.pendingPayments.filter(p => p.status === 'pending');
    } catch (error) {
      console.error('Erro ao buscar pendências:', error);
      return this.pendingPayments.filter(p => p.status === 'pending');
    }
  }

  /**
   * Obtém histórico de transações da sessão atual
   */
  getSessionTransactions(): Transaction[] {
    return this.transactions;
  }

  /**
   * Obtém movimentos de caixa da sessão atual
   */
  getCashMovements(): CashMovement[] {
    return this.cashMovements;
  }

  /**
   * Calcula total de vendas da sessão
   */
  private calculateTotalSales(): number {
    return this.transactions
      .filter(t => t.type === 'venda')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calcula total de sangrias da sessão
   */
  private calculateTotalWithdrawals(): number {
    return this.cashMovements
      .filter(m => m.type === 'withdrawal')
      .reduce((sum, m) => sum + m.amount, 0);
  }

  /**
   * Calcula total de suprimentos da sessão
   */
  private calculateTotalDeposits(): number {
    return this.cashMovements
      .filter(m => m.type === 'deposit')
      .reduce((sum, m) => sum + m.amount, 0);
  }

  /**
   * Gera resumo de pagamentos por método
   */
  private generatePaymentSummary(): Record<PaymentMethod, number> {
    const summary: Record<PaymentMethod, number> = {
      dinheiro: 0,
      cartao_debito: 0,
      cartao_credito: 0,
      pix: 0,
      credito_membro: 0,
      transferencia: 0
    };

    this.transactions
      .filter(t => t.type === 'venda')
      .forEach(t => {
        summary[t.payment_method] += t.amount;
      });

    return summary;
  }

  /**
   * Gera ID único para sessão
   */
  private generateSessionId(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    return `CASH-${dateStr}-${timeStr}`;
  }

  /**
   * Gera ID único para pendência
   */
  private generatePendingId(): string {
    return `PEND-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Gera ID único para transação
   */
  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Gera ID único para movimento de caixa
   */
  private generateMovementId(): string {
    return `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Obtém estatísticas da sessão atual
   */
  async getSessionStatistics(): Promise<{
    total_transactions: number;
    total_amount: number;
    payment_methods: Record<PaymentMethod, { count: number; amount: number }>;
    pending_count: number;
    pending_amount: number;
    cash_movements_count: number;
    session_duration: number; // em minutos
  }> {
    if (!this.currentSession) {
      throw new Error('Não há sessão de caixa aberta.');
    }

    const paymentMethods: Record<PaymentMethod, { count: number; amount: number }> = {
      dinheiro: { count: 0, amount: 0 },
      cartao_debito: { count: 0, amount: 0 },
      cartao_credito: { count: 0, amount: 0 },
      pix: { count: 0, amount: 0 },
      credito_membro: { count: 0, amount: 0 },
      transferencia: { count: 0, amount: 0 }
    };

    // Calcular estatísticas por método de pagamento
    this.transactions
      .filter(t => t.type === 'venda')
      .forEach(t => {
        paymentMethods[t.payment_method].count++;
        paymentMethods[t.payment_method].amount += t.amount;
      });

    // Calcular duração da sessão
    const openedAt = new Date(this.currentSession.opened_at);
    const now = new Date();
    const sessionDuration = Math.floor((now.getTime() - openedAt.getTime()) / (1000 * 60));

    // Calcular pendências
    const pendingPayments = this.getPendingPayments();
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      total_transactions: this.transactions.length,
      total_amount: this.calculateTotalSales(),
      payment_methods: paymentMethods,
      pending_count: pendingPayments.length,
      pending_amount: pendingAmount,
      cash_movements_count: this.cashMovements.length,
      session_duration: sessionDuration
    };
  }

  /**
   * Valida se uma sangria pode ser realizada
   */
  validateWithdrawal(amount: number): { valid: boolean; message?: string } {
    if (!this.currentSession || this.currentSession.status !== 'open') {
      return { valid: false, message: 'Não há sessão de caixa aberta.' };
    }

    const expectedAmount = this.calculateExpectedAmount();
    const cashAmount = this.transactions
      .filter(t => t.type === 'venda' && t.payment_method === 'dinheiro')
      .reduce((sum, t) => sum + t.amount, 0) + this.currentSession.initial_amount;

    if (amount > cashAmount) {
      return { 
        valid: false, 
        message: `Valor da sangria (R$ ${amount.toFixed(2)}) é maior que o disponível em dinheiro (R$ ${cashAmount.toFixed(2)}).` 
      };
    }

    if (amount > expectedAmount * 0.8) {
      return { 
        valid: false, 
        message: 'Sangria muito alta. Não é possível retirar mais de 80% do valor em caixa.' 
      };
    }

    return { valid: true };
  }
}