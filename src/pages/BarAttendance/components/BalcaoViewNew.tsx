import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContextSimple';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { useBalcaoOrders } from '../../../hooks/useBalcaoOrders';
import { useCashManagement } from '../../../hooks/useCashManagementSimple';
import { useApp } from '../../../contexts/AppContext';
import { CreateBalcaoOrderData } from '../../../types/balcao-orders';
import { BarCustomer, MenuItem } from '../../../types';
import { formatCurrency } from '../../../types/cash-management';
import { useSearchDebounce } from '../../../hooks/useDebounce';
import CustomerSearchModal from './CustomerSearchModal';

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

// ============================================================================
// COMPONENTES MEMOIZADOS PARA PERFORMANCE
// ============================================================================

const MenuItemCard = memo(({
  item,
  stockInfo,
  onAddToCart
}: {
  item: MenuItem;
  stockInfo: any;
  onAddToCart: (item: MenuItem) => void;
}) => {
  const isLowStock = stockInfo.warning && stockInfo.available;
  const isOutOfStock = !stockInfo.available;

  return (
    <motion.div
      whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
      whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
      onClick={() => !isOutOfStock && onAddToCart(item)}
      className={`bg-white rounded-lg p-4 shadow-sm border transition-all duration-200 relative ${isOutOfStock
        ? 'cursor-not-allowed opacity-50 border-red-300'
        : isLowStock
          ? 'cursor-pointer hover:shadow-lg hover:border-yellow-400 hover:bg-yellow-50 border-yellow-300'
          : 'cursor-pointer hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 border-gray-200'
        }`}
    >
      {/* Indicador de estoque */}
      {isOutOfStock && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>Esgotado</span>
        </div>
      )}
      {isLowStock && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>Baixo</span>
        </div>
      )}

      <div className="text-center">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{item.category}</p>

        {/* Informação de estoque */}
        {item.item_type === 'direct' && stockInfo.currentStock !== undefined && (
          <p className={`text-xs mb-2 ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-500'
            }`}>
            Estoque: {stockInfo.currentStock}
          </p>
        )}

        <p className={`text-lg font-bold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'
          }`}>
          {formatCurrency(item.price)}
        </p>
      </div>
    </motion.div>
  );
});

const CartItemCard = memo(({
  item,
  stockWarning,
  onUpdateQuantity,
  onRemove
}: {
  item: CartItem;
  stockWarning?: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) => (
  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
      <p className="text-sm text-gray-600">{formatCurrency(item.price)} cada</p>

      {/* Aviso de estoque */}
      {stockWarning && (
        <div className="flex items-start space-x-1 mt-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-600 leading-tight">{stockWarning}</p>
        </div>
      )}
    </div>

    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
      <button
        onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity - 1)}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
      >
        <MinusIcon className="h-4 w-4" />
      </button>

      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>

      <button
        onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
      </button>

      <button
        onClick={() => onRemove(item.menu_item_id)}
        className="p-1.5 rounded hover:bg-red-100 text-red-600 ml-1 transition-colors"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  </div>
));

