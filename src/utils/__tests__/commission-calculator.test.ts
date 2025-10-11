/**
 * Testes unitários para CommissionCalculator
 */

import { CommissionCalculator } from '../commission-calculator';
import { 
  MIN_COMMISSION_PERCENTAGE, 
  MAX_COMMISSION_PERCENTAGE 
} from '../../types/sales-management';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';

describe('CommissionCalculator', () => {
  describe('validatePercentage', () => {
    it('deve validar percentuais dentro do limite (0-30%)', () => {
      expect(CommissionCalculator.validatePercentage(0)).toBe(true);
      expect(CommissionCalculator.validatePercentage(10)).toBe(true);
      expect(CommissionCalculator.validatePercentage(30)).toBe(true);
      expect(CommissionCalculator.validatePercentage(15.5)).toBe(true);
    });

    it('deve rejeitar percentuais fora do limite', () => {
      expect(CommissionCalculator.validatePercentage(-1)).toBe(false);
      expect(CommissionCalculator.validatePercentage(31)).toBe(false);
      expect(CommissionCalculator.validatePercentage(100)).toBe(false);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(CommissionCalculator.validatePercentage(NaN)).toBe(false);
      expect(CommissionCalculator.validatePercentage(Infinity)).toBe(false);
      expect(CommissionCalculator.validatePercentage(-Infinity)).toBe(false);
    });
  });

  describe('calculateCommission', () => {
    it('deve calcular comissão corretamente', () => {
      expect(CommissionCalculator.calculateCommission(100, 10)).toBe(10);
      expect(CommissionCalculator.calculateCommission(200, 15)).toBe(30);
      expect(CommissionCalculator.calculateCommission(50, 0)).toBe(0);
      expect(CommissionCalculator.calculateCommission(100, 30)).toBe(30);
    });

    it('deve calcular comissão com decimais', () => {
      expect(CommissionCalculator.calculateCommission(100, 12.5)).toBe(12.5);
      expect(CommissionCalculator.calculateCommission(33.33, 10)).toBeCloseTo(3.333, 2);
    });

    it('deve lançar erro para percentual inválido', () => {
      expect(() => {
        CommissionCalculator.calculateCommission(100, -1);
      }).toThrow('Percentual de comissão deve estar entre 0% e 30%');

      expect(() => {
        CommissionCalculator.calculateCommission(100, 31);
      }).toThrow('Percentual de comissão deve estar entre 0% e 30%');
    });

    it('deve lançar erro para valor base negativo', () => {
      expect(() => {
        CommissionCalculator.calculateCommission(-100, 10);
      }).toThrow('Valor base deve ser maior que zero');
    });
  });

  describe('calculateTotal', () => {
    it('deve calcular total com comissão', () => {
      expect(CommissionCalculator.calculateTotal(100, 10)).toBe(110);
      expect(CommissionCalculator.calculateTotal(200, 15)).toBe(230);
      expect(CommissionCalculator.calculateTotal(50, 0)).toBe(50);
    });

    it('deve calcular total com decimais', () => {
      expect(CommissionCalculator.calculateTotal(100, 12.5)).toBe(112.5);
      expect(CommissionCalculator.calculateTotal(33.33, 10)).toBeCloseTo(36.663, 2);
    });
  });

  describe('calculateWithValidation', () => {
    it('deve retornar resultado válido para dados corretos', () => {
      const result = CommissionCalculator.calculateWithValidation(100, 10);
      
      expect(result.valor_base).toBe(100);
      expect(result.percentual_comissao).toBe(10);
      expect(result.valor_comissao).toBe(10);
      expect(result.valor_total).toBe(110);
      expect(result.percentual_valido).toBe(true);
      expect(result.erro).toBeUndefined();
    });

    it('deve retornar erro para percentual inválido', () => {
      const result = CommissionCalculator.calculateWithValidation(100, 35);
      
      expect(result.valor_base).toBe(100);
      expect(result.percentual_comissao).toBe(35);
      expect(result.valor_comissao).toBe(0);
      expect(result.valor_total).toBe(100);
      expect(result.percentual_valido).toBe(false);
      expect(result.erro).toContain('Percentual deve estar entre 0% e 30%');
    });

    it('deve retornar erro para valor base negativo', () => {
      const result = CommissionCalculator.calculateWithValidation(-100, 10);
      
      expect(result.valor_base).toBe(-100);
      expect(result.percentual_comissao).toBe(10);
      expect(result.valor_comissao).toBe(0);
      expect(result.valor_total).toBe(-100);
      expect(result.percentual_valido).toBe(false);
      expect(result.erro).toBe('Valor base deve ser maior que zero');
    });

    it('deve lidar com casos extremos', () => {
      // Valor zero
      const resultZero = CommissionCalculator.calculateWithValidation(0, 10);
      expect(resultZero.percentual_valido).toBe(false);
      expect(resultZero.erro).toBe('Valor base deve ser maior que zero');

      // Percentual zero
      const resultPercentZero = CommissionCalculator.calculateWithValidation(100, 0);
      expect(resultPercentZero.percentual_valido).toBe(true);
      expect(resultPercentZero.valor_comissao).toBe(0);
      expect(resultPercentZero.valor_total).toBe(100);
    });
  });

  describe('validateCommissionData', () => {
    it('deve validar dados corretos', () => {
      const result = CommissionCalculator.validateCommissionData(100, 10);
      
      expect(result.valido).toBe(true);
      expect(result.percentual).toBe(10);
      expect(result.valor_calculado).toBe(10);
      expect(result.mensagem_erro).toBeUndefined();
    });

    it('deve fornecer sugestões para percentual zero', () => {
      const result = CommissionCalculator.validateCommissionData(100, 0);
      
      expect(result.valido).toBe(true);
      expect(result.sugestoes).toContain('Comissão zerada - confirme se está correto');
    });

    it('deve fornecer sugestões para percentual baixo', () => {
      const result = CommissionCalculator.validateCommissionData(100, 3);
      
      expect(result.valido).toBe(true);
      expect(result.sugestoes).toContain('Percentual baixo - considere o padrão de 10%');
    });

    it('deve fornecer sugestões para percentual alto', () => {
      const result = CommissionCalculator.validateCommissionData(100, 25);
      
      expect(result.valido).toBe(true);
      expect(result.sugestoes).toContain('Percentual alto - verifique se está correto');
    });

    it('deve invalidar valor base zero ou negativo', () => {
      const result = CommissionCalculator.validateCommissionData(0, 10);
      
      expect(result.valido).toBe(false);
      expect(result.mensagem_erro).toBe('Valor base deve ser maior que zero');
    });

    it('deve invalidar percentual fora do limite', () => {
      const result = CommissionCalculator.validateCommissionData(100, 35);
      
      expect(result.valido).toBe(false);
      expect(result.mensagem_erro).toContain('Percentual deve estar entre 0% e 30%');
      expect(result.sugestoes).toContain('Percentual máximo é 30%');
    });
  });

  describe('calculatePercentageFromAmount', () => {
    it('deve calcular percentual a partir do valor da comissão', () => {
      expect(CommissionCalculator.calculatePercentageFromAmount(100, 10)).toBe(10);
      expect(CommissionCalculator.calculatePercentageFromAmount(200, 30)).toBe(15);
      expect(CommissionCalculator.calculatePercentageFromAmount(50, 0)).toBe(0);
    });

    it('deve calcular percentual com decimais', () => {
      expect(CommissionCalculator.calculatePercentageFromAmount(100, 12.5)).toBe(12.5);
      expect(CommissionCalculator.calculatePercentageFromAmount(33.33, 3.333)).toBeCloseTo(10, 1);
    });

    it('deve lançar erro para valor base zero ou negativo', () => {
      expect(() => {
        CommissionCalculator.calculatePercentageFromAmount(0, 10);
      }).toThrow('Valor base deve ser maior que zero');

      expect(() => {
        CommissionCalculator.calculatePercentageFromAmount(-100, 10);
      }).toThrow('Valor base deve ser maior que zero');
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores em Real brasileiro', () => {
      expect(CommissionCalculator.formatCurrency(100)).toMatch(/R\$\s*100,00/);
      expect(CommissionCalculator.formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(CommissionCalculator.formatCurrency(0)).toMatch(/R\$\s*0,00/);
    });

    it('deve formatar valores negativos', () => {
      expect(CommissionCalculator.formatCurrency(-100)).toMatch(/-R\$\s*100,00/);
    });
  });

  describe('formatPercentage', () => {
    it('deve formatar percentuais', () => {
      expect(CommissionCalculator.formatPercentage(10)).toBe('10.0%');
      expect(CommissionCalculator.formatPercentage(12.5)).toBe('12.5%');
      expect(CommissionCalculator.formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('Cenários de integração', () => {
    it('deve processar fluxo completo de cálculo', () => {
      const valorBase = 150.75;
      const percentual = 12.5;

      // Validar entrada
      expect(CommissionCalculator.validatePercentage(percentual)).toBe(true);

      // Calcular comissão
      const valorComissao = CommissionCalculator.calculateCommission(valorBase, percentual);
      expect(valorComissao).toBeCloseTo(18.84, 2);

      // Calcular total
      const valorTotal = CommissionCalculator.calculateTotal(valorBase, percentual);
      expect(valorTotal).toBeCloseTo(169.59, 2);

      // Validação completa
      const resultado = CommissionCalculator.calculateWithValidation(valorBase, percentual);
      expect(resultado.percentual_valido).toBe(true);
      expect(resultado.valor_comissao).toBeCloseTo(18.84, 2);
      expect(resultado.valor_total).toBeCloseTo(169.59, 2);
    });

    it('deve lidar com casos extremos de valores', () => {
      // Valor muito pequeno
      const resultadoPequeno = CommissionCalculator.calculateWithValidation(0.01, 10);
      expect(resultadoPequeno.percentual_valido).toBe(true);
      expect(resultadoPequeno.valor_comissao).toBe(0.001);

      // Valor muito grande
      const resultadoGrande = CommissionCalculator.calculateWithValidation(999999.99, 30);
      expect(resultadoGrande.percentual_valido).toBe(true);
      expect(resultadoGrande.valor_comissao).toBeCloseTo(299999.997, 2);
    });
  });
});