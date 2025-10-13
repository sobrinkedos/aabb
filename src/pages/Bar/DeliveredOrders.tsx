import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Search, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAllBarOrders } from '../../hooks/useAllBarOrders';
import OrderCard from './OrderCard';
import { useApp } from '../../contexts/AppContext';
import { getTodayString } from '../../utils/date-helpers';

const DeliveredOrders: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems } = useApp();
  const { orders: allOrders, loading } = useAllBarOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Filtrar apenas pedidos entregues
  const deliveredOrders = allOrders.filter(order => order.status === 'delivered');

  // Filtrar por data e busca
  const filteredOrders = deliveredOrders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    const matchesDate = orderDate === selectedDate;
    const matchesSearch = order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Calcular estatísticas do dia selecionado
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;

  const getOrderNumber = (order: any): string => {
    return order.id.slice(-4).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/bar')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedidos Entregues</h1>
            <p className="text-gray-600">Histórico de pedidos finalizados</p>
          </div>
        </div>
      </motion.div>

      {/* Filtros e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Receita do Dia</h3>
          <p className="text-3xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pedidos Entregues</h3>
          <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ticket Médio</h3>
          <p className="text-3xl font-bold text-purple-600">
            R$ {totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Calendar size={20} className="text-gray-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4">
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
            <button
              onClick={() => {
                // TODO: Implementar exportação para Excel/PDF
                alert('Funcionalidade de exportação em desenvolvimento');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download size={20} />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando pedidos...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  menuItems={menuItems}
                  hasMultipleOrders={false}
                  orderNumber={getOrderNumber(order)}
                />
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {deliveredOrders.length === 0 
                    ? 'Nenhum pedido entregue encontrado'
                    : 'Nenhum pedido entregue nesta data'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeliveredOrders;
