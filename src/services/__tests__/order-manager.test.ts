/**
 * Testes unitários para OrderManager
 */

import { OrderManager } from '../order-manager';
import { CartItem, Product } from '../../types/sales-management';

describe('OrderManager', () => {
  let orderManager: OrderManager;

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
    orderManager = OrderManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const manager1 = OrderManager.getInstance();
      const manager2 = OrderManager.getInstance();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('getAvailableProducts', () => {
    it('deve retornar lista de produtos disponíveis', async () => {
      const products = await orderManager.getAvailableProducts();

      expect(products).toBeInstanceOf(Array);
      expect(products.length).toBeGreaterThan(0);
      expect(products.every(p => p.available)).toBe(true);
    });

    it('deve incluir informações completas dos produtos', async () => {
      const products = await orderManager.getAvailableProducts();
      const product = products[0];

      expect(product.id).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.price).toBeGreaterThan(0);
      expect(product.category).toBeDefined();
      expect(product.available).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('deve retornar produto existente', async () => {
      const product = await orderManager.getProductById('prod-001');

      expect(product).toBeDefined();
      expect(product?.id).toBe('prod-001');
      expect(product?.name).toBe('Hambúrguer Clássico');
    });

    it('deve retornar null para produto inexistente', async () => {
      const product = await orderManager.getProductById('prod-999');

      expect(product).toBeNull();
    });
  });

  describe('validateStock', () => {
    it('deve validar estoque disponível', async () => {
      const validation = await orderManager.validateStock('prod-001', 2);

      expect(validation.available).toBe(true);
      expect(validation.available_quantity).toBeGreaterThanOrEqual(2);
    });

    it('deve rejeitar quantidade maior que estoque', async () => {
      const validation = await orderManager.validateStock('prod-001', 100);

      expect(validation.available).toBe(false);
      expect(validation.message).toContain('Estoque insuficiente');
    });

    it('deve rejeitar produto inexistente', async () => {
      const validation = await orderManager.validateStock('prod-999', 1);

      expect(validation.available).toBe(false);
      expect(validation.message).toBe('Produto não encontrado');
      expect(validation.available_quantity).toBe(0);
    });
  });

  describe('createOrder', () => {
    it('deve criar pedido com sucesso', async () => {
      const order = await orderManager.createOrder({
        items: mockCartItems,
        tableId: 'table-001',
        customerId: 'customer-001',
        observations: 'Pedido teste'
      });

      expect(order.id).toBeDefined();
      expect(order.number).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.items).toHaveLength(2);
      expect(order.table_id).toBe('table-001');
      expect(order.customer_id).toBe('customer-001');
      expect(order.observations).toBe('Pedido teste');
      expect(order.subtotal).toBe(56.80);
      expect(order.taxes).toBe(5.68); // 10%
      expect(order.total).toBe(62.48);
      expect(order.estimated_preparation_time).toBeGreaterThan(0);
    });

    it('deve falhar com carrinho vazio', async () => {
      await expect(orderManager.createOrder({ items: [] }))
        .rejects.toThrow('Pedido deve conter pelo menos um item');
    });

    it('deve gerar número de pedido único', async () => {
      const order1 = await orderManager.createOrder({ items: mockCartItems });
      const order2 = await orderManager.createOrder({ items: mockCartItems });

      expect(order1.number).not.toBe(order2.number);
    });

    it('deve calcular tempo estimado baseado nos itens', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      expect(order.estimated_preparation_time).toBeGreaterThan(0);
      // Deve ser pelo menos 15 minutos (tempo base para food)
      expect(order.estimated_preparation_time).toBeGreaterThanOrEqual(15);
    });

    it('deve converter itens do carrinho para itens do pedido', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      expect(order.items).toHaveLength(2);
      expect(order.items[0].product_id).toBe('prod-001');
      expect(order.items[0].status).toBe('pending');
      expect(order.items[0].added_at).toBeDefined();
    });
  });

  describe('getOrderById', () => {
    it('deve retornar pedido existente', async () => {
      const createdOrder = await orderManager.createOrder({ items: mockCartItems });
      const foundOrder = await orderManager.getOrderById(createdOrder.id);

      expect(foundOrder).toBeDefined();
      expect(foundOrder?.id).toBe(createdOrder.id);
    });

    it('deve retornar null para pedido inexistente', async () => {
      const order = await orderManager.getOrderById('order-999');

      expect(order).toBeNull();
    });
  });

  describe('getOrdersByStatus', () => {
    it('deve retornar pedidos por status', async () => {
      await orderManager.createOrder({ items: mockCartItems });
      await orderManager.createOrder({ items: mockCartItems });

      const pendingOrders = await orderManager.getOrdersByStatus('pending');

      expect(pendingOrders).toBeInstanceOf(Array);
      expect(pendingOrders.length).toBeGreaterThanOrEqual(2);
      expect(pendingOrders.every(o => o.status === 'pending')).toBe(true);
    });

    it('deve retornar array vazio para status sem pedidos', async () => {
      const deliveredOrders = await orderManager.getOrdersByStatus('delivered');

      expect(deliveredOrders).toBeInstanceOf(Array);
    });
  });

  describe('updateOrderStatus', () => {
    it('deve atualizar status do pedido', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      await orderManager.updateOrderStatus(order.id, 'confirmed');

      const updatedOrder = await orderManager.getOrderById(order.id);
      expect(updatedOrder?.status).toBe('confirmed');
      expect(updatedOrder?.confirmed_at).toBeDefined();
      expect(updatedOrder?.updated_at).toBeDefined();
    });

    it('deve definir timestamps específicos por status', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      await orderManager.updateOrderStatus(order.id, 'preparing');
      let updatedOrder = await orderManager.getOrderById(order.id);
      expect(updatedOrder?.preparation_started_at).toBeDefined();

      await orderManager.updateOrderStatus(order.id, 'ready');
      updatedOrder = await orderManager.getOrderById(order.id);
      expect(updatedOrder?.ready_at).toBeDefined();

      await orderManager.updateOrderStatus(order.id, 'delivered');
      updatedOrder = await orderManager.getOrderById(order.id);
      expect(updatedOrder?.delivered_at).toBeDefined();
    });

    it('deve falhar com pedido inexistente', async () => {
      await expect(orderManager.updateOrderStatus('order-999', 'confirmed'))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('cancelOrder', () => {
    it('deve cancelar pedido pendente', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      await orderManager.cancelOrder(order.id, 'Cliente desistiu');

      const cancelledOrder = await orderManager.getOrderById(order.id);
      expect(cancelledOrder?.status).toBe('cancelled');
      expect(cancelledOrder?.cancelled_at).toBeDefined();
      expect(cancelledOrder?.cancellation_reason).toBe('Cliente desistiu');
    });

    it('deve falhar ao cancelar pedido entregue', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });
      await orderManager.updateOrderStatus(order.id, 'delivered');

      await expect(orderManager.cancelOrder(order.id, 'Motivo'))
        .rejects.toThrow('Não é possível cancelar pedido já entregue');
    });

    it('deve falhar ao cancelar pedido em preparo', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });
      await orderManager.updateOrderStatus(order.id, 'preparing');

      await expect(orderManager.cancelOrder(order.id, 'Motivo'))
        .rejects.toThrow('Pedido já está sendo preparado');
    });

    it('deve falhar com pedido inexistente', async () => {
      await expect(orderManager.cancelOrder('order-999', 'Motivo'))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('addItemToOrder', () => {
    it('deve adicionar item a pedido pendente', async () => {
      const order = await orderManager.createOrder({ items: [mockCartItems[0]] });

      await orderManager.addItemToOrder(order.id, mockCartItems[1]);

      const updatedOrder = await orderManager.getOrderById(order.id);
      expect(updatedOrder?.items).toHaveLength(2);
      expect(updatedOrder?.total).toBeGreaterThan(order.total);
    });

    it('deve falhar com pedido não pendente', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });
      await orderManager.updateOrderStatus(order.id, 'confirmed');

      await expect(orderManager.addItemToOrder(order.id, mockCartItems[0]))
        .rejects.toThrow('Só é possível adicionar itens a pedidos pendentes');
    });

    it('deve falhar com pedido inexistente', async () => {
      await expect(orderManager.addItemToOrder('order-999', mockCartItems[0]))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('removeItemFromOrder', () => {
    it('deve remover item de pedido pendente', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });
      const itemToRemove = order.items[0];

      await orderManager.removeItemFromOrder(order.id, itemToRemove.id);

      const updatedOrder = await orderManager.getOrderById(order.id);
      expect(updatedOrder?.items).toHaveLength(1);
      expect(updatedOrder?.total).toBeLessThan(order.total);
    });

    it('deve falhar com pedido não pendente', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });
      await orderManager.updateOrderStatus(order.id, 'confirmed');

      await expect(orderManager.removeItemFromOrder(order.id, order.items[0].id))
        .rejects.toThrow('Só é possível remover itens de pedidos pendentes');
    });

    it('deve falhar com item inexistente', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      await expect(orderManager.removeItemFromOrder(order.id, 'item-999'))
        .rejects.toThrow('Item não encontrado no pedido');
    });

    it('deve falhar com pedido inexistente', async () => {
      await expect(orderManager.removeItemFromOrder('order-999', 'item-001'))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('getOrderStatistics', () => {
    it('deve retornar estatísticas de pedidos', async () => {
      // Criar alguns pedidos
      const order1 = await orderManager.createOrder({ items: mockCartItems });
      const order2 = await orderManager.createOrder({ items: [mockCartItems[0]] });
      
      // Entregar um pedido
      await orderManager.updateOrderStatus(order1.id, 'delivered');

      const stats = await orderManager.getOrderStatistics();

      expect(stats.total_orders).toBeGreaterThanOrEqual(2);
      expect(stats.orders_by_status.pending).toBeGreaterThanOrEqual(1);
      expect(stats.orders_by_status.delivered).toBeGreaterThanOrEqual(1);
      expect(stats.total_revenue).toBeGreaterThan(0);
      expect(stats.average_order_value).toBeGreaterThan(0);
      expect(stats.most_ordered_items).toBeInstanceOf(Array);
    });

    it('deve calcular itens mais pedidos corretamente', async () => {
      await orderManager.createOrder({ items: mockCartItems });
      await orderManager.createOrder({ items: [mockCartItems[0]] }); // Hambúrguer novamente

      const stats = await orderManager.getOrderStatistics();

      expect(stats.most_ordered_items.length).toBeGreaterThan(0);
      const mostOrdered = stats.most_ordered_items[0];
      expect(mostOrdered.product_name).toBe('Hambúrguer Clássico');
      expect(mostOrdered.quantity).toBe(3); // 2 + 1
    });
  });

  describe('Integração com Estoque', () => {
    it('deve atualizar estoque após criar pedido', async () => {
      const productsBefore = await orderManager.getAvailableProducts();
      const hamburgerBefore = productsBefore.find(p => p.id === 'prod-001');
      const initialStock = hamburgerBefore?.stock_quantity || 0;

      await orderManager.createOrder({ items: [mockCartItems[0]] }); // 2 hambúrgueres

      const productsAfter = await orderManager.getAvailableProducts();
      const hamburgerAfter = productsAfter.find(p => p.id === 'prod-001');
      
      expect(hamburgerAfter?.stock_quantity).toBe(initialStock - 2);
    });

    it('deve restaurar estoque após cancelar pedido', async () => {
      const productsBefore = await orderManager.getAvailableProducts();
      const hamburgerBefore = productsBefore.find(p => p.id === 'prod-001');
      const initialStock = hamburgerBefore?.stock_quantity || 0;

      const order = await orderManager.createOrder({ items: [mockCartItems[0]] });
      await orderManager.cancelOrder(order.id, 'Teste');

      const productsAfter = await orderManager.getAvailableProducts();
      const hamburgerAfter = productsAfter.find(p => p.id === 'prod-001');
      
      expect(hamburgerAfter?.stock_quantity).toBe(initialStock);
    });
  });

  describe('Integração com Cozinha', () => {
    it('deve identificar itens que vão para cozinha', async () => {
      const order = await orderManager.createOrder({ items: mockCartItems });

      // Hambúrguer (food) deve ir para cozinha, refrigerante (beverages) não
      const foodItems = order.items.filter(item => 
        item.category === 'food' || item.category === 'hot_drinks'
      );
      
      expect(foodItems.length).toBeGreaterThan(0);
    });

    it('deve calcular tempo de preparo baseado nos itens', async () => {
      const foodOnlyItems = [mockCartItems[0]]; // Apenas hambúrguer
      const order = await orderManager.createOrder({ items: foodOnlyItems });

      expect(order.estimated_preparation_time).toBeGreaterThanOrEqual(15);
    });
  });
});