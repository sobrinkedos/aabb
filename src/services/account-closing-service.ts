/**
 * Serviço de Fechamento de Conta
 * 
 * Integra o CloseAccountModal com PaymentProcessor e CashManager
 * para processar o fluxo completo de fechamento de conta
 */

import { PaymentProcessor } from './payment-processor';
import { CashManager } from './cash-manager';
import { CommandManager } from './command-manager';
import { 
  CloseAccountData, 
  PaymentData, 
  AccountClosingResult
} from '../types/sales-management';

export class AccountClosingService {
  private static instance: AccountClosingService;
  private paymentProcessor: PaymentProcessor;
  private cashManager: CashManager;
  private commandManager: CommandManager;

  private constructor() {
    this.paymentProcessor = PaymentProcessor.getInstance();
    this.cashManager = CashManager.getInstance();
    this.commandManager = CommandManager.getInstance();
  }

  static getInstance(): AccountClosingService {
    if (!AccountClosingService.instance) {
      AccountClosingService.instance = new AccountClosingService();
    }
    return AccountClosingService.instance;
  }

  /**
   * Processa o fechamento completo de uma conta
   * @param closeAccountData Dados do fechamento da conta
   * @param operatorId ID do operador responsável
   * @returns Resultado do processamento
   */
  async processAccountClosing(
    closeAccountData: CloseAccountData, 
    operatorId: string
  ): Promise<AccountClosingResult> {
    try {
      // 1. Validar dados de entrada
      const validation = this.validateCloseAccountData(closeAccountData);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: validation.message || 'Dados inválidos',
            details: validation.details
          }
        };
      }

      // 2. Verificar se há sessão de caixa aberta
      const currentSession = this.cashManager.getCurrentSession();
      if (!currentSession || currentSession.status !== 'open') {
        return {
          success: false,
          error: {
            type: 'cash_session',
            message: 'Não há sessão de caixa aberta. Abra o caixa antes de processar vendas.',
            details: { session_status: currentSession?.status || 'none' }
          }
        };
      }

      // 3. Preparar dados do pagamento
      const paymentData: PaymentData = {
        valor_total: closeAccountData.valor_total,
        percentual_comissao: closeAccountData.percentual_comissao,
        valor_comissao: closeAccountData.valor_comissao,
        metodo_pagamento: closeAccountData.metodo_pagamento,
        command_id: closeAccountData.comanda_id,
        observacoes: closeAccountData.observacoes
      };

      // 4. Marcar comanda como pendente de pagamento (usando sistema do bar)
      // Nota: Esta funcionalidade será implementada diretamente no sistema de bar

      // 5. Criar pendência de pagamento no caixa
      const paymentPending = await this.cashManager.createPaymentPending(paymentData);

      // 6. Processar pagamento (simulado - será processado pelo operador do caixa)
      const paymentResult = await this.paymentProcessor.processPayment(paymentData);

      // Nota: O pagamento será processado posteriormente pelo operador do caixa
      // Por enquanto, apenas criamos a pendência

      // 7. Gerar resultado de sucesso
      const result: AccountClosingResult = {
        success: true,
        data: {
          transaction_id: `PENDING-${paymentPending.id}`,
          reference_number: paymentPending.id,
          pending_id: paymentPending.id,
          total_amount: closeAccountData.valor_total,
          commission_amount: closeAccountData.valor_comissao,
          payment_method: closeAccountData.metodo_pagamento,
          receipt: undefined, // Será gerado quando processado no caixa
          processed_at: new Date().toISOString(),
          additional_data: {
            status: 'pending_payment',
            message: 'Comanda enviada para processamento no caixa'
          }
        }
      };

      return result;

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'system',
          message: error instanceof Error ? error.message : 'Erro interno do sistema',
          details: { error: error instanceof Error ? error.stack : String(error) }
        }
      };
    }
  }

  /**
   * Valida os dados de fechamento de conta
   */
  private validateCloseAccountData(data: CloseAccountData): {
    valid: boolean;
    message?: string;
    details?: Record<string, any>;
  } {
    const errors: string[] = [];
    const details: Record<string, any> = {};

    // Validar comanda_id
    if (!data.comanda_id || data.comanda_id.trim() === '') {
      errors.push('ID da comanda é obrigatório');
      details.comanda_id = 'missing';
    }

    // Validar valores
    if (data.valor_base <= 0) {
      errors.push('Valor base deve ser maior que zero');
      details.valor_base = data.valor_base;
    }

    if (data.valor_total <= 0) {
      errors.push('Valor total deve ser maior que zero');
      details.valor_total = data.valor_total;
    }

    if (data.valor_comissao < 0) {
      errors.push('Valor da comissão não pode ser negativo');
      details.valor_comissao = data.valor_comissao;
    }

    // Validar percentual de comissão
    if (data.percentual_comissao < 0 || data.percentual_comissao > 30) {
      errors.push('Percentual de comissão deve estar entre 0% e 30%');
      details.percentual_comissao = data.percentual_comissao;
    }

    // Validar consistência dos cálculos
    const expectedCommission = (data.valor_base * data.percentual_comissao) / 100;
    const expectedTotal = data.valor_base + expectedCommission;
    
    if (Math.abs(data.valor_comissao - expectedCommission) > 0.01) {
      errors.push('Valor da comissão não confere com o percentual aplicado');
      details.commission_calculation = {
        expected: expectedCommission,
        received: data.valor_comissao
      };
    }

    if (Math.abs(data.valor_total - expectedTotal) > 0.01) {
      errors.push('Valor total não confere com a soma base + comissão');
      details.total_calculation = {
        expected: expectedTotal,
        received: data.valor_total
      };
    }

    // Validar método de pagamento
    const validPaymentMethods = [
      'dinheiro', 'cartao_debito', 'cartao_credito', 
      'pix', 'credito_membro', 'transferencia'
    ];
    
    if (!validPaymentMethods.includes(data.metodo_pagamento)) {
      errors.push('Método de pagamento inválido');
      details.metodo_pagamento = data.metodo_pagamento;
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join('; ') : undefined,
      details: Object.keys(details).length > 0 ? details : undefined
    };
  }

  /**
   * Cancela uma pendência de pagamento
   */
  private async cancelPaymentPending(pendingId: string): Promise<void> {
    try {
      // Implementar lógica de cancelamento de pendência
      // Por enquanto, apenas log do cancelamento
      console.warn(`Pendência ${pendingId} cancelada devido a falha no pagamento`);
    } catch (error) {
      console.error('Erro ao cancelar pendência:', error);
    }
  }

  /**
   * Obtém informações sobre métodos de pagamento disponíveis
   */
  async getAvailablePaymentMethods(): Promise<{
    method: string;
    available: boolean;
    message?: string;
  }[]> {
    // Simular verificação de disponibilidade dos métodos
    return [
      { method: 'dinheiro', available: true },
      { method: 'cartao_debito', available: true },
      { method: 'cartao_credito', available: true },
      { method: 'pix', available: true },
      { method: 'credito_membro', available: true },
      { method: 'transferencia', available: false, message: 'Sistema temporariamente indisponível' }
    ];
  }

  /**
   * Obtém estatísticas de fechamentos do dia
   */
  async getDailyClosingStatistics(): Promise<{
    total_closings: number;
    total_amount: number;
    total_commission: number;
    payment_methods: Record<string, { count: number; amount: number }>;
    average_commission_percentage: number;
  }> {
    try {
      const sessionStats = await this.cashManager.getSessionStatistics();
      
      // Calcular estatísticas baseadas na sessão atual
      const totalAmount = sessionStats.total_amount;
      const totalTransactions = sessionStats.total_transactions;
      
      // Simular cálculo de comissão média (seria calculado baseado nos dados reais)
      const averageCommissionPercentage = 10; // Valor padrão simulado
      const totalCommission = totalAmount * (averageCommissionPercentage / 100);

      const paymentMethodsStats: Record<string, { count: number; amount: number }> = {};
      
      Object.entries(sessionStats.payment_methods).forEach(([method, data]) => {
        paymentMethodsStats[method] = {
          count: data.count,
          amount: data.amount
        };
      });

      return {
        total_closings: totalTransactions,
        total_amount: totalAmount,
        total_commission: totalCommission,
        payment_methods: paymentMethodsStats,
        average_commission_percentage: averageCommissionPercentage
      };
    } catch (error) {
      // Retornar estatísticas vazias em caso de erro
      return {
        total_closings: 0,
        total_amount: 0,
        total_commission: 0,
        payment_methods: {},
        average_commission_percentage: 0
      };
    }
  }

  /**
   * Valida se um fechamento pode ser processado
   */
  async validateAccountClosing(closeAccountData: CloseAccountData): Promise<{
    can_process: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validar dados básicos
    const validation = this.validateCloseAccountData(closeAccountData);
    if (!validation.valid) {
      errors.push(validation.message || 'Dados inválidos');
    }

    // Verificar sessão de caixa
    const currentSession = this.cashManager.getCurrentSession();
    if (!currentSession || currentSession.status !== 'open') {
      errors.push('Não há sessão de caixa aberta');
    }

    // Verificar valores altos
    if (closeAccountData.valor_total > 1000) {
      warnings.push('Valor alto - confirme com supervisor');
    }

    // Verificar comissão alta
    if (closeAccountData.percentual_comissao > 20) {
      warnings.push('Percentual de comissão alto - confirme autorização');
    }

    // Verificar método de pagamento específico
    if (closeAccountData.metodo_pagamento === 'credito_membro') {
      // Aqui seria validado o crédito do membro
      warnings.push('Verificar saldo do membro antes de confirmar');
    }

    return {
      can_process: errors.length === 0,
      warnings,
      errors
    };
  }
}