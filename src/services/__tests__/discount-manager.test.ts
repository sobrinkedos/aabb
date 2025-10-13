/**
 * Testes unitários para DiscountManager
 */

import { DiscountManager } from '../discount-manager';
import { CartItem, UserProfile, DiscountType } from '../../types/sales-management';

describe('DiscountManager', () => {
  let discountManager: DiscountManager;

  const mockUserProfiles: Record<string, UserProfile> = {
    cashier: {
      id: 'user-001',
      name: 'João Silva',
      role: 'cashier',
      permissions: ['apply_discount_basic']
    },
    supervisor: {
      id: 'user-002',
      name: 'Maria Santos',
      role: 'supervisor',
      permissions: ['apply_discount_basic', 'apply_discount_advanced']
    },
    manager: {
      id: 'user-003',
      name: 'Carlos Oliveira',
      role: 'manager',
      permissions: ['apply_discount_basic', 'apply_discount_advanced', 'apply_discount_manager']
    },
    admin: {
      id: 'user-004',
      name: 'Ana Costa',
      role: 'admin',
      permissions: ['*']
    }
  };

  const mockCartItems: CartItem[] = [
    {
      id: 'cart-001',
      product_id: 'prod-001',
      product_name: 'Hambúrguer Clássico',
      quantity: 2,
      unit_price: 25.90,
      total_price: 51.80,
      category: 'food',
      observations: '',
      added_at: new Date().toISOString()
    },
    {
      id: 'cart-002',
      product_id: 'prod-003',
      product_name: 'Refrigerante Lata',
      quantity: 1,
      unit_price: 5.00,
      total_price: 5.00,
      category: 'beverages',
      observations: '',
      added_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    discountManager = DiscountManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const manager1 = DiscountManager.getInstance();
      const manager2 = DiscountManager.getInstance();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('applyManualDiscount', () => {
    describe('Autorização por Perfil', () => {
      it('deve permitir desconto dentro do limite do caixa', async () => {
        const result = await discountManager.applyManualDiscount(
          5, // 5%
          'percentage',
          mockUserProfiles.cashier,
          'Desconto promocional'
        );

        expect(result.valid).toBe(true);
        expect(result.discount).toBeDefined();
        expect(result.discount?.type).toBe('percentage');
        expect(result.discount?.value).toBe(5);
      });

      it('deve rejeitar desconto acima do limite do caixa', async () => {
        const result = await discountManager.applyManualDiscount(
          10, // 10% > limite de 5%
          'percentage',
          mockUserProfiles.cashier
        );

        expect(result.valid).toBe(false);
        expect(result.requires_authorization).toBe(true);
        expect(result.required_profile).toBe('supervisor');
      });

      it('deve permitir desconto maior para supervisor', async () => {
        const result = await discountManager.applyManualDiscount(
          15, // 15%
          'percentage',
          mockUserProfiles.supervisor
        );

        expect(result.valid).toBe(true);
        expect(result.discount).toBeDefined();
      });

      it('deve permitir desconto fixo dentro do limite', async () => {
        const result = await discountManager.applyManualDiscount(
          8.00, // R$ 8,00 < limite de R$ 10,00
          'fixed',
          mockUserProfiles.cashier
        );

        expect(result.valid).toBe(true);
        expect(result.discount?.value).toBe(8.00);
      });
    });

    describe('Validações Gerais', () => {
      it('deve rejeitar valor zero ou negativo', async () => {
        const result = await discountManager.applyManualDiscount(
          0,
          'percentage',
          mockUserProfiles.cashier
        );

        expect(result.valid).toBe(false);
        expect(result.message).toContain('maior que zero');
      });

      it('deve rejeitar percentual maior que 100%', async () => {
        const result = await discountManager.applyManualDiscount(
          150,
          'percentage',
          mockUserProfiles.admin
        );

        expect(result.valid).toBe(false);
        expect(result.message).toContain('100%');
      });

      it('deve rejeitar valor fixo muito alto', async () => {
        const result = await discountManager.applyManualDiscount(
          1500.00,
          'fixed',
          mockUserProfiles.admin
        );

        expect(result.valid).toBe(false);
        expect(result.message).toContain('R$ 1.000,00');
      });
    });

    describe('Perfis Diferentes', () => {
      it('deve ter limites corretos para cada perfil', async () => {
        // Cashier: 5% ou R$ 10
        let result = await discountManager.applyManualDiscount(5, 'percentage', mockUserProfiles.cashier);
        expect(result.valid).toBe(true);

        result = await discountManager.applyManualDiscount(6, 'percentage', mockUserProfiles.cashier);
        expect(result.valid).toBe(false);

        // Supervisor: 15% ou R$ 50
        result = await discountManager.applyManualDiscount(15, 'percentage', mockUserProfiles.supervisor);
        expect(result.valid).toBe(true);

        result = await discountManager.applyManualDiscount(45.00, 'fixed', mockUserProfiles.supervisor);
        expect(result.valid).toBe(true);

        // Manager: 30% ou R$ 200
        result = await discountManager.applyManualDiscount(25, 'percentage', mockUserProfiles.manager);
        expect(result.valid).toBe(true);

        result = await discountManager.applyManualDiscount(150.00, 'fixed', mockUserProfiles.manager);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('applyAutomaticPromotions', () => {
    it('deve aplicar promoção "Compre 2 Leve 3"', async () => {
      const discounts = await discountManager.applyAutomaticPromotions(mockCartItems);

      // Deve encontrar a promoção de hambúrguer (2 hambúrgueres no carrinho)
      const buyXGetYDiscount = discounts.find(d => d.promotion_id === 'promo-001');
      expect(buyXGetYDiscount).toBeDefined();
      expect(buyXGetYDiscount?.type).toBe('promotion');
    });

    it('deve aplicar promoção por valor mínimo', async () => {
      const highValueItems: CartItem[] = [
        {
          ...mockCartItems[0],
          quantity: 3,
          total_price: 77.70 // 3 * 25.90
        }
      ];

      const discounts = await discountManager.applyAutomaticPromotions(highValueItems);

      // Deve encontrar promoção de valor mínimo (acima de R$ 50)
      const minAmountDiscount = discounts.find(d => d.promotion_id === 'promo-002');
      expect(minAmountDiscount).toBeDefined();
      expect(minAmountDiscount?.value).toBeCloseTo(7.77, 2); // 10% de 77.70
    });

    it('deve retornar array vazio para carrinho que não atende promoções', async () => {
      const lowValueItems: CartItem[] = [
        {
          ...mockCartItems[1], // Apenas refrigerante
          quantity: 1,
          total_price: 5.00
        }
      ];

      const discounts = await discountManager.applyAutomaticPromotions(lowValueItems);
      expect(discounts).toHaveLength(0);
    });
  });

  describe('applyMembershipDiscount', () => {
    it('deve aplicar desconto Gold corretamente', async () => {
      const result = await discountManager.applyMembershipDiscount(
        'member-001',
        'gold',
        100.00
      );

      expect(result.valid).toBe(true);
      expect(result.discount).toBeDefined();
      expect(result.discount?.value).toBe(15.00); // 15% de 100
      expect(result.discount?.membership_type).toBe('gold');
    });

    it('deve aplicar desconto Silver corretamente', async () => {
      const result = await discountManager.applyMembershipDiscount(
        'member-002',
        'silver',
        50.00
      );

      expect(result.valid).toBe(true);
      expect(result.discount?.value).toBe(5.00); // 10% de 50
    });

    it('deve aplicar desconto Bronze corretamente', async () => {
      const result = await discountManager.applyMembershipDiscount(
        'member-003',
        'bronze',
        30.00
      );

      expect(result.valid).toBe(true);
      expect(result.discount?.value).toBe(1.50); // 5% de 30
    });

    it('deve rejeitar se valor for menor que mínimo', async () => {
      const result = await discountManager.applyMembershipDiscount(
        'member-001',
        'gold',
        15.00 // Menor que R$ 20 mínimo
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Valor mínimo');
    });

    it('deve aplicar desconto máximo quando necessário', async () => {
      const result = await discountManager.applyMembershipDiscount(
        'member-001',
        'gold',
        500.00 // 15% seria 75, mas máximo é 50
      );

      expect(result.valid).toBe(true);
      expect(result.discount?.value).toBe(50.00); // Máximo para Gold
    });

    it('deve rejeitar tipo de membership inexistente', async () => {
      const result = await discountManager.applyMembershipDiscount(
        'member-999',
        'platinum',
        100.00
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('não encontrado');
    });
  });

  describe('applyCoupon', () => {
    it('deve aplicar cupom WELCOME10 corretamente', async () => {
      const result = await discountManager.applyCoupon(
        'WELCOME10',
        mockCartItems,
        56.80 // Total do carrinho
      );

      expect(result.valid).toBe(true);
      expect(result.discount).toBeDefined();
      expect(result.discount?.value).toBe(5.68); // 10% de 56.80
      expect(result.discount?.coupon_code).toBe('WELCOME10');
    });

    it('deve aplicar cupom SAVE5 corretamente', async () => {
      const result = await discountManager.applyCoupon(
        'SAVE5',
        mockCartItems,
        56.80
      );

      expect(result.valid).toBe(true);
      expect(result.discount?.value).toBe(5.00); // Valor fixo
    });

    it('deve ser case insensitive', async () => {
      const result = await discountManager.applyCoupon(
        'welcome10', // Minúsculo
        mockCartItems,
        56.80
      );

      expect(result.valid).toBe(true);
    });

    it('deve rejeitar cupom inexistente', async () => {
      const result = await discountManager.applyCoupon(
        'INVALID',
        mockCartItems,
        56.80
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Cupom não encontrado');
    });

    it('deve rejeitar se valor for menor que mínimo', async () => {
      const result = await discountManager.applyCoupon(
        'WELCOME10',
        mockCartItems,
        20.00 // Menor que R$ 30 mínimo
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Valor mínimo');
    });

    it('deve aplicar desconto máximo quando necessário', async () => {
      const result = await discountManager.applyCoupon(
        'WELCOME10',
        mockCartItems,
        300.00 // 10% seria 30, mas máximo é 20
      );

      expect(result.valid).toBe(true);
      expect(result.discount?.value).toBe(20.00); // Máximo do cupom
    });
  });

  describe('calculateTotalDiscount', () => {
    it('deve calcular total de múltiplos descontos', () => {
      const discounts = [
        {
          id: 'disc-001',
          type: 'percentage' as const,
          value: 10.00,
          description: 'Desconto 1',
          applied_by: 'user-001',
          applied_at: new Date().toISOString()
        },
        {
          id: 'disc-002',
          type: 'fixed' as const,
          value: 5.00,
          description: 'Desconto 2',
          applied_by: 'user-001',
          applied_at: new Date().toISOString()
        }
      ];

      const total = discountManager.calculateTotalDiscount(discounts);
      expect(total).toBe(15.00);
    });

    it('deve retornar zero para array vazio', () => {
      const total = discountManager.calculateTotalDiscount([]);
      expect(total).toBe(0);
    });
  });

  describe('applyDiscountsToOrder', () => {
    const mockOrder = {
      id: 'order-001',
      number: '20241201001',
      status: 'pending' as const,
      items: [],
      subtotal: 56.80,
      taxes: 5.68,
      total: 62.48,
      observations: '',
      created_at: new Date().toISOString(),
      created_by: 'user-001',
      estimated_preparation_time: 15
    };

    it('deve aplicar descontos válidos', async () => {
      const discounts = [
        {
          id: 'disc-001',
          type: 'percentage' as const,
          value: 10.00,
          description: 'Desconto teste',
          applied_by: 'user-001',
          applied_at: new Date().toISOString()
        }
      ];

      const result = await discountManager.applyDiscountsToOrder(mockOrder, discounts);

      expect(result.success).toBe(true);
      expect(result.original_total).toBe(62.48);
      expect(result.discount_amount).toBe(10.00);
      expect(result.final_total).toBe(52.48);
      expect(result.applied_discounts).toEqual(discounts);
    });

    it('deve rejeitar desconto maior que valor do pedido', async () => {
      const discounts = [
        {
          id: 'disc-001',
          type: 'fixed' as const,
          value: 100.00, // Maior que o total
          description: 'Desconto inválido',
          applied_by: 'user-001',
          applied_at: new Date().toISOString()
        }
      ];

      const result = await discountManager.applyDiscountsToOrder(mockOrder, discounts);

      expect(result.success).toBe(false);
      expect(result.message).toContain('não pode ser maior');
      expect(result.final_total).toBe(mockOrder.total);
    });
  });

  describe('removeDiscount', () => {
    it('deve permitir remoção por supervisor', async () => {
      const result = await discountManager.removeDiscount(
        'disc-001',
        mockUserProfiles.supervisor
      );

      expect(result).toBe(true);
    });

    it('deve permitir remoção por manager', async () => {
      const result = await discountManager.removeDiscount(
        'disc-001',
        mockUserProfiles.manager
      );

      expect(result).toBe(true);
    });

    it('deve permitir remoção por admin', async () => {
      const result = await discountManager.removeDiscount(
        'disc-001',
        mockUserProfiles.admin
      );

      expect(result).toBe(true);
    });

    it('deve rejeitar remoção por caixa', async () => {
      await expect(
        discountManager.removeDiscount('disc-001', mockUserProfiles.cashier)
      ).rejects.toThrow('não autorizado');
    });
  });

  describe('getActivePromotions', () => {
    it('deve retornar promoções ativas', () => {
      const promotions = discountManager.getActivePromotions();

      expect(promotions).toBeInstanceOf(Array);
      expect(promotions.length).toBeGreaterThan(0);
      expect(promotions.every(p => p.active)).toBe(true);
    });
  });

  describe('getAvailableCoupons', () => {
    it('deve retornar cupons disponíveis sem dados sensíveis', () => {
      const coupons = discountManager.getAvailableCoupons();

      expect(coupons).toBeInstanceOf(Array);
      expect(coupons.length).toBeGreaterThan(0);
      
      coupons.forEach(coupon => {
        expect(coupon.code).toBeDefined();
        expect(coupon.description).toBeDefined();
        expect(coupon.discount_type).toBeDefined();
        expect(coupon.discount_value).toBeDefined();
        // Não deve expor dados internos como usage_count, etc.
        expect(coupon).not.toHaveProperty('usage_count');
        expect(coupon).not.toHaveProperty('usage_limit');
      });
    });
  });

  describe('getMembershipDiscounts', () => {
    it('deve retornar descontos de membership ativos', () => {
      const discounts = discountManager.getMembershipDiscounts();

      expect(discounts).toBeInstanceOf(Array);
      expect(discounts.length).toBeGreaterThan(0);
      expect(discounts.every(d => d.active)).toBe(true);
      
      // Verificar se tem os tipos esperados
      const types = discounts.map(d => d.membership_type);
      expect(types).toContain('gold');
      expect(types).toContain('silver');
      expect(types).toContain('bronze');
    });
  });

  describe('Integração Completa', () => {
    it('deve processar múltiplos tipos de desconto em sequência', async () => {
      const appliedDiscounts = [];

      // 1. Aplicar desconto manual
      const manualResult = await discountManager.applyManualDiscount(
        5,
        'percentage',
        mockUserProfiles.supervisor,
        'Desconto promocional'
      );
      
      if (manualResult.valid && manualResult.discount) {
        appliedDiscounts.push(manualResult.discount);
      }

      // 2. Aplicar cupom
      const couponResult = await discountManager.applyCoupon(
        'SAVE5',
        mockCartItems,
        56.80
      );
      
      if (couponResult.valid && couponResult.discount) {
        appliedDiscounts.push(couponResult.discount);
      }

      // 3. Aplicar desconto de membro
      const memberResult = await discountManager.applyMembershipDiscount(
        'member-001',
        'gold',
        56.80
      );
      
      if (memberResult.valid && memberResult.discount) {
        appliedDiscounts.push(memberResult.discount);
      }

      // Verificar total
      const totalDiscount = discountManager.calculateTotalDiscount(appliedDiscounts);
      expect(totalDiscount).toBeGreaterThan(0);
      expect(appliedDiscounts.length).toBe(3);
    });
  });
});