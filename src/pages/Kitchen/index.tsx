import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useKitchenMonitorRealtime } from '../../hooks/useKitchenMonitorRealtime';
import MenuManagement from './MenuManagement';
import KitchenOrders from './KitchenOrders';

const KitchenModule: React.FC = () => {
  const { kitchenOrders, menuItems, refreshKitchenOrders } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  // Hook para atualização em tempo real
  useKitchenMonitorRealtime({
    onOrderUpdate: () => {
      console.log('🔔 Atualização detectada! Recarregando Monitor Cozinha...');
      refreshKitchenOrders();
    }
  });

  // Carregar pedidos iniciais quando o componente for montado
  React.useEffect(() => {
    console.log('🚀 Monitor Cozinha montado - carregando dados iniciais...');
    refreshKitchenOrders();
  }, []);

  const pendingKitchenOrders = kitchenOrders.filter(order => 
    order.status === 'pending' || order.status === 'preparing'
  );

  const preparedMenuItems = menuItems.filter(item => item.item_type !== 'direct');
  
  const averagePreparationTime = preparedMenuItems
    .filter(item => item.preparationTime)
    .reduce((avg, item) => avg + (item.preparationTime || 0), 0) / 
    preparedMenuItems.filter(item => item.preparationTime).length || 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Módulo Cozinha</h1>
          <p className="text-gray-600">Gestão completa da cozinha e cardápio</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'menu'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cardápio
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Pedidos Pendentes</h3>
              <p className="text-3xl font-bold text-orange-600">{pendingKitchenOrders.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Tempo Médio</h3>
              <p className="text-3xl font-bold text-blue-600">{averagePreparationTime.toFixed(0)}min</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Pratos Disponíveis</h3>
              <p className="text-3xl font-bold text-green-600">
                {preparedMenuItems.filter(item => item.available).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {activeTab === 'orders' ? (
          <KitchenOrders orders={pendingKitchenOrders} menuItems={preparedMenuItems} />
        ) : (
          <MenuManagement menuItems={preparedMenuItems} />
        )}
      </div>
    </div>
  );
};

export default KitchenModule;
