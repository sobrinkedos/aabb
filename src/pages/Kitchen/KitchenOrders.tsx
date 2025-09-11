import React, { useState } from 'react';
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
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [tableFilter, setTableFilter] = useState<string>('all'); // Novo estado para filtro de mesa

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
      const preparationTime = (menuItem as any)?.preparation_time || (menuItem as any)?.preparationTime || 0;
      return total + preparationTime;
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

  const getOrderNumber = (order: Order): string => {
    // Extrair número do pedido do ID (últimos 4 caracteres)
    return order.id.slice(-4).toUpperCase();
  };

  // Verificar se o pedido é de balcão (já pago)
  const isBalcaoOrder = (order: Order): boolean => {
    return order.id.startsWith('balcao-');
  };

  // Verificar se o pedido é de comanda (aguardando pagamento)
  const isComandaOrder = (order: Order): boolean => {
    return order.id.startsWith('comanda-');
  };

  // Função para atualizar status com feedback visual
  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    console.log('🍳 Cozinha - Atualizando status:', {
      orderId,
      newStatus,
      isComandaOrder: isComandaOrder({ id: orderId } as Order)
    });
    
    setUpdatingOrders(prev => new Set([...prev, orderId]));
    
    try {
      await updateOrderStatus(orderId, newStatus);
      console.log(`✅ Status do pedido ${orderId} atualizado para ${newStatus}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    } finally {
      setTimeout(() => {
        setUpdatingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }, 1000);
    }
  };

  const hasMultipleOrdersForTable = (tableNumber: string): boolean => {
    return (tableOrdersMap.get(tableNumber) || []).length > 1;
  };

  // Filtrar pedidos baseado no filtro de mesa
  const filteredOrders = orders.filter(order => {
    if (tableFilter === 'all') return true;
    return (order.tableNumber || 'Balcão') === tableFilter;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Pedidos da Cozinha</h2>
          <div className="flex items-center space-x-2 mt-2">
            {Array.from(tableOrdersMap.entries()).filter(([_, orders]) => orders.length > 1).length > 0 && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                {Array.from(tableOrdersMap.entries()).filter(([_, orders]) => orders.length > 1).length} mesa(s) com múltiplos pedidos
              </span>
            )}
            {tableFilter !== 'all' && (
              <button
                onClick={() => setTableFilter('all')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
              >
                <span>Filtro: {tableFilter}</span>
                <span className="text-blue-600">✕</span>
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {filteredOrders.length} de {orders.length} pedidos
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
                <button
                  key={tableNumber}
                  onClick={() => setTableFilter(tableNumber)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors hover:shadow-md transform hover:scale-105 ${
                    tableFilter === tableNumber
                      ? 'bg-orange-400 text-white'
                      : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                  }`}
                  title={`Filtrar pedidos da ${tableNumber}`}
                >
                  Mesa {tableNumber}: {orders.length} pedidos
                </button>
              ))}
          </div>
        </div>
      )}
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {tableFilter !== 'all' 
              ? `Nenhum pedido encontrado para ${tableFilter}`
              : 'Nenhum pedido pendente na cozinha'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const priority = getOrderPriority(order);
            const estimatedTime = getEstimatedTime(order);
            // Filtrar apenas itens que precisam ser preparados na cozinha (não diretos do estoque)
            const foodItems = order.items.filter(item => {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId) || item.menuItem;
              // Só mostrar itens que são preparados (não diretos do estoque)
              return menuItem && (menuItem.item_type !== 'direct');
            });

            const hasMultipleOrders = hasMultipleOrdersForTable(order.tableNumber || 'Balcão');
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 rounded-lg p-4 ${getPriorityColor(priority)} ${
                  hasMultipleOrders ? 'ring-2 ring-orange-300 ring-offset-2' : ''
                } ${
                  isBalcaoOrder(order) ? 'border-green-400 bg-green-50 shadow-lg' : ''
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
                          {(menuItem as any)?.preparation_time || (menuItem as any)?.preparationTime || 0}min
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
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      disabled={updatingOrders.has(order.id)}
                      className={`w-full py-2 rounded-lg font-medium transition-all duration-300 ${
                        updatingOrders.has(order.id)
                          ? 'bg-blue-300 text-blue-700 cursor-not-allowed animate-pulse scale-95'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 active:scale-95'
                      }`}
                    >
                      {updatingOrders.has(order.id) ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                          <span>Iniciando...</span>
                        </div>
                      ) : (
                        'Iniciar Preparo'
                      )}
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      disabled={updatingOrders.has(order.id)}
                      className={`w-full py-2 rounded-lg font-medium transition-all duration-300 ${
                        updatingOrders.has(order.id)
                          ? 'bg-green-300 text-green-700 cursor-not-allowed animate-pulse scale-95'
                          : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-105 active:scale-95'
                      }`}
                    >
                      {updatingOrders.has(order.id) ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                          <span>Finalizando...</span>
                        </div>
                      ) : (
                        'Marcar como Pronto'
                      )}
                    </button>
                  )}
                  
                  {order.status === 'ready' && (
                    <div className="w-full py-2 rounded-lg font-medium bg-green-100 text-green-800 border-2 border-green-300 text-center animate-pulse">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span>Pronto para Entrega</span>
                      </div>
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

export default KitchenOrders;
