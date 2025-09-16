/**
 * Gerenciador de Pedidos
 * 
 * Responsável por criar pedidos, validar estoque, gerar números únicos
 * e integrar com a cozinha quando necessário
 */

import { 
  Product, 
  CartItem, 
  Order, 
  OrderItem, 
  OrderStatus,
  StockValidationResult,
  ProductCategory 
} from '../types/sales-management';

interface CreateOrderData {
  items: CartItem[];
  tableId?: string;
  customerId?: string;
  observations?: string;
}

export class OrderManager {
  private static instance: OrderManager;
  private orderCounter: number = 1;
  private orders: Order[] = [];

  // Simulação de produtos disponíveis
  private availableProducts: Product[] = [
    {
      id: 'prod-001',
      name: 'Hambúrguer Clássico',
      description: 'Hambúrguer artesanal com queijo, alface e tomate',
      price: 25.90,
      category: 'food',
      available: true,
      stock_quantity: 15,
      image_url: '/images/hamburger.jpg'
    },
    {
      id: 'prod-002',
      name: 'Batata Frita',
      description: 'Porção de batata frita crocante',
      price: 12.50,
      category: 'food',
      available: true,
      stock_quantity: 20,
      image_url: '/images/fries.jpg'
    },
    {
      id: 'prod-003',
      name: 'Refrigerante Lata',
      description: 'Coca-Cola, Pepsi ou Guaraná 350ml',
      price: 5.00,
      category: 'beverages',
      available: true,
      stock_quantity: 50,
      image_url: '/images/soda.jpg'
    },
    {
      id: 'prod-004',
      name: 'Cerveja Pilsen',
      description: 'Cerveja gelada 600ml',
      price: 8.50,
      category: 'beverages',
      available: true,
      stock_quantity: 30,
      image_url: '/images/beer.jpg'
    },
    {
      id: 'prod-005',
      name: 'Pizza Margherita',
      description: 'Pizza tradicional com molho de tomate, mussarela e manjericão',
      price: 35.00,
      category: 'food',
      available: true,
      stock_quantity: 8,
      image_url: '/images/pizza.jpg'
    },
    {
      id: 'prod-006',
      name: 'Café Expresso',
      description: 'Café expresso tradicional',
      price: 4.50,
      category: 'hot_drinks',
      available: true,
      stock_quantity: 100,
      image_url: '/images/coffee.jpg'
    },
    {
      id: 'prod-007',
      name: 'Suco Natural',
      description: 'Suco de laranja, limão ou maracujá 300ml',
      price: 7.00,
      category: 'beverages',
      available: true,
      stock_quantity: 25,
      image_url: '/images/juice.jpg'
    },
    {
      id: 'prod-008',
      name: 'Salada Caesar',
      description: 'Salada com alface, croutons, parmesão e molho caesar',
      price: 18.90,
      category: 'food',
      available: true,
      stock_quantity: 12,
      image_url: '/images/salad.jpg'
    }
  ];

  private constructor() {}

  static getInstance(): OrderManager {
    if (!OrderManager.instance) {
      OrderManager.instance = new OrderManager();
    }
    return OrderManager.instance;
  }

  /**
   * Obtém produtos disponíveis
   */
  async getAvailableProducts(): Promise<Product[]> {
    // Simular delay de rede
    await this.simulateDelay(300);
    
    return this.availableProducts.filter(product => product.available);
  }

  /**
   * Obtém produto por ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    await this.simulateDelay(100);
    
    return this.availableProducts.find(product => product.id === productId) || null;
  }

  /**
   * Valida disponibilidade de estoque
   */
  async validateStock(productId: string, quantity: number): Promise<StockValidationResult> {
    await this.simulateDelay(200);

    const product = this.availableProducts.find(p => p.id === productId);
    
    if (!product) {
      return {
        available: false,
        message: 'Produto não encontrado',
        available_quantity: 0
      };
    }

    if (!product.available) {
      return {
        available: false,
        message: 'Produto temporariamente indisponível',
        available_quantity: 0
      };
    }

    if (product.stock_quantity === undefined) {
      return {
        available: true,
        available_quantity: quantity
      };
    }

    if (quantity > product.stock_quantity) {
      return {
        available: false,
        message: `Estoque insuficiente. Disponível: ${product.stock_quantity}`,
        available_quantity: product.stock_quantity
      };
    }

    return {
      available: true,
      available_quantity: product.stock_quantity
    };
  }

