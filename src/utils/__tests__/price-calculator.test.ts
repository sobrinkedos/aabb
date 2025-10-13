/**
 * Testes unitários para PriceCalculator
 */

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
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
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
import { it } from 'vitest';
import { describe } from 'vitest';
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
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
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
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
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
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';
import { PriceCalculator } from '../price-calculator';

describe('PriceCalculator', () => {
  describe('calculateSubtotal', () => {
    it('deve calcular subtotal corretamente', () => {
      const itens = [
        { quantidade: 2, preco_unitario: 10.50 },
        { quantidade: 1, preco_unitario: 25.00 },
        { quantidade: 3, preco_unitario: 8.75 }
      ];

      const subtotal = PriceCalculator.calculateSubtotal(itens);
      expect(subtotal).toBe(72.25); // (2*10.50) + (1*15.75) + (3*8.75) = 21 + 15.75 + 26.25
    });

    it('deve retornar 0 para array vazio', () => {
      expect(PriceCalculator.calculateSubtotal([])).toBe(0);
    });

    it('deve lidar com valores decimais', () => {
      const itens = [
        { quantidade: 1.5, preco_unitario: 10.33 }
      ];

      const subtotal = PriceCalculator.calculateSubtotal(itens);
      expect(subtotal).toBeCloseTo(15.495, 2);
    });
  });

  describe('applyDiscount', () => {
    it('deve aplicar desconto percentual corretamente', () => {
      expect(PriceCalculator.applyDiscount(100, { tipo: 'percentual', valor: 10 })).toBe(90);
      expect(PriceCalculator.applyDiscount(200, { tipo: 'percentual', valor: 25 })).toBe(150);
      expect(PriceCalculator.applyDiscount(50, { tipo: 'percentual', valor: 0 })).toBe(50);
    });

    it('deve aplicar desconto em valor fixo corretamente', () => {
      expect(PriceCalculator.applyDiscount(100, { tipo: 'valor', valor: 15 })).toBe(85);
      expect(PriceCalculator.applyDiscount(200, { tipo: 'valor', valor: 50 })).toBe(150);
      expect(PriceCalculator.applyDiscount(50, { tipo: 'valor', valor: 0 })).toBe(50);
    });

    it('deve limitar desconto percentual a 100%', () => {
      expect(PriceCalculator.applyDiscount(100, { tipo: 'percentual', valor: 150 })).toBe(0);
    });

    it('deve limitar desconto em valor ao valor total', () => {
      expect(PriceCalculator.applyDiscount(100, { tipo: 'valor', valor: 150 })).toBe(0);
    });

    it('deve tratar valores negativos de desconto', () => {
      expect(PriceCalculator.applyDiscount(100, { tipo: 'percentual', valor: -10 })).toBe(100);
      expect(PriceCalculator.applyDiscount(100, { tipo: 'valor', valor: -10 })).toBe(110);
    });
  });

  describe('applyIncrease', () => {
    it('deve aplicar acréscimo percentual corretamente', () => {
      expect(PriceCalculator.applyIncrease(100, { tipo: 'percentual', valor: 10 })).toBe(110);
      expect(PriceCalculator.applyIncrease(200, { tipo: 'percentual', valor: 25 })).toBe(250);
      expect(PriceCalculator.applyIncrease(50, { tipo: 'percentual', valor: 0 })).toBe(50);
    });

    it('deve aplicar acréscimo em valor fixo corretamente', () => {
      expect(PriceCalculator.applyIncrease(100, { tipo: 'valor', valor: 15 })).toBe(115);
      expect(PriceCalculator.applyIncrease(200, { tipo: 'valor', valor: 50 })).toBe(250);
      expect(PriceCalculator.applyIncrease(50, { tipo: 'valor', valor: 0 })).toBe(50);
    });

    it('deve tratar valores negativos de acréscimo', () => {
      expect(PriceCalculator.applyIncrease(100, { tipo: 'percentual', valor: -10 })).toBe(100);
      expect(PriceCalculator.applyIncrease(100, { tipo: 'valor', valor: -10 })).toBe(100);
    });
  });

  describe('calculateTotal', () => {
    it('deve calcular total com descontos e acréscimos', () => {
      const data = {
        itens: [
          { produto_id: '1', quantidade: 2, preco_unitario: 50 }
        ],
        descontos: [
          { tipo: 'percentual' as const, valor: 10, motivo: 'Desconto cliente' }
        ],
        acrescimos: [
          { tipo: 'valor' as const, valor: 5, motivo: 'Taxa de serviço' }
        ]
      };

      const total = PriceCalculator.calculateTotal(data);
      expect(total).toBe(95); // (2*50) - 10% + 5 = 100 - 10 + 5 = 95
    });

    it('deve calcular total apenas com itens', () => {
      const data = {
        itens: [
          { produto_id: '1', quantidade: 3, preco_unitario: 25 }
        ]
      };

      const total = PriceCalculator.calculateTotal(data);
      expect(total).toBe(75);
    });

    it('deve garantir que o total não seja negativo', () => {
      const data = {
        itens: [
          { produto_id: '1', quantidade: 1, preco_unitario: 10 }
        ],
        descontos: [
          { tipo: 'valor' as const, valor: 20, motivo: 'Desconto excessivo' }
        ]
      };

      const total = PriceCalculator.calculateTotal(data);
      expect(total).toBe(0);
    });
  });

  describe('calculateDetailedTotal', () => {
    it('deve retornar detalhamento completo', () => {
      const data = {
        itens: [
          { produto_id: '1', quantidade: 2, preco_unitario: 50 }
        ],
        descontos: [
          { tipo: 'percentual' as const, valor: 10, motivo: 'Desconto' }
        ],
        acrescimos: [
          { tipo: 'valor' as const, valor: 5, motivo: 'Taxa' }
        ]
      };

      const resultado = PriceCalculator.calculateDetailedTotal(data);
      
      expect(resultado.subtotal).toBe(100);
      expect(resultado.total_descontos).toBe(10);
      expect(resultado.total_acrescimos).toBe(5);
      expect(resultado.total).toBe(95);
      expect(resultado.economia).toBe(10);
      expect(resultado.percentual_desconto).toBe(10);
    });

    it('deve calcular sem descontos nem acréscimos', () => {
      const data = {
        itens: [
          { produto_id: '1', quantidade: 1, preco_unitario: 100 }
        ]
      };

      const resultado = PriceCalculator.calculateDetailedTotal(data);
      
      expect(resultado.subtotal).toBe(100);
      expect(resultado.total_descontos).toBe(0);
      expect(resultado.total_acrescimos).toBe(0);
      expect(resultado.total).toBe(100);
      expect(resultado.economia).toBe(0);
      expect(resultado.percentual_desconto).toBe(0);
    });
  });

  describe('validateDiscount', () => {
    it('deve validar descontos percentuais', () => {
      expect(PriceCalculator.validateDiscount(100, { tipo: 'percentual', valor: 10 })).toBe(true);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'percentual', valor: 0 })).toBe(true);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'percentual', valor: 100 })).toBe(true);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'percentual', valor: -1 })).toBe(false);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'percentual', valor: 101 })).toBe(false);
    });

    it('deve validar descontos em valor', () => {
      expect(PriceCalculator.validateDiscount(100, { tipo: 'valor', valor: 50 })).toBe(true);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'valor', valor: 0 })).toBe(true);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'valor', valor: 100 })).toBe(true);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'valor', valor: -1 })).toBe(false);
      expect(PriceCalculator.validateDiscount(100, { tipo: 'valor', valor: 101 })).toBe(false);
    });

    it('deve invalidar para valor base inválido', () => {
      expect(PriceCalculator.validateDiscount(0, { tipo: 'percentual', valor: 10 })).toBe(false);
      expect(PriceCalculator.validateDiscount(-100, { tipo: 'valor', valor: 10 })).toBe(false);
    });
  });

  describe('calculateAverageUnitPrice', () => {
    it('deve calcular preço unitário médio', () => {
      const itens = [
        { quantidade: 2, preco_unitario: 10 },
        { quantidade: 3, preco_unitario: 20 }
      ];

      const media = PriceCalculator.calculateAverageUnitPrice(itens);
      expect(media).toBe(16); // (2*10 + 3*20) / (2+3) = 80/5 = 16
    });

    it('deve retornar 0 para array vazio', () => {
      expect(PriceCalculator.calculateAverageUnitPrice([])).toBe(0);
    });

    it('deve retornar 0 para quantidade total zero', () => {
      const itens = [
        { quantidade: 0, preco_unitario: 10 }
      ];

      expect(PriceCalculator.calculateAverageUnitPrice(itens)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores em Real brasileiro', () => {
      expect(PriceCalculator.formatCurrency(100)).toMatch(/R\$\s*100,00/);
      expect(PriceCalculator.formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(PriceCalculator.formatCurrency(0)).toMatch(/R\$\s*0,00/);
    });
  });

  describe('roundToTwoDecimals', () => {
    it('deve arredondar para 2 casas decimais', () => {
      expect(PriceCalculator.roundToTwoDecimals(10.123)).toBe(10.12);
      expect(PriceCalculator.roundToTwoDecimals(10.126)).toBe(10.13);
      expect(PriceCalculator.roundToTwoDecimals(10.125)).toBe(10.13);
      expect(PriceCalculator.roundToTwoDecimals(10)).toBe(10);
    });
  });

  describe('Cenários de integração', () => {
    it('deve processar pedido complexo com múltiplos descontos e acréscimos', () => {
      const data = {
        itens: [
          { produto_id: '1', quantidade: 2, preco_unitario: 25.50 },
          { produto_id: '2', quantidade: 1, preco_unitario: 15.75 },
          { produto_id: '3', quantidade: 3, preco_unitario: 8.25 }
        ],
        descontos: [
          { tipo: 'percentual' as const, valor: 10, motivo: 'Desconto cliente VIP' },
          { tipo: 'valor' as const, valor: 5, motivo: 'Cupom promocional' }
        ],
        acrescimos: [
          { tipo: 'percentual' as const, valor: 10, motivo: 'Taxa de serviço' },
          { tipo: 'valor' as const, valor: 2, motivo: 'Embalagem' }
        ]
      };

      const resultado = PriceCalculator.calculateDetailedTotal(data);
      
      // Subtotal: (2*25.50) + (1*15.75) + (3*8.25) = 51 + 15.75 + 24.75 = 91.50
      expect(resultado.subtotal).toBe(91.50);
      
      // Após descontos: 91.50 - 10% - 5 = 82.35 - 5 = 77.35
      // Após acréscimos: 77.35 + 10% + 2 = 85.085 + 2 = 87.085
      expect(resultado.total).toBeCloseTo(87.085, 1);
      expect(resultado.total_descontos).toBeCloseTo(14.15, 2);
      expect(resultado.total_acrescimos).toBeCloseTo(9.735, 2);
    });
  });
});