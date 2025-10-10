import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useBarStats } from '../../hooks/useBarStats';
import { useBarMonitorRealtime } from '../../hooks/useBarMonitorRealtime';
import OrderModal from './OrderModal';
import OrderCard from './OrderCard';

const BarModule: React.FC = () => {
  const navigate = useNavigate();
  const { barOrders, menuItems, loadMenuItems, refreshBarOrders } = useApp();
  const { totalRevenue, ordersToday, pendingOrders, deliveredOrders, loading: statsLoading } = useBarStats();
  
  // Hook para atualização em tempo real
  useBarMonitorRealtime({
    onOrderUpdate: () => {
      console.log('🔔 Atualização detectada! Recarregando Monitor Bar...');
      refreshBarOrders();
    }
  });
  
  // Carregar menu items quando o componente for montado
  React.useEffect(() => {
    loadMenuItems();
  }, []); // Executar apenas uma vez ao montar o componente
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all'); // Novo estado para filtro de mesa

  // Exibir todos os pratos sem filtro por categoria
  const filteredMenuItems = menuItems;

  // Agrupar pedidos por mesa para identificar múltiplos pedidos
  const getOrdersByTable = () => {
    const tableOrders = new Map<string, typeof barOrders>();
    barOrders.forEach(order => {
      const tableKey = order.tableNumber || 'Balcão';
      if (!tableOrders.has(tableKey)) {
        tableOrders.set(tableKey, []);
      }
      tableOrders.get(tableKey)!.push(order);
    });
    return tableOrders;
  };

  const tableOrdersMap = getOrdersByTable();

  const hasMultipleOrdersForTable = (tableNumber: string): boolean => {
    return (tableOrdersMap.get(tableNumber) || []).length > 1;
  };

  const getOrderNumber = (order: any): string => {
    // Extrair número do pedido do ID (últimos 4 caracteres)
    return order.id.slice(-4).toUpperCase();
  };

  const filteredOrders = barOrders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTable = tableFilter === 'all' || (order.tableNumber || 'Balcão') === tableFilter;
    const matchesSearch = order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesTable && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Módulo Bar</h1>
          <p className="text-gray-600">Gestão completa de pedidos e vendas</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowOrderModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Pedido</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Receita Total</h3>
          {statsLoading ? (
            <p className="text-2xl font-bold text-gray-400">Carregando...</p>
          ) : (
            <p className="text-3xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pedidos Hoje</h3>
          {statsLoading ? (
            <p className="text-2xl font-bold text-gray-400">Carregando...</p>
          ) : (
            <p className="text-3xl font-bold text-blue-600">{ordersToday}</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pedidos Pendentes</h3>
          {statsLoading ? (
            <p className="text-2xl font-bold text-gray-400">Carregando...</p>
          ) : (
            <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/bar/pedidos-entregues')}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-green-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Pedidos Entregues</h3>
            <CheckCircle className="text-green-600" size={24} />
          </div>
          {statsLoading ? (
            <p className="text-2xl font-bold text-gray-400">Carregando...</p>
          ) : (
            <div>
              <p className="text-3xl font-bold text-green-600">{deliveredOrders}</p>
              <p className="text-sm text-green-700 mt-2">Clique para ver histórico</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Pedidos</h2>
            <div className="flex items-center space-x-2">
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
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Pronto</option>
            </select>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              menuItems={menuItems}
              hasMultipleOrders={hasMultipleOrdersForTable(order.tableNumber || 'Balcão')}
              orderNumber={getOrderNumber(order)}
            />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>

      {showOrderModal && (
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          menuItems={filteredMenuItems}
        />
      )}
    </div>
  );
};

export default BarModule;