  /**
   * Cria um novo pedido
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Pedido deve conter pelo menos um item');
    }

    // Validar estoque de todos os itens
    for (const item of orderData.items) {
      const stockValidation = await this.validateStock(item.product_id, item.quantity);
      if (!stockValidation.available) {
        throw new Error(`${item.product_name}: ${stockValidation.message}`);
      }
    }

    // Gerar número do pedido
    const orderNumber = this.generateOrderNumber();

    // Converter itens do carrinho para itens do pedido
    const orderItems: OrderItem[] = orderData.items.map(cartItem => ({
      id: this.generateOrderItemId(),
      product_id: cartItem.product_id,
      product_name: cartItem.product_name,
      quantity: cartItem.quantity,
      unit_price: cartItem.unit_price,
      total_price: cartItem.total_price,
      category: cartItem.category,
      status: 'pending',
      observations: cartItem.observations || '',
      added_at: new Date().toISOString()
    }));

    // Calcular totais
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxes = subtotal * 0.10; // 10% de impostos
    const total = subtotal + taxes;

    // Criar pedido
    const order: Order = {
      id: this.generateOrderId(),
      number: orderNumber,
      status: 'pending',
      items: orderItems,
      table_id: orderData.tableId,
      customer_id: orderData.customerId,
      subtotal: subtotal,
      taxes: taxes,
      total: total,
      observations: orderData.observations || '',
      created_at: new Date().toISOString(),
      created_by: 'current-user', // Seria obtido do contexto
      estimated_preparation_time: this.calculateEstimatedTime(orderItems)
    };

    // Atualizar estoque
    await this.updateStock(orderItems);

    // Enviar para cozinha se necessário
    if (this.hasKitchenItems(orderItems)) {
      await this.sendToKitchen(order);
    }

    // Armazenar pedido
    this.orders.push(order);

    return order;
  }

  /**
   * Obtém pedido por ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    await this.simulateDelay(100);
    
    return this.orders.find(order => order.id === orderId) || null;
  }

  /**
   * Obtém pedidos por status
   */
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    await this.simulateDelay(200);
    