const BalcaoViewNew: React.FC = () => {
  const { menuItems, loading: menuLoading } = useMenuItems(true);
  const { createOrder } = useBalcaoOrders();
  const { currentSession } = useCashManagement();
  const { inventory } = useApp();

  // Hook de busca otimizado com debounce
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching
  } = useSearchDebounce('', 300, { minLength: 2 });

  // Estados do carrinho e pedido
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<BarCustomer | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Estados de UI
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<{ [key: string]: string }>({});
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);

  // ============================================================================
  // MEMOIZAÇÕES OTIMIZADAS PARA PERFORMANCE
  // ============================================================================

  // Obter categorias únicas do menu (memoizado)
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
    return uniqueCategories.sort();
  }, [menuItems]);

  // Filtrar itens do menu com debounce otimizado
  const filteredMenuItems = useMemo(() => {
    let items = menuItems.filter(item => item.available);

    if (categoryFilter !== 'all') {
      items = items.filter(item => item.category === categoryFilter);
    }

    // Usar debouncedSearchTerm em vez de searchTerm para evitar re-renders excessivos
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }, [menuItems, categoryFilter, debouncedSearchTerm]);

  // Calcular totais do carrinho (memoizado para performance)
  const cartCalculations = useMemo(() => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = selectedCustomer ? total * 0.1 : 0; // 10% de desconto para membros
    const finalTotal = total - discount;

    return {
      cartTotal: total,
      discountAmount: discount,
      finalTotal,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart, selectedCustomer]);

  // Performance stats (para debug)
  const performanceStats = useMemo(() => {
    return {
      totalMenuItems: menuItems.length,
      filteredItems: filteredMenuItems.length,
      cartItems: cart.length,
      searchActive: debouncedSearchTerm.length >= 2,
      isSearching
    };
  }, [menuItems.length, filteredMenuItems.length, cart.length, debouncedSearchTerm, isSearching]);

  // ============================================================================
  // FUNÇÕES OTIMIZADAS COM useCallback
  // ============================================================================

  // Função para verificar estoque disponível (memoizada)
  const checkStock = useCallback((menuItem: MenuItem, quantity: number): { available: boolean; currentStock?: number; warning?: string } => {
    // Se é item direto do estoque, verificar disponibilidade
    if (menuItem.item_type === 'direct' && menuItem.direct_inventory_item_id) {
      const inventoryItem = inventory.find(item => item.id === menuItem.direct_inventory_item_id);

      if (!inventoryItem) {
        return {
          available: false,
          warning: 'Item não encontrado no estoque'
        };
      }

      if (inventoryItem.currentStock < quantity) {
        return {
          available: false,
          currentStock: inventoryItem.currentStock,
          warning: `Estoque insuficiente. Disponível: ${inventoryItem.currentStock} ${inventoryItem.unit}`
        };
      }

      if (inventoryItem.currentStock <= inventoryItem.minStock) {
        return {
          available: true,
          currentStock: inventoryItem.currentStock,
          warning: `Estoque baixo! Disponível: ${inventoryItem.currentStock} ${inventoryItem.unit}`
        };
      }

      return {
        available: true,
        currentStock: inventoryItem.currentStock
      };
    }

    // Se é item preparado, sempre disponível
    return { available: true };
  }, [inventory]);

  // Funções do carrinho (otimizadas com useCallback)
  const addToCart = useCallback((menuItem: MenuItem) => {
    // Verificar estoque antes de adicionar
    const stockCheck = checkStock(menuItem, 1);

    if (!stockCheck.available) {
      alert(stockCheck.warning);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menu_item_id === menuItem.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const newStockCheck = checkStock(menuItem, newQuantity);

        if (!newStockCheck.available) {
          alert(newStockCheck.warning);
          return prevCart;
        }

        // Atualizar warnings se necessário
        if (newStockCheck.warning) {
          setStockWarnings(prev => ({ ...prev, [menuItem.id]: newStockCheck.warning! }));
        } else {
          setStockWarnings(prev => {
            const newWarnings = { ...prev };
            delete newWarnings[menuItem.id];
            return newWarnings;
          });
        }

        return prevCart.map(item =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Adicionar warning se necessário
        if (stockCheck.warning) {
          setStockWarnings(prev => ({ ...prev, [menuItem.id]: stockCheck.warning! }));
        }

        return [...prevCart, {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        }];
      }
    });
  }, [checkStock]);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.menu_item_id !== menuItemId));
    // Remover warning se existir
    setStockWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[menuItemId];
      return newWarnings;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    // Encontrar o menu item para verificar estoque
    const menuItem = menuItems.find(item => item.id === menuItemId);
    if (menuItem) {
      const stockCheck = checkStock(menuItem, newQuantity);

      if (!stockCheck.available) {
        alert(stockCheck.warning);
        return;
      }

      // Atualizar warnings
      if (stockCheck.warning) {
        setStockWarnings(prev => ({ ...prev, [menuItemId]: stockCheck.warning! }));
      } else {
        setStockWarnings(prev => {
          const newWarnings = { ...prev };
          delete newWarnings[menuItemId];
          return newWarnings;
        });
      }
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [menuItems, checkStock, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderNotes('');
    setCustomerNotes('');
    setStockWarnings({});
  }, []);

  // Verificar se todos os itens do carrinho têm estoque suficiente
  const validateCartStock = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    for (const cartItem of cart) {
      const menuItem = menuItems.find(item => item.id === cartItem.menu_item_id);
      if (menuItem) {
        const stockCheck = checkStock(menuItem, cartItem.quantity);
        if (!stockCheck.available) {
          errors.push(`${menuItem.name}: ${stockCheck.warning}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }, [cart, menuItems, checkStock]);

  // Processar pedido
  const processOrder = useCallback(async () => {
    if (cart.length === 0) return;

    // Validar estoque antes de processar
    const stockValidation = validateCartStock();
    if (!stockValidation.valid) {
      alert('Problemas de estoque encontrados:\n\n' + stockValidation.errors.join('\n'));
      return;
    }

    setProcessing(true);
    try {
      const orderData: CreateBalcaoOrderData = {
        customer_name: selectedCustomer?.name,
        customer_phone: selectedCustomer?.phone,
        customer_notes: customerNotes || undefined,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.notes
        })),
        discount_amount: cartCalculations.discountAmount,
        notes: orderNotes || undefined
      };

      const orderId = await createOrder(orderData);

      // Limpar formulário
      clearCart();

      // Mostrar notificação de sucesso
      alert(`Pedido #${orderId.slice(-4).toUpperCase()} criado com sucesso!\n\nO pedido está aguardando pagamento no caixa.`);

    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      if (error instanceof Error && error.message.includes('Estoque insuficiente')) {
        alert('Estoque insuficiente para um ou mais itens. Verifique o estoque e tente novamente.');
      } else {
        alert('Erro ao criar pedido. Tente novamente.');
      }
    } finally {
      setProcessing(false);
    }
  }, [cart, validateCartStock, selectedCustomer, customerNotes, orderNotes, cartCalculations.discountAmount, createOrder, clearCart]);

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Criar Pedido de Balcão</h1>
            <p className="text-gray-600">O pedido ficará pendente até o pagamento ser processado no caixa</p>
          </div>

          {/* Status do Caixa */}
          <div className="flex items-center space-x-4">
            {currentSession ? (
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Caixa Aberto</span>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <div>
                    <span className="text-yellow-800 font-medium">Caixa Fechado</span>
                    <p className="text-yellow-700 text-sm">Pedidos serão processados quando o caixa abrir</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Painel do Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filtros */}
          <div className="bg-white p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por categoria */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas Categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de Itens */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredMenuItems.map((item) => {
                const stockInfo = checkStock(item, 1);
                const isLowStock = stockInfo.warning && stockInfo.available;
                const isOutOfStock = !stockInfo.available;

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
                    whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`bg-white rounded-lg p-4 shadow-sm border transition-all duration-200 relative ${isOutOfStock
                      ? 'cursor-not-allowed opacity-50 border-red-300'
                      : isLowStock
                        ? 'cursor-pointer hover:shadow-lg hover:border-yellow-400 hover:bg-yellow-50 border-yellow-300'
                        : 'cursor-pointer hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 border-gray-200'
                      }`}
                  >
                    {/* Indicador de estoque */}
                    {isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        <span>Esgotado</span>
                      </div>
                    )}
                    {isLowStock && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        <span>Baixo</span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.category}</p>

                      {/* Informação de estoque */}
                      {item.item_type === 'direct' && stockInfo.currentStock !== undefined && (
                        <p className={`text-xs mb-2 ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-500'
                          }`}>
                          Estoque: {stockInfo.currentStock}
                        </p>
                      )}

                      <p className={`text-lg font-bold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'
                        }`}>
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel do Carrinho - Responsivo */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l flex flex-col">
          {/* Header do Carrinho */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Carrinho</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Itens do Carrinho */}
          <div className="flex-1 overflow-auto p-4 min-h-[300px] lg:min-h-0">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carrinho vazio</p>
                <p className="text-sm text-gray-400 mt-1">Adicione itens do menu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.menu_item_id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(item.price)} cada</p>

                      {/* Aviso de estoque */}
                      {stockWarnings[item.menu_item_id] && (
                        <div className="flex items-start space-x-1 mt-1">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-600 leading-tight">{stockWarnings[item.menu_item_id]}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>

                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600 ml-1 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cliente Selecionado */}
          {selectedCustomer && (
            <div className="p-3 border-t bg-blue-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-blue-900 truncate">{selectedCustomer.name}</p>
                  <p className="text-xs text-blue-700">Membro - Desconto 10%</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Resumo e Checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              {/* Botão Cliente */}
              <button
                onClick={() => setShowCustomerSearch(true)}
                className="w-full mb-3 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
              >
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{selectedCustomer ? 'Trocar Cliente' : 'Identificar Cliente'}</span>
              </button>

              {/* Totais */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(cartCalculations.cartTotal)}</span>
                </div>
                {cartCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto (10%):</span>
                    <span className="font-medium">-{formatCurrency(cartCalculations.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1.5">
                  <span>Total:</span>
                  <span>{formatCurrency(cartCalculations.finalTotal)}</span>
                </div>
              </div>

              {/* Observações - Layout compacto */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Obs. Cliente
                  </label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observações especiais..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Obs. Internas
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observações sobre o pedido..."
                  />
                </div>
              </div>

              {/* Botão Finalizar */}
              <button
                onClick={processOrder}
                disabled={processing || cart.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {processing ? 'Criando Pedido...' : 'Enviar para Caixa'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Busca de Cliente */}
      <CustomerSearchModal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerSearch(false);
        }}
      />
    </div>
  );
};

export default BalcaoViewNew;