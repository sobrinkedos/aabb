import React, { useState } from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Users, 
  Receipt, 
  AlertTriangle,
  Plus,
  BarChart3,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { useBalcaoOrders } from '../../../hooks/useBalcaoOrders';
import { useAuth } from '../../../contexts/AuthContext';
import { OpenCashModal } from './OpenCashModal';
import { CloseCashModal } from './CloseCashModal';
import PaymentReceipt from '../../BarAttendance/components/PaymentReceipt';
import { formatCurrency, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../types/cash-management';
import { ComandaWithItems } from '../../../types/bar-attendance';
import { BalcaoOrderWithDetails } from '../../../types/balcao-orders';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const {
    currentSession,
    pendingComandas,
    todaysSummary,
    todaysTransactions,
    loading,
    error,
    openCashSession,
    closeCashSession,
    processComandaPayment
  } = useCashManagement();

  const {
    pendingOrders: pendingBalcaoOrders,
    processPayment: processBalcaoPayment
  } = useBalcaoOrders();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BalcaoOrderWithDetails | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [processing, setProcessing] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<any>(null);

  // Função para processar pagamento de pedido de balcão
  const handleBalcaoPayment = async (order: BalcaoOrderWithDetails) => {
    if (!currentSession) {
      alert('É necessário ter uma sessão de caixa aberta para processar pagamentos.');
      return;
    }
    
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder || !currentSession) return;

    setProcessing(true);
    try {
      await processBalcaoPayment({
        order_id: selectedOrder.id,
        payment_method: selectedPaymentMethod,
        cash_session_id: currentSession.id,
        amount_paid: selectedOrder.final_amount
      });

      // Preparar dados para o comprovante
      setLastPaymentData({
        order: selectedOrder,
        paymentMethod: selectedPaymentMethod,
        amountPaid: selectedOrder.final_amount,
        cashierName: user?.name || user?.email || 'Operador de Caixa',
        timestamp: new Date()
      });

      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Callback após impressão do comprovante
  const handleReceiptPrinted = () => {
    setShowReceiptModal(false);
    setLastPaymentData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Erro no Sistema</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Caixa</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {!currentSession ? (
            <button
              onClick={() => setShowOpenModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Abrir Caixa</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCloseModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              <span>Fechar Caixa</span>
            </button>
          )}
        </div>
      </div>

      {/* Status do Caixa */}
      {currentSession ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Caixa Aberto</h3>
                <p className="text-green-600">
                  Aberto às {new Date(currentSession.opened_at).toLocaleTimeString('pt-BR')}
                </p>
                <p className="text-sm text-green-600">
                  Valor inicial: {formatCurrency(currentSession.opening_amount)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(currentSession.expected_amount)}
              </p>
              <p className="text-sm text-green-600">Valor esperado</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Caixa Fechado</h3>
              <p className="text-yellow-600">
                É necessário abrir o caixa para processar pagamentos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Vendas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(todaysSummary.total_sales)}
              </p>
            </div>
          </div>
        </div>

        {/* Total de Transações */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transações</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaysSummary.total_transactions}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(todaysSummary.avg_ticket)}
              </p>
            </div>
          </div>
        </div>

        {/* Comandas Pendentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingComandas.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendas por Método de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Método de Pagamento</h3>
          <div className="space-y-4">
            {todaysSummary.by_payment_method.map((method) => {
              const Icon = method.payment_method === 'dinheiro' ? Banknote :
                          method.payment_method === 'pix' ? Smartphone : CreditCard;
              
              return (
                <div key={method.payment_method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {PAYMENT_METHOD_LABELS[method.payment_method]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(method.amount)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {method.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance por Funcionário */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Funcionário</h3>
          <div className="space-y-4">
            {todaysSummary.by_employee.map((employee) => (
              <div key={employee.employee_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {employee.employee_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {employee.transaction_count} transações
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(employee.total_sales)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Média: {formatCurrency(employee.avg_ticket)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comandas Pendentes - Versão Simplificada */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Comandas Pendentes de Pagamento</h3>
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pendingComandas.length}
          </span>
        </div>
        
        {pendingComandas.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Todas as comandas foram pagas!</p>
            <p className="text-gray-500 text-sm mt-1">Não há comandas aguardando pagamento no momento.</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Sistema de comandas será integrado após criação das tabelas.</p>
          </div>
        )}
      </div>

      {/* Pedidos de Balcão Pendentes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Pedidos de Balcão Aguardando Pagamento</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pendingBalcaoOrders.length}
          </span>
        </div>
        
        {pendingBalcaoOrders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Todos os pedidos foram pagos!</p>
            <p className="text-gray-500 text-sm mt-1">Não há pedidos de balcão aguardando pagamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBalcaoOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      #{order.order_number.toString().padStart(4, '0')}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Aguardando Pagamento
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Informações do Cliente */}
                {order.customer_name && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    {order.customer_phone && (
                      <p className="text-xs text-gray-600">{order.customer_phone}</p>
                    )}
                  </div>
                )}

                {/* Resumo dos Itens */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'itens'}
                  </p>
                  <div className="space-y-1">
                    {(order.items || []).slice(0, 3).map((item, index) => (
                      <p key={index} className="text-xs text-gray-600">
                        {item.quantity}x {item.menu_item?.name || 'Item'}
                      </p>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-xs text-gray-500 italic">
                        +{(order.items || []).length - 3} mais...
                      </p>
                    )}
                  </div>
                </div>

                {/* Observações */}
                {order.customer_notes && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded border">
                    <p className="text-xs text-yellow-800">{order.customer_notes}</p>
                  </div>
                )}

                {/* Total e Botão de Pagamento */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(order.final_amount)}
                  </span>
                  <button
                    onClick={() => handleBalcaoPayment(order)}
                    disabled={!currentSession}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Receber Pagamento
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <OpenCashModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onOpenCash={openCashSession}
      />

      {currentSession && (
        <CloseCashModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          session={currentSession}
          onCloseCash={closeCashSession}
        />
      )}

      {/* Modal de Pagamento de Pedido de Balcão */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Receber Pagamento - #{selectedOrder.order_number.toString().padStart(4, '0')}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Resumo do Pedido */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Pedido</h4>
              {selectedOrder.customer_name && (
                <p className="text-sm text-gray-600 mb-2">
                  Cliente: {selectedOrder.customer_name}
                </p>
              )}
              <div className="space-y-1 text-sm">
                {(selectedOrder.items || []).map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.menu_item?.name}</span>
                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                {(selectedOrder.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-green-600 border-t pt-1">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount || 0)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.final_amount)}</span>
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Método de pagamento"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={processing || !currentSession}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Processar e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante de Pagamento */}
      {showReceiptModal && lastPaymentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Pagamento Processado!</h3>
              </div>
              <button
                onClick={handleReceiptPrinted}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar modal de comprovante"
                aria-label="Fechar modal de comprovante"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="mb-6 text-center">
              <p className="text-gray-600 mb-2">
                Pagamento de #{lastPaymentData.order.order_number.toString().padStart(4, '0')} processado com sucesso!
              </p>
              <p className="text-sm text-green-600 font-medium">
                Comprovante de pagamento gerado
              </p>
            </div>

            <div className="mb-6">
              <PaymentReceipt
                receiptData={lastPaymentData}
                onPrint={handleReceiptPrinted}
              />
            </div>

            <div className="flex space-x-3 sticky bottom-0 bg-white pt-4 border-t">
              <button
                onClick={handleReceiptPrinted}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  // Reimprimir comprovante
                  console.log('Reimprimindo comprovante de pagamento...');
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                <span>Reimprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};