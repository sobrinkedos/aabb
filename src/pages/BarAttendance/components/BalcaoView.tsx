import React, { useState } from 'react';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { useBarAttendance } from '../../../hooks/useBarAttendance';
import { useAuth } from '../../../contexts/AuthContext';
import { MenuItem, BarCustomer } from '../../../types';
import { BalcaoOrder } from '../../../types/bar-attendance';
import CustomerSearchModal from './CustomerSearchModal';
import ReceiptPrinter from './ReceiptPrinter';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  CreditCardIcon, 
  BanknotesIcon,
  DevicePhoneMobileIcon,
  PrinterIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

  const BalcaoView: React.FC = () => {
  const { user } = useAuth();
  const { menuItems, loading: menuLoading, error: menuError } = useMenuItems(true); // true para incluir itens diretos do estoque
  const { processarPedidoBalcao } = useBarAttendance();
  
  // Estados do carrinho e pedido
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<BarCustomer | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('dinheiro');
  const [orderNotes, setOrderNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de UI
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [lastOrderData, setLastOrderData] = useState<BalcaoOrder | null>(null);

  // Métodos de pagamento disponíveis
  const paymentMethods: PaymentMethod[] = [
    { id: 'dinheiro', name: 'Dinheiro', icon: BanknotesIcon, color: 'bg-green-500' },
    { id: 'cartao_debito', name: 'Cartão Débito', icon: CreditCardIcon, color: 'bg-blue-500' },
    { id: 'cartao_credito', name: 'Cartão Crédito', icon: CreditCardIcon, color: 'bg-purple-500' },
    { id: 'pix', name: 'PIX', icon: DevicePhoneMobileIcon, color: 'bg-orange-500' }
  ];

  // Obter categorias únicas do menu
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  // Filtrar itens do menu
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  // Calcular total do carrinho
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountAmount = selectedCustomer ? cartTotal * 0.1 : 0; // 10% desconto para membros
  const finalTotal = cartTotal - discountAmount;

  // Adicionar item ao carrinho
  const addToCart = (menuItem: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menu_item_id === menuItem.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        }];
      }
    });
  };

  // Remover item do carrinho
  const removeFromCart = (menuItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.menu_item_id !== menuItemId));
  };

  // Atualizar quantidade no carrinho
  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Limpar carrinho
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderNotes('');
    setSelectedPaymentMethod('dinheiro');
  };

  // Selecionar cliente
  const handleSelectCustomer = (customer: BarCustomer) => {
    setSelectedCustomer(customer);
  };

  // Processar pagamento
  const processPayment = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    try {
      const order: BalcaoOrder = {
        items: cart,
        customer: selectedCustomer ? {
          ...selectedCustomer,
          birth_date: selectedCustomer.birth_date || null,
          cpf: selectedCustomer.cpf || null,
          email: selectedCustomer.email || null,
          dietary_restrictions: selectedCustomer.dietary_restrictions || null,
          favorite_items: selectedCustomer.favorite_items || null,
          emergency_contact_name: selectedCustomer.emergency_contact_name || null,
          emergency_contact_phone: selectedCustomer.emergency_contact_phone || null,
          notes: selectedCustomer.notes || null,
          last_visit: selectedCustomer.last_visit || null,
          gender: selectedCustomer.gender || null,
          preferred_table: selectedCustomer.preferred_table || null
        } : undefined,
        total: finalTotal,
        discount_amount: discountAmount,
        payment_method: selectedPaymentMethod,
        notes: orderNotes
      };

      const orderId = await processarPedidoBalcao(order);
      setLastOrderId(orderId);
      setLastOrderData(order);
      
      // Fechar modal de pagamento
      setShowPaymentModal(false);
      
      // Mostrar modal de comprovante para impressão automática
      setShowReceiptModal(true);
      
      // Limpar formulário após pequeno delay
      setTimeout(() => {
        clearCart();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Callback após impressão
  const handleReceiptPrinted = () => {
    setShowReceiptModal(false);
    setLastOrderData(null);
    setLastOrderId(null);
  };

  return (
    <div className="balcao-container h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Atendimento no Balcão</h2>
          <div className="flex items-center space-x-4">
            {selectedCustomer && (
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                {selectedCustomer.is_vip && (
                  <StarIcon className="h-4 w-4 text-yellow-600" />
                )}
                <UserIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {selectedCustomer.name}
                </span>
                <span className="text-xs text-green-600">
                  ({selectedCustomer.loyalty_points} pts)
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-green-600 hover:text-green-800"
                  title="Remover cliente selecionado"
                  aria-label="Remover cliente selecionado"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              <span>Identificar Membro</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Menu de Itens */}
          <div className="flex-1 flex flex-col p-6">
            {/* Filtros e Busca */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Filtrar por categoria"
                aria-label="Filtrar por categoria"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid de Itens */}
            <div className="flex-1 overflow-y-auto">

              {menuLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">Nenhum item encontrado</p>
                  {menuItems.length === 0 && (
                    <p className="text-sm text-gray-400">
                      Parece que não há itens cadastrados no menu. 
                      <br />Vá para Cozinha → Cardápio para adicionar itens.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMenuItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-2xl">🍺</div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          R$ {item.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carrinho de Pedido */}
          <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pedido Atual</h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800"
                    title="Limpar carrinho"
                    aria-label="Limpar carrinho"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            
            {/* Lista de Itens - Expansível */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 pb-32">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8 h-full flex flex-col items-center justify-center">
                  <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum item selecionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.menu_item_id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          title="Diminuir quantidade"
                          aria-label="Diminuir quantidade"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          title="Aumentar quantidade"
                          aria-label="Aumentar quantidade"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menu_item_id)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                          title="Remover item"
                          aria-label="Remover item"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botão Fixo na Base da Página - Sempre Visível */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 right-0 w-96 bg-white border-t border-l border-gray-200 shadow-lg z-50">
          <div className="p-6">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto Membro (10%):</span>
                  <span>-R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total:</span>
                <span>R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={processing}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg text-lg"
              title="Finalizar pedido"
              aria-label="Finalizar pedido"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-6 w-6" />
                  <span>Finalizar Pedido</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Busca de Cliente */}
      <CustomerSearchModal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Finalizar Pagamento</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar modal de pagamento"
                aria-label="Fechar modal de pagamento"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Resumo do Pedido */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Resumo do Pedido</h4>
              <div className="space-y-2 text-sm">
                {cart.map(item => (
                  <div key={item.menu_item_id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-medium">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Método de Pagamento</h4>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observações */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações sobre o pedido..."
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                disabled={processing}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PrinterIcon className="h-4 w-4" />
                    <span>Pagar e Imprimir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante */}
      {showReceiptModal && lastOrderData && lastOrderId && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pedido Processado!</h3>
              </div>
              <button
                onClick={handleReceiptPrinted}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar modal de comprovante"
                aria-label="Fechar modal de comprovante"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <ReceiptPrinter
                receiptData={{
                  orderId: lastOrderId,
                  order: lastOrderData,
                  timestamp: new Date(),
                  employeeName: user.name || user.email || 'Funcionário'
                }}
                onPrint={handleReceiptPrinted}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleReceiptPrinted}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  // Reimprimir comprovante
                  const printWindow = window.open('', '_blank');
                  if (printWindow && lastOrderData) {
                    // Lógica de reimpressão seria aqui
                    console.log('Reimprimindo comprovante...');
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>Reimprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalcaoView;