import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, MapPin } from 'lucide-react';
import { Order, MenuItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  menuItems: MenuItem[];
  hasMultipleOrders?: boolean;
  orderNumber?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  menuItems, 
  hasMultipleOrders = false,
  orderNumber
}) => {
  const { updateOrderStatus } = useApp();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      default: return null;
    }
  };

  const nextStatus = getNextStatus(order.status);

  // Verificar se o pedido é de balcão (já pago)
  const isBalcaoOrder = (order: Order): boolean => {
    return order.id.startsWith('balcao-');
  };

  // Verificar se o pedido é de comanda (aguardando pagamento)
  const isComandaOrder = (order: Order): boolean => {
    return order.id.startsWith('comanda-');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
        hasMultipleOrders ? 'ring-2 ring-orange-300 ring-offset-2' : ''
      } ${
        isBalcaoOrder(order) ? 'border-green-400 bg-green-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-gray-400" />
          <span className="font-medium text-gray-800">
            {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}
          </span>
          
          {/* Badge do número do pedido */}
          {orderNumber && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              #{orderNumber}
            </span>
          )}
          
          {/* Indicador de status de pagamento */}
          {isBalcaoOrder(order) && (
            <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              ✓ PAGO
            </span>
          )}
          
          {isComandaOrder(order) && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              AGUARDA PAGTO
            </span>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          return (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {menuItem?.name}
              </span>
              <span className="text-gray-800">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {order.notes && (
        <div className="mb-4 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-800">{order.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span>{format(order.createdAt, 'HH:mm', { locale: ptBR })}</span>
        </div>
        <span className="font-medium text-gray-800">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      {/* Botão de Ação Principal */}
      {nextStatus && (
        <button
          onClick={() => updateOrderStatus(order.id, nextStatus)}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            isBalcaoOrder(order)
              ? order.status === 'pending'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : order.status === 'preparing'
                ? 'bg-green-700 text-white hover:bg-green-800'
                : 'bg-green-800 text-white hover:bg-green-900'
              : isComandaOrder(order)
              ? order.status === 'pending'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : order.status === 'preparing'
                ? 'bg-yellow-700 text-white hover:bg-yellow-800'
                : 'bg-yellow-800 text-white hover:bg-yellow-900'
              : order.status === 'pending'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : order.status === 'preparing'
              ? 'bg-blue-700 text-white hover:bg-blue-800'
              : 'bg-blue-800 text-white hover:bg-blue-900'
          }`}
        >
          {nextStatus === 'preparing' && 'Iniciar Preparo'}
          {nextStatus === 'ready' && 'Marcar como Pronto'}
          {nextStatus === 'delivered' && 'Marcar como Entregue'}
        </button>
      )}
    </motion.div>
  );
};

export default OrderCard;
