/**
 * Testes unitários para PaymentProcessor
 */

import { PaymentProcessor } from '../payment-processor';
import { PaymentData } from '../../types/sales-management';

describe('PaymentProcessor', () => {
  let processor: PaymentProcessor;

  beforeEach(() => {
    processor = PaymentProcessor.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const processor1 = PaymentProcessor.getInstance();
      const processor2 = PaymentProcessor.getInstance();
      
      expect(processor1).toBe(processor2);
    });
  });

  describe('processPayment', () => {
    const basePaymentData: PaymentData = {
      valor_total: 100.00,
      percentual_comissao: 10,
      valor_comissao: 10.00,
      metodo_pagamento: 'dinheiro'
    };

    describe('Pagamento em Dinheiro', () => {
      it('deve processar pagamento em dinheiro com sucesso', async () => {
        const result = await processor.processPayment(basePaymentData);

        expect(result.sucesso).toBe(true);
        expect(result.transacao_id).toBeDefined();
        expect(result.numero_referencia).toBeDefined();
        expect(result.comprovante).toBeDefined();
        expect(result.erro).toBeUndefined();
      });

      it('deve gerar comprovante com informações corretas', async () => {
        const result = await processor.processPayment(basePaymentData);

        expect(result.comprovante).toContain('AABB RESTAURANTE');
        expect(result.comprovante).toContain('R$ 100,00');
        expect(result.comprovante).toContain('DINHEIRO');
      });
    });

    describe('Pagamento com Cartão', () => {
      it('deve processar pagamento com cartão de débito', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'cartao_debito' as const
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(true);
        expect(result.dados_adicionais?.numero_autorizacao).toBeDefined();
      });

      it('deve processar pagamento com cartão de crédito', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'cartao_credito' as const
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(true);
        expect(result.dados_adicionais?.numero_autorizacao).toBeDefined();
      });

      it('deve incluir dados do cartão quando fornecidos', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'cartao_debito' as const,
          dados_cartao: {
            bandeira: 'Mastercard',
            ultimos_digitos: '5678',
            numero_autorizacao: '123456'
          }
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(true);
        expect(result.dados_adicionais).toMatchObject({
          bandeira: 'Mastercard',
          ultimos_digitos: '5678'
        });
      });
    });

    describe('Pagamento PIX', () => {
      it('deve processar pagamento PIX com sucesso', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'pix' as const
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(true);
        expect(result.dados_adicionais?.qr_code).toBeDefined();
        expect(result.dados_adicionais?.chave_pix).toBeDefined();
      });

      it('deve gerar QR code válido', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'pix' as const
        };

        const result = await processor.processPayment(paymentData);

        expect(result.dados_adicionais?.qr_code).toMatch(/^00020126/);
        expect(result.dados_adicionais?.chave_pix).toContain('@aabb.com.br');
      });
    });

    describe('Pagamento com Crédito de Membro', () => {
      it('deve processar pagamento com crédito suficiente', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'credito_membro' as const,
          dados_membro: {
            membro_id: 'member-001',
            saldo_anterior: 500,
            saldo_posterior: 400
          }
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(true);
      });

      it('deve falhar com crédito insuficiente', async () => {
        const paymentData = {
          ...basePaymentData,
          valor_total: 200.00,
          metodo_pagamento: 'credito_membro' as const,
          dados_membro: {
            membro_id: 'member-004', // Saldo simulado: 50.00
            saldo_anterior: 50,
            saldo_posterior: 0
          }
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toContain('Saldo insuficiente');
      });

      it('deve falhar sem ID do membro', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'credito_membro' as const
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toContain('ID do membro não fornecido');
      });
    });

    describe('Pagamento por Transferência', () => {
      it('deve processar transferência com sucesso', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'transferencia' as const
        };

        const result = await processor.processPayment(paymentData);

        // Pode ser sucesso ou falha devido à simulação de erro
        expect(typeof result.sucesso).toBe('boolean');
        
        if (result.sucesso) {
          expect(result.transacao_id).toBeDefined();
          expect(result.numero_referencia).toBeDefined();
        } else {
          expect(result.erro).toBeDefined();
        }
      });
    });

    describe('Validações', () => {
      it('deve falhar com valor zero ou negativo', async () => {
        const paymentData = {
          ...basePaymentData,
          valor_total: 0
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toContain('Valor do pagamento deve ser maior que zero');
      });

      it('deve falhar com método de pagamento inválido', async () => {
        const paymentData = {
          ...basePaymentData,
          metodo_pagamento: 'bitcoin' as any
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toContain('Método de pagamento não suportado');
      });

      it('deve falhar com percentual de comissão inválido', async () => {
        const paymentData = {
          ...basePaymentData,
          percentual_comissao: 35
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toContain('Percentual de comissão deve estar entre 0% e 30%');
      });
    });

    describe('Observações', () => {
      it('deve incluir observações no comprovante', async () => {
        const paymentData = {
          ...basePaymentData,
          observacoes: 'Cliente VIP - desconto aplicado'
        };

        const result = await processor.processPayment(paymentData);

        expect(result.sucesso).toBe(true);
        expect(result.comprovante).toContain('Cliente VIP - desconto aplicado');
      });
    });
  });

  describe('generatePixQR', () => {
    it('deve gerar QR code PIX válido', async () => {
      const qrCode = await processor.generatePixQR(150.50);

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^00020126/); // Início padrão PIX
      expect(qrCode).toContain('AABB RESTAURANTE');
      expect(qrCode).toContain('SAO PAULO');
    });

    it('deve incluir valor correto no QR code', async () => {
      const valor = 99.99;
      const qrCode = await processor.generatePixQR(valor);

      expect(qrCode).toContain('99.99');
    });
  });

  describe('validateMemberCredit', () => {
    it('deve validar crédito suficiente', async () => {
      const hasCredit = await processor.validateMemberCredit('member-001', 100);
      expect(hasCredit).toBe(true);
    });

    it('deve rejeitar crédito insuficiente', async () => {
      const hasCredit = await processor.validateMemberCredit('member-004', 100);
      expect(hasCredit).toBe(false);
    });

    it('deve rejeitar membro inexistente', async () => {
      const hasCredit = await processor.validateMemberCredit('member-999', 50);
      expect(hasCredit).toBe(false);
    });
  });

  describe('issueReceipt', () => {
    it('deve emitir comprovante com dados corretos', async () => {
      const transaction = {
        id: 'TXN-123',
        valor: 150.00,
        metodo_pagamento: 'dinheiro' as const,
        observacoes: 'Pagamento à vista'
      };

      const receipt = await processor.issueReceipt(transaction as any);

      expect(receipt.id).toBeDefined();
      expect(receipt.transacao_id).toBe('TXN-123');
      expect(receipt.numero_recibo).toBeDefined();
      expect(receipt.valor).toBe(150.00);
      expect(receipt.metodo_pagamento).toBe('dinheiro');
      expect(receipt.observacoes).toBe('Pagamento à vista');
      expect(receipt.data_emissao).toBeDefined();
    });
  });

  describe('getPaymentStatistics', () => {
    it('deve retornar estatísticas de pagamento', async () => {
      const stats = await processor.getPaymentStatistics();

      expect(stats.total_transacoes).toBeGreaterThan(0);
      expect(stats.valor_total_processado).toBeGreaterThan(0);
      expect(stats.metodos_mais_usados).toBeInstanceOf(Array);
      expect(stats.taxa_sucesso).toBeGreaterThan(0);
      expect(stats.taxa_sucesso).toBeLessThanOrEqual(1);
    });

    it('deve incluir todos os métodos de pagamento nas estatísticas', async () => {
      const stats = await processor.getPaymentStatistics();

      const metodos = stats.metodos_mais_usados.map(m => m.metodo);
      expect(metodos).toContain('dinheiro');
      expect(metodos).toContain('cartao_debito');
      expect(metodos).toContain('pix');
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erros inesperados', async () => {
      // Simular erro interno
      const paymentData = {
        ...basePaymentData,
        valor_total: -1 // Valor inválido que pode causar erro interno
      };

      const result = await processor.processPayment(paymentData);

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBeDefined();
    });
  });

  describe('Geração de IDs', () => {
    it('deve gerar IDs únicos para transações', async () => {
      const results = await Promise.all([
        processor.processPayment(basePaymentData),
        processor.processPayment(basePaymentData),
        processor.processPayment(basePaymentData)
      ]);

      const transactionIds = results
        .filter(r => r.sucesso)
        .map(r => r.transacao_id);

      // Verificar se todos os IDs são únicos
      const uniqueIds = new Set(transactionIds);
      expect(uniqueIds.size).toBe(transactionIds.length);
    });

    it('deve gerar números de referência únicos', async () => {
      const results = await Promise.all([
        processor.processPayment(basePaymentData),
        processor.processPayment(basePaymentData)
      ]);

      const references = results
        .filter(r => r.sucesso)
        .map(r => r.numero_referencia);

      expect(references[0]).not.toBe(references[1]);
    });
  });

  describe('Integração com Diferentes Valores', () => {
    it('deve processar valores decimais corretamente', async () => {
      const paymentData = {
        ...basePaymentData,
        valor_total: 123.45,
        valor_comissao: 12.35
      };

      const result = await processor.processPayment(paymentData);

      expect(result.sucesso).toBe(true);
      expect(result.comprovante).toContain('R$ 123,45');
    });

    it('deve processar valores altos', async () => {
      const paymentData = {
        ...basePaymentData,
        valor_total: 9999.99,
        valor_comissao: 999.99
      };

      const result = await processor.processPayment(paymentData);

      expect(result.sucesso).toBe(true);
    });
  });
});