/**
 * Interface de Vendas
 * 
 * Componente principal para processamento de pedidos,
 * incluindo seleção de produtos, carrinho e finalização
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Filter,
  AlertCircle,
  Check,
  Clock
} from 'lucide-react';
import { 
  Product, 
  CartItem, 
  Order, 
  OrderStatus,
  ProductCategory 
} from '../../types/sales-management';
import { ShoppingCartManager } from '../../services/shopping-cart-manager';
import { OrderManager } from '../../services/order-manager';

interface SalesInterfaceProps {
  onOrderCreated?: (order: Order) => void;
  onError?: (error: string) => void;
  tableId?: string;
  customerId?: string;
}

export const SalesInterface: React.FC<SalesInterfaceProps> = ({
  onOrderCreated,
  onError,
  tableId,
  customerId
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const cartManager = ShoppingCartManager.getInstance();
  const orderManager = OrderManager.getInstance();

  // Carregar produtos disponíveis
  useEffect(() => {
    loadProducts();
  }, []);

  // Carregar itens do carrinho
  useEffect(() => {
    const items = cartManager.getCartItems();
    setCartItems(items);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const availableProducts = await orderManager.getAvailableProducts();
      setProducts(availableProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    try {
      setError(undefined);
      
      // Validar estoque antes de adicionar
      const stockValidation = await orderManager.validateStock(product.id, quantity);
      if (!stockValidation.available) {
        setError(stockValidation.message || 'Produto indisponível');
        return;
      }

      // Adicionar ao carrinho
      await cartManager.addItem(product, quantity);
      
      // Atualizar estado local
      const updatedItems = cartManager.getCartItems();
      setCartItems(updatedItems);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar item';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleRemoveFromCart = async (productId: string, quantity: number = 1) => {
    try {
      await cartManager.removeItem(productId, quantity);
      
      const updatedItems = cartManager.getCartItems();
      setCartItems(updatedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover item';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleClearCart = () => {
    cartManager.clearCart();
    setCartItems([]);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(undefined);

      if (cartItems.length === 0) {
        setError('Adicione itens ao carrinho antes de finalizar o pedido');
        return;
      }

      // Criar pedido
      const order = await orderManager.createOrder({
        items: cartItems,
        tableId,
        customerId,
        observations: ''
      });

      // Limpar carrinho após sucesso
      handleClearCart();

      // Notificar criação do pedido
      onOrderCreated?.(order);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar pedido';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.available;
  });

  // Calcular totais do carrinho
  const cartTotal = cartItems.reduce((sum, item) => sum + item.total_price, 0);
  const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Obter categorias únicas
  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="flex h-full bg-gray-50">
      {/* Painel de Produtos */}
      <div className="flex-1 flex flex-col">
        {/* Header com busca e filtros */}
        <div className="bg-white p-4 border-b space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Grid de Produtos */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Carregando produtos...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const cartItem = cartItems.find(item => item.product_id === product.id);
                const quantityInCart = cartItem?.quantity || 0;

                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    {/* Imagem do produto */}
                    <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl">🍽️</div>
                      )}
                    </div>

                    {/* Informações do produto */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 text-xs">
                          {product.stock_quantity > 0 ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" />
                              <span className="text-green-600">Disponível</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-orange-500" />
                              <span className="text-orange-600">Esgotado</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Controles de quantidade */}
                      <div className="flex items-center justify-between">
                        {quantityInCart > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemoveFromCart(product.id, 1)}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{quantityInCart}</span>
                            <button
                              onClick={() => handleAddToCart(product, 1)}
                              disabled={product.stock_quantity <= quantityInCart}
                              className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product, 1)}
                            disabled={product.stock_quantity === 0}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou termo de busca</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel do Carrinho */}
      <div className="w-80 bg-white border-l flex flex-col">
        {/* Header do carrinho */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho
            </h2>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Limpar
              </button>
            )}
          </div>
          {cartQuantity > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {cartQuantity} {cartQuantity === 1 ? 'item' : 'itens'}
            </p>
          )}
        </div>

        {/* Itens do carrinho */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho vazio</h3>
              <p className="text-gray-500 text-sm">Adicione produtos para começar um pedido</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cartItems.map(item => (
                <div key={item.product_id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{item.product_name}</h4>
                    <button
                      onClick={() => handleRemoveFromCart(item.product_id, item.quantity)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remover
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveFromCart(item.product_id, 1)}
                        className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleAddToCart({ 
                          id: item.product_id, 
                          name: item.product_name, 
                          price: item.unit_price 
                        } as Product, 1)}
                        className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        R$ {item.unit_price.toFixed(2)} cada
                      </div>
                      <div className="font-medium text-gray-900">
                        R$ {item.total_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com total e botão de finalizar */}
        {cartItems.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>
            
            <button
              onClick={handleCreateOrder}
              disabled={loading || cartItems.length === 0}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Finalizar Pedido
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesInterface;