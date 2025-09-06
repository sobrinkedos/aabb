import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, User } from 'lucide-react';
import { Order, MenuItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KitchenOrdersProps {
  orders: Order[];
  menuItems: MenuItem[];
}

const KitchenOrders: React.FC<KitchenOrdersProps> = ({ orders, menuItems }) => {
  const { updateOrderStatus } = useApp();



  const getEstimatedTime = (order: Order): number => {
    return order.items.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
      return total + (menuItem?.preparationTime || menuItem?.preparation_time || 0);
    }, 0);
  };

  const getOrderPriority = (order: Order): 'high' | 'medium' | 'low' => {
    const minutesWaiting = (new Date().getTime() - order.createdAt.getTime()) / (1000 * 60);
    if (minutesWaiting > 20) return 'high';
    if (minutesWaiting > 10) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-green-400 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Pedidos da Cozinha</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum pedido pendente na cozinha</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const priority = getOrderPriority(order);
            const estimatedTime = getEstimatedTime(order);
            // Exibir todos os itens do pedido, já que agora temos dados diretos
            const foodItems = order.items;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 rounded-lg p-4 ${getPriorityColor(priority)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="font-bold text-lg">Mesa {order.tableNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>{format(order.createdAt, 'HH:mm', { locale: ptBR })}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {foodItems.map((item) => {
                    // Tentar encontrar no menuItems do contexto primeiro, depois usar dados diretos do item
                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
                    return (
                      <div key={item.id} className="flex justify-between">
                        <span className="font-medium">
                          {item.quantity}x {menuItem?.name || 'Item não encontrado'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {menuItem?.preparationTime || menuItem?.preparation_time || 0}min
                        </span>
                      </div>
                    );
                  })}
                </div>

                {order.notes && (
                  <div className="mb-4 p-2 bg-yellow-100 rounded border">
                    <p className="text-sm text-yellow-800">{order.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    Tempo estimado: {estimatedTime}min
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    priority === 'high' ? 'bg-red-200 text-red-800' :
                    priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {priority === 'high' ? 'Urgente' :
                     priority === 'medium' ? 'Médio' : 'Normal'}
                  </span>
                </div>

                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Iniciar Preparo
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Marcar como Pronto
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenOrders;
