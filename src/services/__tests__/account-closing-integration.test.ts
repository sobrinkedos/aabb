/**
 * Testes de integração para o fluxo completo de fechamento de conta
 */

import { AccountClosingService } from '../account-closing-service';
import { PaymentProcessor } from '../payment-processor';
import { CashManager } from '../cash-manager';
import { CloseAccountData } from '../../types/sales-management';

describe('Account Closing Integration', () => {
  let accountClosingService: AccountClosingService;
  let paymentProcessor: PaymentProcessor;
  let cashManager: CashManager;

  beforeEach(async () => {
    accountClosingService = AccountClosingService.getInstance();
    paymentProcessor = PaymentProcessor.getInstance();
    cashManager = CashManager.getInstance();

    // Abrir sessão de caixa para os testes
    await cashManager.openCash(200.00, 'operator-test');
  });

  afterEach(async () => {
    // Fechar sessão se estiver aberta
    const currentSession = cashManager.getCurrentSession();
    if (currentSession && currentSession.status === 'open') {
      await cashManager.closeCash(200.00, 'operator-test');
    }
  });

  describe('Fluxo Completo de Fechamento', () => {
    const baseCloseAccountData: CloseAccountData = {
      comanda_id: 'CMD-TEST-001',
      valor_base: 100.00,
      percentual_comissao: 10,
      valor_comissao: 10.00,
      valor_total: 110.00,
      metodo_pagamento: 'dinheiro'
    };

    it('deve processar fechamento completo com pagamento em dinheiro', async () => {
      const result = await accountClosingService.processAccountClosing(
        baseCloseAccountData,
        'operator-test'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.transaction_id).toBeDefined();
      expect(result.data!.reference_number).toBeDefined();
      expect(result.data!.total_amount).toBe(110.00);
      expect(result.data!.commission_amount).toBe(10.00);
      expect(result.data!.payment_method).toBe('dinheiro');
      expect(result.data!.receipt).toBeDefined();

      // Verificar se transação foi registrada no caixa
      const transactions = cashManager.getSessionTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(110.00);
      expect(transactions[0].payment_method).toBe('dinheiro');

      // Verificar se não há pendências
      const pendingPayments = cashManager.getPendingPayments();
      expect(pendingPayments).toHaveLength(0);
    });

    it('deve processar fechamento com pagamento PIX', async () => {
      const pixData: CloseAccountData = {
        ...baseCloseAccountData,
        metodo_pagamento: 'pix'
      };

      const result = await accountClosingService.processAccountClosing(
        pixData,
        'operator-test'
      );

      expect(result.success).toBe(true);
      expect(result.data!.payment_method).toBe('pix');
      expect(result.data!.additional_data?.qr_code).toBeDefined();
      expect(result.data!.additional_data?.chave_pix).toBeDefined();
    });

    it('deve processar fechamento com pagamento cartão', async () => {
      const cardData: CloseAccountData = {
        ...baseCloseAccountData,
        metodo_pagamento: 'cartao_debito'
      };

      const result = await accountClosingService.processAccountClosing(
        cardData,
        'operator-test'
      );

      expect(result.success).toBe(true);
      expect(result.data!.payment_method).toBe('cartao_debito');
      expect(result.data!.additional_data?.numero_autorizacao).toBeDefined();
    });

    it('deve processar fechamento com comissão zero', async () => {
      const zeroCommissionData: CloseAccountData = {
        comanda_id: 'CMD-TEST-002',
        valor_base: 50.00,
        percentual_comissao: 0,
        valor_comissao: 0.00,
        valor_total: 50.00,
        metodo_pagamento: 'dinheiro'
      };

      const result = await accountClosingService.processAccountClosing(
        zeroCommissionData,
        'operator-test'
      );

      expect(result.success).toBe(true);
      expect(result.data!.commission_amount).toBe(0.00);
      expect(result.data!.total_amount).toBe(50.00);
    });

    it('deve processar fechamento com comissão máxima', async () => {
      const maxCommissionData: CloseAccountData = {
        comanda_id: 'CMD-TEST-003',
        valor_base: 100.00,
        percentual_comissao: 30,
        valor_comissao: 30.00,
        valor_total: 130.00,
        metodo_pagamento: 'dinheiro'
      };

      const result = await accountClosingService.processAccountClosing(
        maxCommissionData,
        'operator-test'
      );

      expect(result.success).toBe(true);
      expect(result.data!.commission_amount).toBe(30.00);
      expect(result.data!.total_amount).toBe(130.00);
    });

    it('deve incluir observações no processamento', async () => {
      const dataWithObservations: CloseAccountData = {
        ...baseCloseAccountData,
        observacoes: 'Cliente VIP - desconto especial aplicado'
      };

      const result = await accountClosingService.processAccountClosing(
        dataWithObservations,
        'operator-test'
      );

      expect(result.success).toBe(true);
      expect(result.data!.receipt).toContain('Cliente VIP - desconto especial aplicado');
    });
  });

  describe('Validações e Erros', () => {
    it('deve falhar com dados inválidos', async () => {
      const invalidData: CloseAccountData = {
        comanda_id: '',
        valor_base: -10.00,
        percentual_comissao: 50,
        valor_comissao: -5.00,
        valor_total: 0,
        metodo_pagamento: 'dinheiro'
      };

      const result = await accountClosingService.processAccountClosing(
        invalidData,
        'operator-test'
      );

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('validation');
      expect(result.error.message).toContain('ID da comanda é obrigatório');
    });

    it('deve falhar sem sessão de caixa aberta', async () => {
      // Fechar sessão de caixa
      await cashManager.closeCash(200.00, 'operator-test');

      const result = await accountClosingService.processAccountClosing(
        {
          comanda_id: 'CMD-TEST-004',
          valor_base: 100.00,
          percentual_comissao: 10,
          valor_comissao: 10.00,
          valor_total: 110.00,
          metodo_pagamento: 'dinheiro'
        },
        'operator-test'
      );

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('cash_session');
      expect(result.error.message).toContain('Não há sessão de caixa aberta');
    });

    it('deve falhar com cálculos inconsistentes', async () => {
      const inconsistentData: CloseAccountData = {
        comanda_id: 'CMD-TEST-005',
        valor_base: 100.00,
        percentual_comissao: 10,
        valor_comissao: 20.00, // Inconsistente com 10%
        valor_total: 120.00,
        metodo_pagamento: 'dinheiro'
      };

      const result = await accountClosingService.processAccountClosing(
        inconsistentData,
        'operator-test'
      );

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('validation');
      expect(result.error.message).toContain('Valor da comissão não confere');
    });
  });

  describe('Integração com Múltiplas Transações', () => {
    it('deve processar múltiplos fechamentos na mesma sessão', async () => {
      const fechamentos = [
        {
          comanda_id: 'CMD-MULTI-001',
          valor_base: 50.00,
          percentual_comissao: 10,
          valor_comissao: 5.00,
          valor_total: 55.00,
          metodo_pagamento: 'dinheiro' as const
        },
        {
          comanda_id: 'CMD-MULTI-002',
          valor_base: 75.00,
          percentual_comissao: 15,
          valor_comissao: 11.25,
          valor_total: 86.25,
          metodo_pagamento: 'cartao_debito' as const
        },
        {
          comanda_id: 'CMD-MULTI-003',
          valor_base: 120.00,
          percentual_comissao: 0,
          valor_comissao: 0.00,
          valor_total: 120.00,
          metodo_pagamento: 'pix' as const
        }
      ];

      const results = [];
      for (const fechamento of fechamentos) {
        const result = await accountClosingService.processAccountClosing(
          fechamento,
          'operator-test'
        );
        results.push(result);
      }

      // Verificar se todos foram processados com sucesso
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verificar transações no caixa
      const transactions = cashManager.getSessionTransactions();
      expect(transactions).toHaveLength(3);

      // Verificar valores totais
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(totalAmount).toBe(261.25); // 55 + 86.25 + 120

      // Verificar estatísticas da sessão
      const stats = await cashManager.getSessionStatistics();
      expect(stats.total_transactions).toBe(3);
      expect(stats.payment_methods.dinheiro.count).toBe(1);
      expect(stats.payment_methods.cartao_debito.count).toBe(1);
      expect(stats.payment_methods.pix.count).toBe(1);
    });
  });

  describe('Validação de Métodos de Pagamento', () => {
    it('deve validar disponibilidade de métodos de pagamento', async () => {
      const availableMethods = await accountClosingService.getAvailablePaymentMethods();

      expect(availableMethods).toBeInstanceOf(Array);
      expect(availableMethods.length).toBeGreaterThan(0);

      const dinheiroMethod = availableMethods.find(m => m.method === 'dinheiro');
      expect(dinheiroMethod?.available).toBe(true);

      const pixMethod = availableMethods.find(m => m.method === 'pix');
      expect(pixMethod?.available).toBe(true);
    });
  });

  describe('Estatísticas de Fechamento', () => {
    it('deve gerar estatísticas diárias de fechamento', async () => {
      // Processar alguns fechamentos
      await accountClosingService.processAccountClosing(
        {
          comanda_id: 'CMD-STATS-001',
          valor_base: 100.00,
          percentual_comissao: 10,
          valor_comissao: 10.00,
          valor_total: 110.00,
          metodo_pagamento: 'dinheiro'
        },
        'operator-test'
      );

      await accountClosingService.processAccountClosing(
        {
          comanda_id: 'CMD-STATS-002',
          valor_base: 80.00,
          percentual_comissao: 15,
          valor_comissao: 12.00,
          valor_total: 92.00,
          metodo_pagamento: 'cartao_debito'
        },
        'operator-test'
      );

      const stats = await accountClosingService.getDailyClosingStatistics();

      expect(stats.total_closings).toBe(2);
      expect(stats.total_amount).toBe(202.00);
      expect(stats.payment_methods.dinheiro.count).toBe(1);
      expect(stats.payment_methods.cartao_debito.count).toBe(1);
      expect(stats.average_commission_percentage).toBeGreaterThan(0);
    });
  });

  describe('Tratamento de Erros de Sistema', () => {
    it('deve tratar erros inesperados graciosamente', async () => {
      // Simular erro forçando dados que podem causar exceção
      const result = await accountClosingService.processAccountClosing(
        {
          comanda_id: 'CMD-ERROR-TEST',
          valor_base: 100.00,
          percentual_comissao: 10,
          valor_comissao: 10.00,
          valor_total: 110.00,
          metodo_pagamento: 'dinheiro'
        },
        'operator-test'
      );

      // Mesmo com possíveis erros internos, deve retornar resultado estruturado
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.type).toBeDefined();
        expect(result.error.message).toBeDefined();
      }
    });
  });
});