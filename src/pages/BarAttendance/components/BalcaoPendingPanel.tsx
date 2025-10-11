import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useBalcaoOrders } from '../../../hooks/useBalcaoOrders';
import { useCashManagement } from '../../../hooks/useCashManagementSimple';
import {
  BalcaoOrderWithDetails,
  BalcaoOrderStatus,
  PaymentMethod,
  BALCAO_ORDER_STATUS_LABELS,
  BALCAO_ORDER_STATUS_COLORS,
  formatOrderNumber
} from '../../../types/balcao-orders';
import { formatCurrency } from '../../../types/cash-management';

const BalcaoPendingPanel: React.FC = () => {
  const { 
    pendingOrders, 
    preparingOrders, 
    readyOrders, 
    updateOrderStatus, 
    processPayment,
    loading,
    refreshData 
  } = useBalcaoOrders();
  
  const { currentSession, refreshData: refreshCashData } = useCashManagement();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BalcaoOrderWithDetails | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Processar pagamento do pedido
  const handleProcessPayment = async () => {
    if (!selectedOrder || !currentSession) return;

    setProcessing(true);
    try {
      await processPayment({
        order_id: selectedOrder.id,
        payment_method: selectedPaymentMethod,
        cash_session_id: currentSession.id,
        amount_paid: selectedOrder.final_amount
      });

      // Forçar múltiplas atualizações para garantir sincronização
      console.log('🔄 Forçando atualização dos dados após pagamento...');
      await Promise.all([
        refreshData(),
        refreshCashData()
      ]);
      
      // Atualização adicional com delay
      setTimeout(async () => {
        console.log('🔄 Segunda atualização dos dados...');
        await Promise.all([
          refreshData(),
          refreshCashData()
        ]);
      }, 1000);
      
      // Terceira atualização como backup
      setTimeout(async () => {
        console.log('🔄 Terceira atualização dos dados...');
        await Promise.all([
          refreshData(),
          refreshCashData()
        ]);
      }, 2000);
      
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Marcar pedido como pronto
  const handleMarkReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { status: 'ready' });
    } catch (error) {
      console.error('Erro ao marcar como pronto:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  // Marcar pedido como entregue
  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { status: 'delivered' });
    } catch (error) {
      console.error('Erro ao marcar como entregue:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  // Componente de card de pedido
  const OrderCard: React.FC<{ order: BalcaoOrderWithDetails }> = ({ order }) => {
    const statusColor = BALCAO_ORDER_STATUS_COLORS[order.status];
    const statusLabel = BALCAO_ORDER_STATUS_LABELS[order.status];

    const getTimeElapsed = () => {
      const created = new Date(order.created_at);
      const now = new Date();
      const minutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
      return minutes;
    };

    const minutes = getTimeElapsed();
    const isOverdue = minutes > 15; // Considera atrasado após 15 minutos

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
          isOverdue ? 'border-red-500' : order.status === 'ready' ? 'border-green-500' : 'border-blue-500'
        }`}
      >
        {/* Header do Pedido */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-gray-900">
              {formatOrderNumber(order.order_number)}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {minutes}min
            </span>
          </div>
        </div>

        {/* Informações do Cliente */}
        {(order.customer_name || order.customer_phone) && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2 text-sm">
              {order.customer_name && (
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span>{order.customer_name}</span>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center space-x-1">
                  <PhoneIcon className="h-4 w-4 text-gray-500" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Itens do Pedido */}
        <div className="space-y-2 mb-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.menu_item?.name || 'Item'}
                {item.notes && (
                  <span className="text-gray-500 italic"> - {item.notes}</span>
                )}
              </span>
              <span className="font-medium">{formatCurrency(item.total_price)}</span>
            </div>
          ))}
        </div>

        {/* Observações */}
        {(order.customer_notes || order.notes) && (
          <div className="mb-3 p-2 bg-yellow-50 rounded">
            {order.customer_notes && (
              <div className="flex items-start space-x-2 text-sm">
                <ChatBubbleLeftIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <span className="text-yellow-800">{order.customer_notes}</span>
              </div>
            )}
            {order.notes && (
              <div className="text-xs text-gray-600 mt-1">
                Obs. interna: {order.notes}
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center mb-3 pt-2 border-t">
          <span className="font-medium text-gray-900">Total:</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(order.final_amount)}
          </span>
        </div>

        {/* Ações */}
        <div className="flex space-x-2">
          {order.status === 'pending_payment' && (
            <button
              onClick={() => {
                setSelectedOrder(order);
                setShowPaymentModal(true);
              }}
              disabled={!currentSession}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Receber Pagamento
            </button>
          )}
          
          {order.status === 'preparing' && (
            <button
              onClick={() => handleMarkReady(order.id)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm font-medium"
            >
              Marcar como Pronto
            </button>
          )}
          
          {order.status === 'ready' && (
            <button
              onClick={() => handleMarkDelivered(order.id)}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm font-medium"
            >
              Entregar ao Cliente
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos de Balcão</h2>
        <div className="flex items-center space-x-4">
          {/* Status do Caixa */}
          {currentSession ? (
            <div className="bg-green-100 px-3 py-1 rounded-lg">
              <span className="text-green-800 text-sm font-medium">Caixa Aberto</span>
            </div>
          ) : (
            <div className="bg-red-100 px-3 py-1 rounded-lg">
              <span className="text-red-800 text-sm font-medium">Caixa Fechado</span>
            </div>
          )}
          
          <button
            onClick={async () => {
              setRefreshing(true);
              try {
                console.log('🔄 Atualizando pedidos manualmente...');
                await refreshData();
                console.log('✅ Pedidos atualizados!');
              } catch (error) {
                console.error('❌ Erro ao atualizar:', error);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 text-sm font-medium">Aguardando Pagamento</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 text-sm font-medium">Preparando</p>
              <p className="text-2xl font-bold text-blue-900">{preparingOrders.length}</p>
            </div>
            <ArrowPathIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-medium">Prontos</p>
              <p className="text-2xl font-bold text-green-900">{readyOrders.length}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-6">
        {/* Pedidos Aguardando Pagamento */}
        {pendingOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Aguardando Pagamento ({pendingOrders.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Pedidos Preparando */}
        {preparingOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preparando ({preparingOrders.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preparingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Pedidos Prontos */}
        {readyOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prontos para Entrega ({readyOrders.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há pedidos */}
        {pendingOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido pendente</h3>
            <p className="text-gray-600">Todos os pedidos foram processados e entregues.</p>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Receber Pagamento - {formatOrderNumber(selectedOrder.order_number)}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Resumo do Pedido */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Pedido</h4>
              <div className="space-y-1 text-sm">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.menu_item?.name}</span>
                    <span>{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
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
                {processing ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalcaoPendingPanel;