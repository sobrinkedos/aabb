import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Package, ChefHat } from 'lucide-react';
import { Order, MenuItem } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BarOrdersProps {
  orders: Order[];
  menuItems: MenuItem[];
}

const BarOrders: React.FC<BarOrdersProps> = ({ orders, menuItems }) => {
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

  const getItemTypeIcon = (itemType?: string) => {
    if (itemType === 'direct') {
      return <Package className="w-4 h-4 text-blue-600" title="Item do estoque" />;
    }
    return <ChefHat className="w-4 h-4 text-orange-600" title="Item preparado" />;
  };

  const getItemTypeLabel = (itemType?: string) => {
    return itemType === 'direct' ? 'Estoque' : 'Preparo';
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Pedidos do Bar</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum pedido pendente no bar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const priority = getOrderPriority(order);
            const estimatedTime = getEstimatedTime(order);
            
            // Separar itens por tipo
            const preparedItems = order.items.filter(item => {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
              return menuItem?.item_type !== 'direct';
            });
            
            const stockItems = order.items.filter(item => {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
              return menuItem?.item_type === 'direct';
            });

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

                {/* Itens para preparo */}
                {preparedItems.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Para Preparo</span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {preparedItems.map((item) => {
                        const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="font-medium">
                              {item.quantity}x {menuItem?.name || 'Item não encontrado'}
                            </span>
                            <span className="text-gray-600">
                              {menuItem?.preparationTime || menuItem?.preparation_time || 0}min
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Itens do estoque */}
                {stockItems.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Do Estoque</span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {stockItems.map((item) => {
                        const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="font-medium">
                              {item.quantity}x {menuItem?.name || 'Item não encontrado'}
                            </span>
                            <span className="text-blue-600 text-xs">
                              Pronto
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      Iniciar Separação
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
                  {order.status === 'ready' && (
                    <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg font-medium text-center">
                      Pronto para Entrega
                    </div>
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

export default BarOrders;