    return this.orders.filter(order => order.status === status);
  }

  /**
   * Atualiza status do pedido
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    await this.simulateDelay(100);

    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    // Atualizar timestamps específicos
    switch (newStatus) {
      case 'confirmed':
        order.confirmed_at = new Date().toISOString();
        break;
      case 'preparing':
        order.preparation_started_at = new Date().toISOString();
        break;
      case 'ready':
        order.ready_at = new Date().toISOString();
        break;
      case 'delivered':
        order.delivered_at = new Date().toISOString();
        break;
      case 'cancelled':
        order.cancelled_at = new Date().toISOString();
        break;
    }
  }

  /**
   * Cancela um pedido
   */
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.status === 'delivered') {
      throw new Error('Não é possível cancelar pedido já entregue');
    }

    if (order.status === 'preparing') {
      throw new Error('Pedido já está sendo preparado. Contate a cozinha para cancelamento');
    }

    // Restaurar estoque
    await this.restoreStock(order.items);

    // Atualizar status
    order.status = 'cancelled';
    order.cancelled_at = new Date().toISOString();
    order.cancellation_reason = reason;
  }

  /**
   * Adiciona item a um pedido existente
   */
  async addItemToOrder(orderId: string, cartItem: CartItem): Promise<void> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.status !== 'pending') {
      throw new Error('Só é possível adicionar itens a pedidos pendentes');
    }

    // Validar estoque
    const stockValidation = await this.validateStock(cartItem.product_id, cartItem.quantity);
    if (!stockValidation.available) {
      throw new Error(`${cartItem.product_name}: ${stockValidation.message}`);
    }

    // Criar item do pedido
    const orderItem: OrderItem = {
      id: this.generateOrderItemId(),
      product_id: cartItem.product_id,
      product_name: cartItem.product_name,
      quantity: cartItem.quantity,
      unit_price: cartItem.unit_price,
      total_price: cartItem.total_price,
      category: cartItem.category,
      status: 'pending',
      observations: cartItem.observations || '',
      added_at: new Date().toISOString()
    };

    // Adicionar ao pedido
    order.items.push(orderItem);

    // Recalcular totais
    this.recalculateOrderTotals(order);

    // Atualizar estoque
    await this.updateStock([orderItem]);
  }

  /**
   * Remove item de um pedido
   */
  async removeItemFromOrder(orderId: string, itemId: string): Promise<void> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.status !== 'pending') {
      throw new Error('Só é possível remover itens de pedidos pendentes');
    }

    const itemIndex = order.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item não encontrado no pedido');
    }

    const removedItem = order.items[itemIndex];
    
    // Restaurar estoque
    await this.restoreStock([removedItem]);

    // Remover item
    order.items.splice(itemIndex, 1);

    // Recalcular totais
    this.recalculateOrderTotals(order);
  }

  /**
   * Obtém estatísticas de pedidos
   */
  async getOrderStatistics(): Promise<{
    total_orders: number;
    orders_by_status: Record<OrderStatus, number>;
    total_revenue: number;
    average_order_value: number;
    most_ordered_items: Array<{ product_name: string; quantity: number }>;
  }> {
    const totalOrders = this.orders.length;
    const ordersByStatus = this.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const totalRevenue = this.orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.total, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calcular itens mais pedidos
    const itemCounts = this.orders
      .flatMap(order => order.items)
      .reduce((acc, item) => {
        acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

    const mostOrderedItems = Object.entries(itemCounts)
      .map(([product_name, quantity]) => ({ product_name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      total_orders: totalOrders,
      orders_by_status: ordersByStatus,
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      most_ordered_items: mostOrderedItems
    };
  }

  /**
   * Verifica se há itens que precisam ir para a cozinha
   */
  private hasKitchenItems(items: OrderItem[]): boolean {
    return items.some(item => 
      item.category === 'food' || item.category === 'hot_drinks'
    );
  }

  /**
   * Envia pedido para a cozinha
   */
  private async sendToKitchen(order: Order): Promise<void> {
    await this.simulateDelay(500);
    
    // Simular envio para sistema da cozinha
    console.log(`Pedido ${order.number} enviado para a cozinha`);
    
    // Filtrar apenas itens que vão para cozinha
    const kitchenItems = order.items.filter(item => 
      item.category === 'food' || item.category === 'hot_drinks'
    );

    // Simular processamento na cozinha
    setTimeout(() => {
      kitchenItems.forEach(item => {
        item.status = 'preparing';
      });
    }, 1000);
  }

  /**
   * Calcula tempo estimado de preparo
   */
  private calculateEstimatedTime(items: OrderItem[]): number {
    // Tempo base por categoria (em minutos)
    const preparationTimes: Record<ProductCategory, number> = {
      food: 15,
      beverages: 2,
      hot_drinks: 5,
      desserts: 8,
      appetizers: 10
    };

    let maxTime = 0;
    
    items.forEach(item => {
      const baseTime = preparationTimes[item.category] || 5;
      const itemTime = baseTime + (item.quantity - 1) * 2; // +2min por item adicional
      maxTime = Math.max(maxTime, itemTime);
    });

    return maxTime;
  }

  /**
   * Atualiza estoque após criação do pedido
   */
  private async updateStock(items: OrderItem[]): Promise<void> {
    items.forEach(item => {
      const product = this.availableProducts.find(p => p.id === item.product_id);
      if (product && product.stock_quantity !== undefined) {
        product.stock_quantity -= item.quantity;
        if (product.stock_quantity <= 0) {
          product.available = false;
        }
      }
    });
  }

  /**
   * Restaura estoque após cancelamento
   */
  private async restoreStock(items: OrderItem[]): Promise<void> {
    items.forEach(item => {
      const product = this.availableProducts.find(p => p.id === item.product_id);
      if (product && product.stock_quantity !== undefined) {
        product.stock_quantity += item.quantity;
        product.available = true;
      }
    });
  }

  /**
   * Recalcula totais do pedido
   */
  private recalculateOrderTotals(order: Order): void {
    order.subtotal = order.items.reduce((sum, item) => sum + item.total_price, 0);
    order.taxes = order.subtotal * 0.10;
    order.total = order.subtotal + order.taxes;
  }

  /**
   * Gera número único do pedido
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = this.orderCounter++;
    return `${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Gera ID único do pedido
   */
  private generateOrderId(): string {
    return `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Gera ID único do item do pedido
   */
  private generateOrderItemId(): string {
    return `ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Simula delay de rede
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}