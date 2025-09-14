/**
 * Gerenciador de Descontos e Promoções
 * 
 * Responsável por aplicar descontos, validar cupons, gerenciar promoções
 * e controlar autorizações baseadas no perfil do usuário
 */

import { 
  Discount, 
  DiscountType, 
  Promotion, 
  Coupon, 
  MembershipDiscount,
  DiscountApplication,
  DiscountValidationResult,
  UserProfile,
  CartItem,
  Order
} from '../types/sales-management';

export class DiscountManager {
  private static instance: DiscountManager;
  private activePromotions: Promotion[] = [];
  private validCoupons: Coupon[] = [];
  private membershipDiscounts: MembershipDiscount[] = [];

  private constructor() {
    this.initializeDefaultData();
  }

  static getInstance(): DiscountManager {
    if (!DiscountManager.instance) {
      DiscountManager.instance = new DiscountManager();
    }
    return DiscountManager.instance;
  }

  /**
   * Aplica desconto manual com validação de autorização
   */
  async applyManualDiscount(
    amount: number,
    type: DiscountType,
    userProfile: UserProfile,
    reason?: string
  ): Promise<DiscountValidationResult> {
    // Validar autorização baseada no perfil
    const authResult = this.validateDiscountAuthorization(amount, type, userProfile);
    if (!authResult.authorized) {
      return {
        valid: false,
        message: authResult.message,
        requires_authorization: true,
        required_profile: authResult.required_profile
      };
    }

    // Validar limites do desconto
    const limitValidation = this.validateDiscountLimits(amount, type);
    if (!limitValidation.valid) {
      return limitValidation;
    }

    // Criar desconto
    const discount: Discount = {
      id: this.generateDiscountId(),
      type: type,
      value: amount,
      description: reason || `Desconto ${type} aplicado`,
      applied_by: userProfile.id,
      applied_at: new Date().toISOString(),
      requires_authorization: authResult.requires_supervisor,
      authorized_by: authResult.requires_supervisor ? undefined : userProfile.id
    };

    return {
      valid: true,
      discount: discount,
      message: 'Desconto aplicado com sucesso'
    };
  }

  /**
   * Aplica promoções automáticas baseadas nos itens do carrinho
   */
  async applyAutomaticPromotions(cartItems: CartItem[]): Promise<Discount[]> {
    const applicableDiscounts: Discount[] = [];

    for (const promotion of this.activePromotions) {
      if (!this.isPromotionActive(promotion)) {
        continue;
      }

      const discount = this.evaluatePromotion(promotion, cartItems);
      if (discount) {
        applicableDiscounts.push(discount);
      }
    }

    return applicableDiscounts;
  }

  /**
   * Aplica desconto de membro baseado no tipo de associação
   */
  async applyMembershipDiscount(
    memberId: string,
    membershipType: string,
    orderTotal: number
  ): Promise<DiscountValidationResult> {
    const membershipDiscount = this.membershipDiscounts.find(
      md => md.membership_type === membershipType
    );

    if (!membershipDiscount) {
      return {
        valid: false,
        message: 'Tipo de associação não encontrado'
      };
    }

    if (!membershipDiscount.active) {
      return {
        valid: false,
        message: 'Desconto de membro temporariamente indisponível'
      };
    }

    // Verificar valor mínimo
    if (orderTotal < membershipDiscount.minimum_order_value) {
      return {
        valid: false,
        message: `Valor mínimo para desconto: R$ ${membershipDiscount.minimum_order_value.toFixed(2)}`
      };
    }

    // Calcular desconto
    let discountValue: number;
    if (membershipDiscount.discount_type === 'percentage') {
      discountValue = (orderTotal * membershipDiscount.discount_value) / 100;
      if (membershipDiscount.max_discount_amount && discountValue > membershipDiscount.max_discount_amount) {
        discountValue = membershipDiscount.max_discount_amount;
      }
    } else {
      discountValue = membershipDiscount.discount_value;
    }

    const discount: Discount = {
      id: this.generateDiscountId(),
      type: 'membership',
      value: discountValue,
      description: `Desconto ${membershipDiscount.membership_type} - ${membershipDiscount.discount_value}${membershipDiscount.discount_type === 'percentage' ? '%' : ''}`,
      applied_by: 'system',
      applied_at: new Date().toISOString(),
      member_id: memberId,
      membership_type: membershipType
    };

    return {
      valid: true,
      discount: discount,
      message: 'Desconto de membro aplicado'
    };
  }

