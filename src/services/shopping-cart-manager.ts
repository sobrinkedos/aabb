/**
 * Gerenciador de Carrinho de Compras
 * 
 * Responsável por gerenciar itens no carrinho, calcular totais
 * e validar operações antes de adicionar/remover produtos
 */

import { 
  Product, 
  CartItem, 
  CartSummary,
  StockValidationResult 
} from '../types/sales-management';

export class ShoppingCartManager {
  private static instance: ShoppingCartManager;
  private cartItems: CartItem[] = [];
  private listeners: Array<(items: CartItem[]) => void> = [];

  private constructor() {}

  static getInstance(): ShoppingCartManager {
    if (!ShoppingCartManager.instance) {
      ShoppingCartManager.instance = new ShoppingCartManager();
    }
    return ShoppingCartManager.instance;
  }

  /**
   * Adiciona um item ao carrinho
   * @param product Produto a ser adicionado
   * @param quantity Quantidade a adicionar
   */
  async addItem(product: Product, quantity: number = 1): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    if (!product.available) {
      throw new Error('Produto não está disponível');
    }

    // Verificar se já existe no carrinho
    const existingItemIndex = this.cartItems.findIndex(item => item.product_id === product.id);

    if (existingItemIndex >= 0) {
      // Atualizar quantidade do item existente
      const existingItem = this.cartItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      // Validar estoque total
      if (product.stock_quantity !== undefined && newQuantity > product.stock_quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.stock_quantity}, Solicitado: ${newQuantity}`);
      }

      existingItem.quantity = newQuantity;
      existingItem.total_price = existingItem.unit_price * newQuantity;
    } else {
      // Adicionar novo item
      if (product.stock_quantity !== undefined && quantity > product.stock_quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.stock_quantity}, Solicitado: ${quantity}`);
      }

      const cartItem: CartItem = {
        id: this.generateCartItemId(),
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        unit_price: product.price,
        total_price: product.price * quantity,
        category: product.category,
        observations: '',
        added_at: new Date().toISOString()
      };

      this.cartItems.push(cartItem);
    }

    this.notifyListeners();
  }

  /**
   * Remove um item do carrinho
   * @param productId ID do produto
   * @param quantity Quantidade a remover (opcional, remove tudo se não especificado)
   */
  async removeItem(productId: string, quantity?: number): Promise<void> {
    const itemIndex = this.cartItems.findIndex(item => item.product_id === productId);
    
    if (itemIndex === -1) {
      throw new Error('Item não encontrado no carrinho');
    }

    const item = this.cartItems[itemIndex];

    if (quantity === undefined || quantity >= item.quantity) {
      // Remover item completamente
      this.cartItems.splice(itemIndex, 1);
    } else {
      // Reduzir quantidade
      if (quantity <= 0) {
        throw new Error('Quantidade a remover deve ser maior que zero');
      }

      item.quantity -= quantity;
      item.total_price = item.unit_price * item.quantity;
    }

    this.notifyListeners();
  }

  /**
   * Atualiza a quantidade de um item específico
   * @param productId ID do produto
   * @param newQuantity Nova quantidade
   */
  async updateItemQuantity(productId: string, newQuantity: number): Promise<void> {
    if (newQuantity < 0) {
      throw new Error('Quantidade não pode ser negativa');
    }

    if (newQuantity === 0) {
      await this.removeItem(productId);
      return;
    }

    const itemIndex = this.cartItems.findIndex(item => item.product_id === productId);
    
    if (itemIndex === -1) {
      throw new Error('Item não encontrado no carrinho');
    }

    const item = this.cartItems[itemIndex];
    item.quantity = newQuantity;
    item.total_price = item.unit_price * newQuantity;

    this.notifyListeners();
  }

  /**
   * Adiciona observações a um item do carrinho
   * @param productId ID do produto
   * @param observations Observações
   */
  async addItemObservations(productId: string, observations: string): Promise<void> {
    const item = this.cartItems.find(item => item.product_id === productId);
    
    if (!item) {
      throw new Error('Item não encontrado no carrinho');
    }

    item.observations = observations;
    this.notifyListeners();
  }

  /**
   * Limpa todo o carrinho
   */
  clearCart(): void {
    this.cartItems = [];
    this.notifyListeners();
  }

  /**
   * Obtém todos os itens do carrinho
   */
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  /**
   * Obtém um item específico do carrinho
   * @param productId ID do produto
   */
  getCartItem(productId: string): CartItem | undefined {
    return this.cartItems.find(item => item.product_id === productId);
  }

  /**
   * Calcula o resumo do carrinho
   */
  getCartSummary(): CartSummary {
    const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.cartItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // Calcular impostos (simulado - 10%)
    const taxRate = 0.10;
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes;

    // Agrupar por categoria
    const itemsByCategory = this.cartItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    return {
      total_items: totalItems,
      subtotal: subtotal,
      taxes: taxes,
      total: total,
      items_by_category: itemsByCategory,
      has_kitchen_items: this.cartItems.some(item => 
        item.category === 'food' || item.category === 'hot_drinks'
      )
    };
  }

  /**
   * Verifica se o carrinho está vazio
   */
  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  /**
   * Obtém a quantidade total de itens no carrinho
   */
  getTotalQuantity(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Obtém o valor total do carrinho
   */
  getTotalAmount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.total_price, 0);
  }

  /**
   * Valida se todos os itens do carrinho ainda estão disponíveis
   */
  async validateCartItems(): Promise<{
    valid: boolean;
    issues: Array<{
      product_id: string;
      product_name: string;
      issue: string;
    }>;
  }> {
    const issues: Array<{
      product_id: string;
      product_name: string;
      issue: string;
    }> = [];

    // Simular validação de estoque
    for (const item of this.cartItems) {
      // Aqui seria feita uma consulta real ao estoque
      const stockAvailable = Math.floor(Math.random() * 20) + 1; // Simulado
      
      if (item.quantity > stockAvailable) {
        issues.push({
          product_id: item.product_id,
          product_name: item.product_name,
          issue: `Estoque insuficiente. Disponível: ${stockAvailable}, no carrinho: ${item.quantity}`
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Aplica desconto a um item específico
   * @param productId ID do produto
   * @param discountPercentage Percentual de desconto (0-100)
   */
  async applyItemDiscount(productId: string, discountPercentage: number): Promise<void> {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Percentual de desconto deve estar entre 0% e 100%');
    }

    const item = this.cartItems.find(item => item.product_id === productId);
    
    if (!item) {
      throw new Error('Item não encontrado no carrinho');
    }

    const discountAmount = (item.unit_price * discountPercentage) / 100;
    const discountedPrice = item.unit_price - discountAmount;
    
    item.unit_price = discountedPrice;
    item.total_price = discountedPrice * item.quantity;
    item.discount_percentage = discountPercentage;
    item.discount_amount = discountAmount * item.quantity;

    this.notifyListeners();
  }

  /**
   * Remove desconto de um item
   * @param productId ID do produto
   * @param originalPrice Preço original do produto
   */
  async removeItemDiscount(productId: string, originalPrice: number): Promise<void> {
    const item = this.cartItems.find(item => item.product_id === productId);
    
    if (!item) {
      throw new Error('Item não encontrado no carrinho');
    }

    item.unit_price = originalPrice;
    item.total_price = originalPrice * item.quantity;
    item.discount_percentage = undefined;
    item.discount_amount = undefined;

    this.notifyListeners();
  }

  /**
   * Adiciona listener para mudanças no carrinho
   * @param listener Função a ser chamada quando o carrinho mudar
   */
  addListener(listener: (items: CartItem[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   * @param listener Função a ser removida
   */
  removeListener(listener: (items: CartItem[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica todos os listeners sobre mudanças no carrinho
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.cartItems]);
      } catch (error) {
        console.error('Erro ao notificar listener do carrinho:', error);
      }
    });
  }

  /**
   * Gera ID único para item do carrinho
   */
  private generateCartItemId(): string {
    return `CART-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Exporta o carrinho para JSON
   */
  exportCart(): string {
    return JSON.stringify({
      items: this.cartItems,
      summary: this.getCartSummary(),
      exported_at: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Importa carrinho de JSON
   * @param cartJson JSON do carrinho
   */
  importCart(cartJson: string): void {
    try {
      const cartData = JSON.parse(cartJson);
      
      if (!cartData.items || !Array.isArray(cartData.items)) {
        throw new Error('Formato de carrinho inválido');
      }

      this.cartItems = cartData.items;
      this.notifyListeners();
    } catch (error) {
      throw new Error('Erro ao importar carrinho: ' + (error instanceof Error ? error.message : 'Formato inválido'));
    }
  }

  /**
   * Obtém estatísticas do carrinho
   */
  getCartStatistics(): {
    total_items: number;
    total_value: number;
    average_item_price: number;
    most_expensive_item: CartItem | null;
    categories_count: Record<string, number>;
  } {
    if (this.cartItems.length === 0) {
      return {
        total_items: 0,
        total_value: 0,
        average_item_price: 0,
        most_expensive_item: null,
        categories_count: {}
      };
    }

    const totalValue = this.getTotalAmount();
    const totalQuantity = this.getTotalQuantity();
    const averagePrice = totalValue / totalQuantity;

    const mostExpensiveItem = this.cartItems.reduce((max, item) => 
      item.unit_price > max.unit_price ? item : max
    );

    const categoriesCount = this.cartItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_items: totalQuantity,
      total_value: totalValue,
      average_item_price: averagePrice,
      most_expensive_item: mostExpensiveItem,
      categories_count: categoriesCount
    };
  }
}