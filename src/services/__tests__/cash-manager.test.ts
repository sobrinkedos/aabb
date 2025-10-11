/**
 * Testes unitários para CashManager
 */

import { CashManager } from '../cash-manager';
import { PaymentData, Transaction } from '../../types/sales-management';

describe('CashManager', () => {
  let cashManager: CashManager;

  beforeEach(() => {
    cashManager = CashManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const manager1 = CashManager.getInstance();
      const manager2 = CashManager.getInstance();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('openCash', () => {
    it('deve abrir uma nova sessão de caixa', async () => {
      const session = await cashManager.openCash(100.00, 'operator-001');

      expect(session.id).toBeDefined();
      expect(session.operator_id).toBe('operator-001');
      expect(session.initial_amount).toBe(100.00);
      expect(session.status).toBe('open');
      expect(session.opened_at).toBeDefined();
      expect(session.expected_amount).toBe(100.00);
    });

    it('deve falhar ao tentar abrir caixa com sessão já aberta', async () => {
      await cashManager.openCash(100.00, 'operator-001');

      await expect(
        cashManager.openCash(150.00, 'operator-002')
      ).rejects.toThrow('Já existe uma sessão de caixa aberta');
    });

    it('deve registrar movimento de abertura', async () => {
      await cashManager.openCash(100.00, 'operator-001');
      const movements = cashManager.getCashMovements();

      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('opening');
      expect(movements[0].amount).toBe(100.00);
      expect(movements[0].description).toBe('Abertura de caixa');
    });
  });

  describe('closeCash', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve fechar sessão de caixa sem divergência', async () => {
      const closing = await cashManager.closeCash(100.00, 'operator-001');

      expect(closing.id).toBeDefined();
      expect(closing.initial_amount).toBe(100.00);
      expect(closing.expected_amount).toBe(100.00);
      expect(closing.actual_amount).toBe(100.00);
      expect(closing.discrepancy).toBe(0);
      expect(closing.requires_justification).toBe(false);
    });

    it('deve fechar sessão com divergência positiva', async () => {
      const closing = await cashManager.closeCash(110.00, 'operator-001');

      expect(closing.discrepancy).toBe(10.00);
      expect(closing.requires_justification).toBe(true);
    });

    it('deve fechar sessão com divergência negativa', async () => {
      const closing = await cashManager.closeCash(90.00, 'operator-001');

      expect(closing.discrepancy).toBe(-10.00);
      expect(closing.requires_justification).toBe(true);
    });

    it('deve falhar ao tentar fechar caixa sem sessão aberta', async () => {
      await cashManager.closeCash(100.00, 'operator-001');

      await expect(
        cashManager.closeCash(100.00, 'operator-001')
      ).rejects.toThrow('Não há sessão de caixa aberta para fechar');
    });
  });

  describe('registerTransaction', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve registrar transação de venda em dinheiro', async () => {
      const transaction: Transaction = {
        id: 'TXN-001',
        type: 'sale',
        amount: 50.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      };

      await cashManager.registerTransaction(transaction);

      const transactions = cashManager.getSessionTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(50.00);
      expect(transactions[0].payment_method).toBe('dinheiro');
    });

    it('deve atualizar valor esperado após venda em dinheiro', async () => {
      const transaction: Transaction = {
        id: 'TXN-001',
        type: 'sale',
        amount: 50.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      };

      await cashManager.registerTransaction(transaction);

      const expectedAmount = cashManager.calculateExpectedAmount();
      expect(expectedAmount).toBe(150.00); // 100 inicial + 50 venda
    });

    it('não deve alterar valor esperado para venda com cartão', async () => {
      const transaction: Transaction = {
        id: 'TXN-001',
        type: 'sale',
        amount: 50.00,
        payment_method: 'cartao_debito',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      };

      await cashManager.registerTransaction(transaction);

      const expectedAmount = cashManager.calculateExpectedAmount();
      expect(expectedAmount).toBe(100.00); // Apenas valor inicial
    });

    it('deve falhar sem sessão aberta', async () => {
      await cashManager.closeCash(100.00, 'operator-001');

      const transaction: Transaction = {
        id: 'TXN-001',
        type: 'sale',
        amount: 50.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      };

      await expect(
        cashManager.registerTransaction(transaction)
      ).rejects.toThrow('Não há sessão de caixa aberta');
    });
  });

  describe('createPaymentPending', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve criar pendência de pagamento', async () => {
      const paymentData: PaymentData = {
        valor_total: 75.50,
        percentual_comissao: 10,
        valor_comissao: 7.55,
        metodo_pagamento: 'dinheiro',
        command_id: 'CMD-001'
      };

      const pending = await cashManager.createPaymentPending(paymentData);

      expect(pending.id).toBeDefined();
      expect(pending.command_id).toBe('CMD-001');
      expect(pending.amount).toBe(75.50);
      expect(pending.commission_percentage).toBe(10);
      expect(pending.commission_amount).toBe(7.55);
      expect(pending.payment_method).toBe('dinheiro');
      expect(pending.status).toBe('pending');
    });

    it('deve gerar command_id se não fornecido', async () => {
      const paymentData: PaymentData = {
        valor_total: 75.50,
        percentual_comissao: 10,
        valor_comissao: 7.55,
        metodo_pagamento: 'dinheiro'
      };

      const pending = await cashManager.createPaymentPending(paymentData);

      expect(pending.command_id).toMatch(/^CMD-/);
    });
  });

  describe('processPendingPayment', () => {
    let pendingId: string;

    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
      
      const paymentData: PaymentData = {
        valor_total: 50.00,
        percentual_comissao: 10,
        valor_comissao: 5.00,
        metodo_pagamento: 'dinheiro'
      };

      const pending = await cashManager.createPaymentPending(paymentData);
      pendingId = pending.id;
    });

    it('deve processar pendência com sucesso', async () => {
      await cashManager.processPendingPayment(pendingId, 'operator-001');

      const pendingPayments = cashManager.getPendingPayments();
      expect(pendingPayments).toHaveLength(0);

      const transactions = cashManager.getSessionTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(50.00);
    });

    it('deve falhar com pendência inexistente', async () => {
      await expect(
        cashManager.processPendingPayment('INVALID-ID', 'operator-001')
      ).rejects.toThrow('Pendência de pagamento não encontrada');
    });

    it('deve falhar com pendência já processada', async () => {
      await cashManager.processPendingPayment(pendingId, 'operator-001');

      await expect(
        cashManager.processPendingPayment(pendingId, 'operator-001')
      ).rejects.toThrow('Pendência já foi processada');
    });
  });

  describe('registerCashMovement', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve registrar sangria', async () => {
      const movement = await cashManager.registerCashMovement({
        type: 'withdrawal',
        amount: 50.00,
        description: 'Sangria para troco',
        operator_id: 'operator-001',
        justification: 'Necessário para operação'
      });

      expect(movement.id).toBeDefined();
      expect(movement.type).toBe('withdrawal');
      expect(movement.amount).toBe(50.00);

      const expectedAmount = cashManager.calculateExpectedAmount();
      expect(expectedAmount).toBe(50.00); // 100 - 50
    });

    it('deve registrar suprimento', async () => {
      const movement = await cashManager.registerCashMovement({
        type: 'deposit',
        amount: 200.00,
        description: 'Suprimento de caixa',
        operator_id: 'operator-001'
      });

      expect(movement.type).toBe('deposit');
      expect(movement.amount).toBe(200.00);

      const expectedAmount = cashManager.calculateExpectedAmount();
      expect(expectedAmount).toBe(300.00); // 100 + 200
    });
  });

  describe('calculateExpectedAmount', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve calcular valor esperado com múltiplas operações', async () => {
      // Venda em dinheiro
      await cashManager.registerTransaction({
        id: 'TXN-001',
        type: 'sale',
        amount: 50.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      });

      // Sangria
      await cashManager.registerCashMovement({
        type: 'withdrawal',
        amount: 30.00,
        description: 'Sangria',
        operator_id: 'operator-001'
      });

      // Suprimento
      await cashManager.registerCashMovement({
        type: 'deposit',
        amount: 20.00,
        description: 'Suprimento',
        operator_id: 'operator-001'
      });

      const expectedAmount = cashManager.calculateExpectedAmount();
      expect(expectedAmount).toBe(140.00); // 100 + 50 - 30 + 20
    });
  });

  describe('validateWithdrawal', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve validar sangria normal', async () => {
      // Adicionar venda em dinheiro
      await cashManager.registerTransaction({
        id: 'TXN-001',
        type: 'sale',
        amount: 100.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      });

      const validation = cashManager.validateWithdrawal(50.00);
      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar sangria maior que disponível', async () => {
      const validation = cashManager.validateWithdrawal(150.00);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('maior que o disponível');
    });

    it('deve rejeitar sangria muito alta (>80%)', async () => {
      // Adicionar venda em dinheiro
      await cashManager.registerTransaction({
        id: 'TXN-001',
        type: 'sale',
        amount: 100.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      });

      const validation = cashManager.validateWithdrawal(170.00); // >80% de 200
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('80%');
    });
  });

  describe('getSessionStatistics', () => {
    beforeEach(async () => {
      await cashManager.openCash(100.00, 'operator-001');
    });

    it('deve retornar estatísticas da sessão', async () => {
      // Adicionar algumas transações
      await cashManager.registerTransaction({
        id: 'TXN-001',
        type: 'sale',
        amount: 50.00,
        payment_method: 'dinheiro',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      });

      await cashManager.registerTransaction({
        id: 'TXN-002',
        type: 'sale',
        amount: 75.00,
        payment_method: 'cartao_debito',
        cash_session_id: '',
        processed_at: '',
        processed_by: 'operator-001'
      });

      // Criar pendência
      await cashManager.createPaymentPending({
        valor_total: 30.00,
        percentual_comissao: 10,
        valor_comissao: 3.00,
        metodo_pagamento: 'pix'
      });

      const stats = await cashManager.getSessionStatistics();

      expect(stats.total_transactions).toBe(2);
      expect(stats.total_amount).toBe(125.00);
      expect(stats.payment_methods.dinheiro.count).toBe(1);
      expect(stats.payment_methods.dinheiro.amount).toBe(50.00);
      expect(stats.payment_methods.cartao_debito.count).toBe(1);
      expect(stats.payment_methods.cartao_debito.amount).toBe(75.00);
      expect(stats.pending_count).toBe(1);
      expect(stats.pending_amount).toBe(30.00);
      expect(stats.session_duration).toBeGreaterThanOrEqual(0);
    });

    it('deve falhar sem sessão aberta', async () => {
      await cashManager.closeCash(100.00, 'operator-001');

      await expect(
        cashManager.getSessionStatistics()
      ).rejects.toThrow('Não há sessão de caixa aberta');
    });
  });

  describe('Integração Completa', () => {
    it('deve processar fluxo completo de caixa', async () => {
      // Abrir caixa
      const session = await cashManager.openCash(200.00, 'operator-001');
      expect(session.status).toBe('open');

      // Registrar vendas
      await cashManager.registerTransaction({
        id: 'TXN-001',
        type: 'sale',
        amount: 100.00,
        payment_method: 'dinheiro',
        cash_session_id: session.id,
        processed_at: new Date().toISOString(),
        processed_by: 'operator-001'
      });

      await cashManager.registerTransaction({
        id: 'TXN-002',
        type: 'sale',
        amount: 50.00,
        payment_method: 'cartao_debito',
        cash_session_id: session.id,
        processed_at: new Date().toISOString(),
        processed_by: 'operator-001'
      });

      // Fazer sangria
      await cashManager.registerCashMovement({
        type: 'withdrawal',
        amount: 50.00,
        description: 'Sangria para banco',
        operator_id: 'operator-001',
        justification: 'Depósito bancário'
      });

      // Verificar valor esperado
      const expectedAmount = cashManager.calculateExpectedAmount();
      expect(expectedAmount).toBe(250.00); // 200 + 100 - 50

      // Fechar caixa
      const closing = await cashManager.closeCash(250.00, 'operator-001');
      expect(closing.discrepancy).toBe(0);
      expect(closing.total_sales).toBe(150.00);
      expect(closing.total_withdrawals).toBe(50.00);
      expect(closing.requires_justification).toBe(false);
    });
  });
});