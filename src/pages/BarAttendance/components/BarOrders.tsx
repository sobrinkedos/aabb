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

  console.log('BarOrders - Pedidos recebidos:', orders.length);
  console.log('BarOrders - MenuItems recebidos:', menuItems.length);

  // Agrupar pedidos por mesa para identificar múltiplos pedidos
  const getOrdersByTable = () => {
    const tableOrders = new Map<string, Order[]>();
    orders.forEach(order => {
      const tableKey = order.tableNumber || 'Balcão';
      if (!tableOrders.has(tableKey)) {
        tableOrders.set(tableKey, []);
      }
      tableOrders.get(tableKey)!.push(order);
    });
    return tableOrders;
  };

  const tableOrdersMap = getOrdersByTable();

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

  const getOrderNumber = (order: Order): string => {
    // Extrair número do pedido do ID (últimos 4 caracteres)
    return order.id.slice(-4).toUpperCase();
  };

  const hasMultipleOrdersForTable = (tableNumber: string): boolean => {
    return (tableOrdersMap.get(tableNumber) || []).length > 1;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Pedidos do Bar</h2>
        <div className="text-sm text-gray-600">
          {Array.from(tableOrdersMap.entries()).filter(([_, orders]) => orders.length > 1).length > 0 && (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
              {Array.from(tableOrdersMap.entries()).filter(([_, orders]) => orders.length > 1).length} mesa(s) com múltiplos pedidos
            </span>
          )}
        </div>
      </div>

      {/* Resumo de mesas com múltiplos pedidos */}
      {Array.from(tableOrdersMap.entries()).filter(([_, orders]) => orders.length > 1).length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Mesas com Múltiplos Pedidos:</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(tableOrdersMap.entries())
              .filter(([_, orders]) => orders.length > 1)
              .map(([tableNumber, orders]) => (
                <span key={tableNumber} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Mesa {tableNumber}: {orders.length} pedidos
                </span>
              ))}
          </div>
        </div>
      )}
      
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

            const hasMultipleOrders = hasMultipleOrdersForTable(order.tableNumber || 'Balcão');
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 rounded-lg p-4 ${getPriorityColor(priority)} ${
                  hasMultipleOrders ? 'ring-2 ring-orange-300 ring-offset-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="font-bold text-lg">Mesa {order.tableNumber || 'N/A'}</span>
                    
                    {/* Badge do número do pedido */}
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      #{getOrderNumber(order)}
                    </span>
                    
                    {/* Indicador de múltiplos pedidos */}
                    {hasMultipleOrdersForTable(order.tableNumber || 'Balcão') && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {(tableOrdersMap.get(order.tableNumber || 'Balcão') || []).length} pedidos
                      </span>
                    )}
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