  /**
   * Valida e aplica cupom de desconto
   */
  async applyCoupon(
    couponCode: string,
    cartItems: CartItem[],
    orderTotal: number
  ): Promise<DiscountValidationResult> {
    const coupon = this.validCoupons.find(c => 
      c.code.toLowerCase() === couponCode.toLowerCase()
    );

    if (!coupon) {
      return {
        valid: false,
        message: 'Cupom não encontrado'
      };
    }

    // Validar se cupom está ativo
    if (!coupon.active) {
      return {
        valid: false,
        message: 'Cupom inativo'
      };
    }

    // Validar período de validade
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now < validFrom || now > validUntil) {
      return {
        valid: false,
        message: 'Cupom fora do período de validade'
      };
    }

    // Validar limite de uso
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return {
        valid: false,
        message: 'Cupom esgotado'
      };
    }

    // Validar valor mínimo
    if (orderTotal < coupon.minimum_order_value) {
      return {
        valid: false,
        message: `Valor mínimo para cupom: R$ ${coupon.minimum_order_value.toFixed(2)}`
      };
    }

    // Validar produtos aplicáveis
    if (coupon.applicable_products && coupon.applicable_products.length > 0) {
      const hasApplicableProduct = cartItems.some(item => 
        coupon.applicable_products!.includes(item.product_id)
      );
      
      if (!hasApplicableProduct) {
        return {
          valid: false,
          message: 'Cupom não aplicável aos produtos selecionados'
        };
      }
    }

    // Validar categorias aplicáveis
    if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
      const hasApplicableCategory = cartItems.some(item => 
        coupon.applicable_categories!.includes(item.category)
      );
      
      if (!hasApplicableCategory) {
        return {
          valid: false,
          message: 'Cupom não aplicável às categorias selecionadas'
        };
      }
    }

    // Calcular desconto
    let discountValue: number;
    if (coupon.discount_type === 'percentage') {
      discountValue = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountValue > coupon.max_discount_amount) {
        discountValue = coupon.max_discount_amount;
      }
    } else {
      discountValue = Math.min(coupon.discount_value, orderTotal);
    }

    // Incrementar contador de uso
    coupon.usage_count++;

    const discount: Discount = {
      id: this.generateDiscountId(),
      type: 'coupon',
      value: discountValue,
      description: `Cupom ${coupon.code} - ${coupon.description}`,
      applied_by: 'system',
      applied_at: new Date().toISOString(),
      coupon_code: coupon.code
    };

    return {
      valid: true,
      discount: discount,
      message: 'Cupom aplicado com sucesso'
    };
  }

  /**
   * Calcula o total de descontos aplicados
   */
  calculateTotalDiscount(discounts: Discount[]): number {
    return discounts.reduce((total, discount) => total + discount.value, 0);
  }

  /**
   * Aplica múltiplos descontos a um pedido
   */
  async applyDiscountsToOrder(
    order: Order,
    discounts: Discount[]
  ): Promise<DiscountApplication> {
    const totalDiscount = this.calculateTotalDiscount(discounts);
    const discountedTotal = Math.max(0, order.total - totalDiscount);

    // Validar se desconto não excede o valor do pedido
    if (totalDiscount > order.total) {
      return {
        success: false,
        message: 'Desconto não pode ser maior que o valor do pedido',
        original_total: order.total,
        discount_amount: totalDiscount,
        final_total: order.total
      };
    }

    return {
      success: true,
      message: 'Descontos aplicados com sucesso',
      original_total: order.total,
      discount_amount: totalDiscount,
      final_total: discountedTotal,
      applied_discounts: discounts
    };
  }

  /**
   * Remove desconto específico
   */
  async removeDiscount(discountId: string, userProfile: UserProfile): Promise<boolean> {
    // Validar autorização para remoção
    if (!this.canRemoveDiscount(userProfile)) {
      throw new Error('Usuário não autorizado a remover descontos');
    }

    // Em uma implementação real, removeria do banco de dados
    console.log(`Desconto ${discountId} removido por ${userProfile.id}`);
    return true;
  }

  /**
   * Obtém promoções ativas
   */
  getActivePromotions(): Promotion[] {
    return this.activePromotions.filter(p => this.isPromotionActive(p));
  }

  /**
   * Obtém cupons válidos (apenas códigos, sem detalhes sensíveis)
   */
  getAvailableCoupons(): Array<{ code: string; description: string; discount_type: string; discount_value: number }> {
    return this.validCoupons
      .filter(c => c.active && new Date() <= new Date(c.valid_until))
      .map(c => ({
        code: c.code,
        description: c.description,
        discount_type: c.discount_type,
        discount_value: c.discount_value
      }));
  }

  /**
   * Obtém descontos de membership disponíveis
   */
  getMembershipDiscounts(): MembershipDiscount[] {
    return this.membershipDiscounts.filter(md => md.active);
  }

  /**
   * Valida autorização para aplicar desconto
   */
  private validateDiscountAuthorization(
    amount: number,
    type: DiscountType,
    userProfile: UserProfile
  ): {
    authorized: boolean;
    requires_supervisor: boolean;
    message?: string;
    required_profile?: string;
  } {
    // Regras de autorização baseadas no perfil e valor
    const discountLimits = {
      cashier: { percentage: 5, fixed: 10.00 },
      supervisor: { percentage: 15, fixed: 50.00 },
      manager: { percentage: 30, fixed: 200.00 },
      admin: { percentage: 100, fixed: 1000.00 }
    };

    const userLimits = discountLimits[userProfile.role as keyof typeof discountLimits];
    
    if (!userLimits) {
      return {
        authorized: false,
        requires_supervisor: false,
        message: 'Perfil não autorizado a aplicar descontos',
        required_profile: 'supervisor'
      };
    }

    const limit = type === 'percentage' ? userLimits.percentage : userLimits.fixed;
    
    if (amount > limit) {
      const nextRole = this.getNextAuthorizedRole(userProfile.role);
      return {
        authorized: false,
        requires_supervisor: true,
        message: `Desconto excede limite do perfil. Necessária autorização de ${nextRole}`,
        required_profile: nextRole
      };
    }

    return {
      authorized: true,
      requires_supervisor: false
    };
  }

  /**
   * Valida limites gerais do desconto
   */
  private validateDiscountLimits(amount: number, type: DiscountType): DiscountValidationResult {
    if (amount <= 0) {
      return {
        valid: false,
        message: 'Valor do desconto deve ser maior que zero'
      };
    }

    if (type === 'percentage' && amount > 100) {
      return {
        valid: false,
        message: 'Desconto percentual não pode ser maior que 100%'
      };
    }

    if (type === 'fixed' && amount > 1000) {
      return {
        valid: false,
        message: 'Desconto fixo não pode ser maior que R$ 1.000,00'
      };
    }

    return { valid: true };
  }

  /**
   * Verifica se promoção está ativa
   */
  private isPromotionActive(promotion: Promotion): boolean {
    if (!promotion.active) return false;

    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    return now >= startDate && now <= endDate;
  }

  /**
   * Avalia se promoção se aplica aos itens do carrinho
   */
  private evaluatePromotion(promotion: Promotion, cartItems: CartItem[]): Discount | null {
    switch (promotion.type) {
      case 'buy_x_get_y':
        return this.evaluateBuyXGetY(promotion, cartItems);
      case 'minimum_amount':
        return this.evaluateMinimumAmount(promotion, cartItems);
      case 'category_discount':
        return this.evaluateCategoryDiscount(promotion, cartItems);
      case 'combo_discount':
        return this.evaluateComboDiscount(promotion, cartItems);
      default:
        return null;
    }
  }

  /**
   * Avalia promoção "Compre X, Leve Y"
   */
  private evaluateBuyXGetY(promotion: Promotion, cartItems: CartItem[]): Discount | null {
    if (!promotion.conditions?.buy_quantity || !promotion.conditions?.get_quantity) {
      return null;
    }

    const applicableItems = cartItems.filter(item => 
      !promotion.applicable_products || 
      promotion.applicable_products.includes(item.product_id)
    );

    const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
    const buyQuantity = promotion.conditions.buy_quantity;
    const getQuantity = promotion.conditions.get_quantity;

    if (totalQuantity >= buyQuantity) {
      const freeItems = Math.floor(totalQuantity / buyQuantity) * getQuantity;
      const cheapestItem = applicableItems.reduce((min, item) => 
        item.unit_price < min.unit_price ? item : min
      );
      
      const discountValue = cheapestItem.unit_price * Math.min(freeItems, totalQuantity);

      return {
        id: this.generateDiscountId(),
        type: 'promotion',
        value: discountValue,
        description: promotion.description,
        applied_by: 'system',
        applied_at: new Date().toISOString(),
        promotion_id: promotion.id
      };
    }

    return null;
  }

  /**
   * Avalia promoção por valor mínimo
   */
  private evaluateMinimumAmount(promotion: Promotion, cartItems: CartItem[]): Discount | null {
    if (!promotion.conditions?.minimum_amount) {
      return null;
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);

    if (totalAmount >= promotion.conditions.minimum_amount) {
      let discountValue: number;
      
      if (promotion.discount_type === 'percentage') {
        discountValue = (totalAmount * promotion.discount_value) / 100;
      } else {
        discountValue = promotion.discount_value;
      }

      return {
        id: this.generateDiscountId(),
        type: 'promotion',
        value: discountValue,
        description: promotion.description,
        applied_by: 'system',
        applied_at: new Date().toISOString(),
        promotion_id: promotion.id
      };
    }

    return null;
  }

  /**
   * Avalia desconto por categoria
   */
  private evaluateCategoryDiscount(promotion: Promotion, cartItems: CartItem[]): Discount | null {
    if (!promotion.applicable_categories) {
      return null;
    }

    const applicableItems = cartItems.filter(item => 
      promotion.applicable_categories!.includes(item.category)
    );

    if (applicableItems.length === 0) {
      return null;
    }

    const categoryTotal = applicableItems.reduce((sum, item) => sum + item.total_price, 0);
    let discountValue: number;

    if (promotion.discount_type === 'percentage') {
      discountValue = (categoryTotal * promotion.discount_value) / 100;
    } else {
      discountValue = Math.min(promotion.discount_value, categoryTotal);
    }

    return {
      id: this.generateDiscountId(),
      type: 'promotion',
      value: discountValue,
      description: promotion.description,
      applied_by: 'system',
      applied_at: new Date().toISOString(),
      promotion_id: promotion.id
    };
  }

  /**
   * Avalia desconto de combo
   */
  private evaluateComboDiscount(promotion: Promotion, cartItems: CartItem[]): Discount | null {
    if (!promotion.conditions?.required_products) {
      return null;
    }

    const requiredProducts = promotion.conditions.required_products;
    const hasAllProducts = requiredProducts.every(productId => 
      cartItems.some(item => item.product_id === productId)
    );

    if (hasAllProducts) {
      const comboItems = cartItems.filter(item => 
        requiredProducts.includes(item.product_id)
      );
      
      const comboTotal = comboItems.reduce((sum, item) => sum + item.total_price, 0);
      let discountValue: number;

      if (promotion.discount_type === 'percentage') {
        discountValue = (comboTotal * promotion.discount_value) / 100;
      } else {
        discountValue = Math.min(promotion.discount_value, comboTotal);
      }

      return {
        id: this.generateDiscountId(),
        type: 'promotion',
        value: discountValue,
        description: promotion.description,
        applied_by: 'system',
        applied_at: new Date().toISOString(),
        promotion_id: promotion.id
      };
    }

    return null;
  }

  /**
   * Obtém próximo nível de autorização
   */
  private getNextAuthorizedRole(currentRole: string): string {
    const hierarchy = ['cashier', 'supervisor', 'manager', 'admin'];
    const currentIndex = hierarchy.indexOf(currentRole);
    return hierarchy[currentIndex + 1] || 'admin';
  }

  /**
   * Verifica se usuário pode remover descontos
   */
  private canRemoveDiscount(userProfile: UserProfile): boolean {
    return ['supervisor', 'manager', 'admin'].includes(userProfile.role);
  }

  /**
   * Gera ID único para desconto
   */
  private generateDiscountId(): string {
    return `DISC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Inicializa dados padrão
   */
  private initializeDefaultData(): void {
    // Promoções ativas
    this.activePromotions = [
      {
        id: 'promo-001',
        name: 'Compre 2 Leve 3',
        description: 'Na compra de 2 hambúrgueres, leve 3',
        type: 'buy_x_get_y',
        discount_type: 'fixed',
        discount_value: 0,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        conditions: {
          buy_quantity: 2,
          get_quantity: 1
        },
        applicable_products: ['prod-001']
      },
      {
        id: 'promo-002',
        name: 'Desconto Acima de R$ 50',
        description: '10% de desconto em pedidos acima de R$ 50',
        type: 'minimum_amount',
        discount_type: 'percentage',
        discount_value: 10,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        conditions: {
          minimum_amount: 50.00
        }
      }
    ];

    // Cupons válidos
    this.validCoupons = [
      {
        id: 'coupon-001',
        code: 'WELCOME10',
        description: '10% de desconto para novos clientes',
        discount_type: 'percentage',
        discount_value: 10,
        minimum_order_value: 30.00,
        max_discount_amount: 20.00,
        valid_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 100,
        usage_count: 15,
        active: true
      },
      {
        id: 'coupon-002',
        code: 'SAVE5',
        description: 'R$ 5 de desconto',
        discount_type: 'fixed',
        discount_value: 5.00,
        minimum_order_value: 25.00,
        valid_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 50,
        usage_count: 8,
        active: true
      }
    ];

    // Descontos de membership
    this.membershipDiscounts = [
      {
        id: 'member-001',
        membership_type: 'gold',
        discount_type: 'percentage',
        discount_value: 15,
        minimum_order_value: 20.00,
        max_discount_amount: 50.00,
        active: true,
        description: 'Desconto Gold - 15% em todos os pedidos'
      },
      {
        id: 'member-002',
        membership_type: 'silver',
        discount_type: 'percentage',
        discount_value: 10,
        minimum_order_value: 15.00,
        max_discount_amount: 30.00,
        active: true,
        description: 'Desconto Silver - 10% em todos os pedidos'
      },
      {
        id: 'member-003',
        membership_type: 'bronze',
        discount_type: 'percentage',
        discount_value: 5,
        minimum_order_value: 10.00,
        max_discount_amount: 15.00,
        active: true,
        description: 'Desconto Bronze - 5% em todos os pedidos'
      }
    ];
  }
}