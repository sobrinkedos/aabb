/**
 * Testes unitários para ShoppingCartManager
 */

import { ShoppingCartManager } from '../shopping-cart-manager';
import { Product, CartItem } from '../../types/sales-management';

describe('ShoppingCartManager', () => {
  let cartManager: ShoppingCartManager;

  const mockProduct: Product = {
    id: 'prod-001',
    name: 'Hambúrguer Clássico',
    description: 'Hambúrguer artesanal com queijo',
    price: 25.90,
    category: 'food',
    available: true,
    stock_quantity: 10
  };

  const mockProduct2: Product = {
    id: 'prod-002',
    name: 'Batata Frita',
    description: 'Porção de batata frita',
    price: 12.50,
    category: 'food',
    available: true,
    stock_quantity: 15
  };

  beforeEach(() => {
    cartManager = ShoppingCartManager.getInstance();
    cartManager.clearCart();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância', () => {
      const manager1 = ShoppingCartManager.getInstance();
      const manager2 = ShoppingCartManager.getInstance();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('addItem', () => {
    it('deve adicionar item ao carrinho', async () => {
      await cartManager.addItem(mockProduct, 2);

      const items = cartManager.getCartItems();
      expect(items).toHaveLength(1);
      expect(items[0].product_id).toBe('prod-001');
      expect(items[0].quantity).toBe(2);
      expect(items[0].total_price).toBe(51.80);
    });

    it('deve somar quantidade se produto já existe', async () => {
      await cartManager.addItem(mockProduct, 1);
      await cartManager.addItem(mockProduct, 2);

      const items = cartManager.getCartItems();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
      expect(items[0].total_price).toBe(77.70);
    });

    it('deve falhar com quantidade zero ou negativa', async () => {
      await expect(cartManager.addItem(mockProduct, 0))
        .rejects.toThrow('Quantidade deve ser maior que zero');

      await expect(cartManager.addItem(mockProduct, -1))
        .rejects.toThrow('Quantidade deve ser maior que zero');
    });

    it('deve falhar com produto indisponível', async () => {
      const unavailableProduct = { ...mockProduct, available: false };
      
      await expect(cartManager.addItem(unavailableProduct, 1))
        .rejects.toThrow('Produto não está disponível');
    });

    it('deve falhar se exceder estoque', async () => {
      await expect(cartManager.addItem(mockProduct, 15))
        .rejects.toThrow('Estoque insuficiente');
    });

    it('deve falhar se somar quantidade exceder estoque', async () => {
      await cartManager.addItem(mockProduct, 8);
      
      await expect(cartManager.addItem(mockProduct, 5))
        .rejects.toThrow('Estoque insuficiente');
    });
  });

  describe('removeItem', () => {
    beforeEach(async () => {
      await cartManager.addItem(mockProduct, 3);
    });

    it('deve remover quantidade específica', async () => {
      await cartManager.removeItem('prod-001', 1);

      const items = cartManager.getCartItems();
      expect(items[0].quantity).toBe(2);
      expect(items[0].total_price).toBe(51.80);
    });

    it('deve remover item completamente se quantidade >= total', async () => {
      await cartManager.removeItem('prod-001', 5);

      const items = cartManager.getCartItems();
      expect(items).toHaveLength(0);
    });

    it('deve remover item completamente se não especificar quantidade', async () => {
      await cartManager.removeItem('prod-001');

      const items = cartManager.getCartItems();
      expect(items).toHaveLength(0);
    });

    it('deve falhar com produto inexistente', async () => {
      await expect(cartManager.removeItem('prod-999', 1))
        .rejects.toThrow('Item não encontrado no carrinho');
    });

    it('deve falhar com quantidade zero ou negativa', async () => {
      await expect(cartManager.removeItem('prod-001', 0))
        .rejects.toThrow('Quantidade a remover deve ser maior que zero');
    });
  });

  describe('updateItemQuantity', () => {
    beforeEach(async () => {
      await cartManager.addItem(mockProduct, 2);
    });

    it('deve atualizar quantidade do item', async () => {
      await cartManager.updateItemQuantity('prod-001', 5);

      const items = cartManager.getCartItems();
      expect(items[0].quantity).toBe(5);
      expect(items[0].total_price).toBe(129.50);
    });

    it('deve remover item se quantidade for zero', async () => {
      await cartManager.updateItemQuantity('prod-001', 0);

      const items = cartManager.getCartItems();
      expect(items).toHaveLength(0);
    });

    it('deve falhar com quantidade negativa', async () => {
      await expect(cartManager.updateItemQuantity('prod-001', -1))
        .rejects.toThrow('Quantidade não pode ser negativa');
    });

    it('deve falhar com produto inexistente', async () => {
      await expect(cartManager.updateItemQuantity('prod-999', 1))
        .rejects.toThrow('Item não encontrado no carrinho');
    });
  });

  describe('addItemObservations', () => {
    beforeEach(async () => {
      await cartManager.addItem(mockProduct, 1);
    });

    it('deve adicionar observações ao item', async () => {
      await cartManager.addItemObservations('prod-001', 'Sem cebola');

      const item = cartManager.getCartItem('prod-001');
      expect(item?.observations).toBe('Sem cebola');
    });

    it('deve falhar com produto inexistente', async () => {
      await expect(cartManager.addItemObservations('prod-999', 'Observação'))
        .rejects.toThrow('Item não encontrado no carrinho');
    });
  });

  describe('clearCart', () => {
    it('deve limpar todo o carrinho', async () => {
      await cartManager.addItem(mockProduct, 1);
      await cartManager.addItem(mockProduct2, 2);

      cartManager.clearCart();

      const items = cartManager.getCartItems();
      expect(items).toHaveLength(0);
      expect(cartManager.isEmpty()).toBe(true);
    });
  });

  describe('getCartSummary', () => {
    it('deve calcular resumo do carrinho corretamente', async () => {
      await cartManager.addItem(mockProduct, 2); // 51.80
      await cartManager.addItem(mockProduct2, 1); // 12.50

      const summary = cartManager.getCartSummary();

      expect(summary.total_items).toBe(3);
      expect(summary.subtotal).toBe(64.30);
      expect(summary.taxes).toBe(6.43); // 10%
      expect(summary.total).toBe(70.73);
      expect(summary.has_kitchen_items).toBe(true);
    });

    it('deve agrupar itens por categoria', async () => {
      const beverageProduct: Product = {
        id: 'prod-003',
        name: 'Refrigerante',
        price: 5.00,
        category: 'beverages',
        available: true,
        stock_quantity: 20
      };

      await cartManager.addItem(mockProduct, 1);
      await cartManager.addItem(beverageProduct, 2);

      const summary = cartManager.getCartSummary();

      expect(summary.items_by_category.food).toHaveLength(1);
      expect(summary.items_by_category.beverages).toHaveLength(1);
    });
  });

  describe('isEmpty', () => {
    it('deve retornar true para carrinho vazio', () => {
      expect(cartManager.isEmpty()).toBe(true);
    });

    it('deve retornar false para carrinho com itens', async () => {
      await cartManager.addItem(mockProduct, 1);
      expect(cartManager.isEmpty()).toBe(false);
    });
  });

  describe('getTotalQuantity', () => {
    it('deve calcular quantidade total corretamente', async () => {
      await cartManager.addItem(mockProduct, 2);
      await cartManager.addItem(mockProduct2, 3);

      expect(cartManager.getTotalQuantity()).toBe(5);
    });
  });

  describe('getTotalAmount', () => {
    it('deve calcular valor total corretamente', async () => {
      await cartManager.addItem(mockProduct, 2); // 51.80
      await cartManager.addItem(mockProduct2, 1); // 12.50

      expect(cartManager.getTotalAmount()).toBe(64.30);
    });
  });

  describe('validateCartItems', () => {
    it('deve validar itens do carrinho', async () => {
      await cartManager.addItem(mockProduct, 2);

      const validation = await cartManager.validateCartItems();

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('applyItemDiscount', () => {
    beforeEach(async () => {
      await cartManager.addItem(mockProduct, 2);
    });

    it('deve aplicar desconto ao item', async () => {
      await cartManager.applyItemDiscount('prod-001', 10); // 10% desconto

      const item = cartManager.getCartItem('prod-001');
      expect(item?.discount_percentage).toBe(10);
      expect(item?.unit_price).toBe(23.31); // 25.90 - 10%
      expect(item?.total_price).toBe(46.62);
    });

    it('deve falhar com percentual inválido', async () => {
      await expect(cartManager.applyItemDiscount('prod-001', -5))
        .rejects.toThrow('Percentual de desconto deve estar entre 0% e 100%');

      await expect(cartManager.applyItemDiscount('prod-001', 150))
        .rejects.toThrow('Percentual de desconto deve estar entre 0% e 100%');
    });

    it('deve falhar com produto inexistente', async () => {
      await expect(cartManager.applyItemDiscount('prod-999', 10))
        .rejects.toThrow('Item não encontrado no carrinho');
    });
  });

  describe('removeItemDiscount', () => {
    beforeEach(async () => {
      await cartManager.addItem(mockProduct, 2);
      await cartManager.applyItemDiscount('prod-001', 10);
    });

    it('deve remover desconto do item', async () => {
      await cartManager.removeItemDiscount('prod-001', 25.90);

      const item = cartManager.getCartItem('prod-001');
      expect(item?.discount_percentage).toBeUndefined();
      expect(item?.unit_price).toBe(25.90);
      expect(item?.total_price).toBe(51.80);
    });

    it('deve falhar com produto inexistente', async () => {
      await expect(cartManager.removeItemDiscount('prod-999', 25.90))
        .rejects.toThrow('Item não encontrado no carrinho');
    });
  });

  describe('Listeners', () => {
    it('deve notificar listeners sobre mudanças', async () => {
      const listener = jest.fn();
      cartManager.addListener(listener);

      await cartManager.addItem(mockProduct, 1);

      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            product_id: 'prod-001',
            quantity: 1
          })
        ])
      );

      cartManager.removeListener(listener);
    });

    it('deve remover listeners corretamente', async () => {
      const listener = jest.fn();
      cartManager.addListener(listener);
      cartManager.removeListener(listener);

      await cartManager.addItem(mockProduct, 1);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('exportCart e importCart', () => {
    it('deve exportar e importar carrinho corretamente', async () => {
      await cartManager.addItem(mockProduct, 2);
      await cartManager.addItem(mockProduct2, 1);

      const exportedCart = cartManager.exportCart();
      expect(exportedCart).toContain('prod-001');
      expect(exportedCart).toContain('prod-002');

      cartManager.clearCart();
      expect(cartManager.isEmpty()).toBe(true);

      cartManager.importCart(exportedCart);
      
      const items = cartManager.getCartItems();
      expect(items).toHaveLength(2);
      expect(items.find(i => i.product_id === 'prod-001')?.quantity).toBe(2);
    });

    it('deve falhar ao importar JSON inválido', () => {
      expect(() => cartManager.importCart('invalid json'))
        .toThrow('Erro ao importar carrinho');

      expect(() => cartManager.importCart('{"invalid": "format"}'))
        .toThrow('Erro ao importar carrinho');
    });
  });

  describe('getCartStatistics', () => {
    it('deve retornar estatísticas do carrinho', async () => {
      await cartManager.addItem(mockProduct, 2);
      await cartManager.addItem(mockProduct2, 1);

      const stats = cartManager.getCartStatistics();

      expect(stats.total_items).toBe(3);
      expect(stats.total_value).toBe(64.30);
      expect(stats.average_item_price).toBeCloseTo(21.43, 2);
      expect(stats.most_expensive_item?.product_id).toBe('prod-001');
      expect(stats.categories_count.food).toBe(3);
    });

    it('deve retornar estatísticas vazias para carrinho vazio', () => {
      const stats = cartManager.getCartStatistics();

      expect(stats.total_items).toBe(0);
      expect(stats.total_value).toBe(0);
      expect(stats.average_item_price).toBe(0);
      expect(stats.most_expensive_item).toBeNull();
      expect(Object.keys(stats.categories_count)).toHaveLength(0);
    });
  });
});