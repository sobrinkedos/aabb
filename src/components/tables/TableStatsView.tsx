import React from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useBarTables } from '../../hooks/useBarTables';
import { TableStatus } from '../../types/bar-attendance';

const TableStatsView: React.FC = () => {
  const { tables, loading } = useBarTables();

  const stats = React.useMemo(() => {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'available').length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const cleaning = tables.filter(t => t.status === 'cleaning').length;
    const maintenance = tables.filter(t => t.status === 'maintenance').length;
    
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
    const averageCapacity = total > 0 ? totalCapacity / total : 0;
    
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
    const availabilityRate = total > 0 ? (available / total) * 100 : 0;

    return {
      total,
      available,
      occupied,
      reserved,
      cleaning,
      maintenance,
      totalCapacity,
      averageCapacity,
      occupancyRate,
      availabilityRate
    };
  }, [tables]);

  const statusCards = [
    {
      title: 'Disponíveis',
      value: stats.available,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      percentage: stats.total > 0 ? (stats.available / stats.total) * 100 : 0
    },
    {
      title: 'Ocupadas',
      value: stats.occupied,
      icon: UserGroupIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      percentage: stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0
    },
    {
      title: 'Reservadas',
      value: stats.reserved,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      percentage: stats.total > 0 ? (stats.reserved / stats.total) * 100 : 0
    },
    {
      title: 'Limpeza',
      value: stats.cleaning,
      icon: ExclamationTriangleIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      percentage: stats.total > 0 ? (stats.cleaning / stats.total) * 100 : 0
    },
    {
      title: 'Manutenção',
      value: stats.maintenance,
      icon: ExclamationTriangleIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      percentage: stats.total > 0 ? (stats.maintenance / stats.total) * 100 : 0
    }
  ];

  const capacityDistribution = React.useMemo(() => {
    const distribution: { [key: number]: number } = {};
    
    tables.forEach(table => {
      distribution[table.capacity] = (distribution[table.capacity] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([capacity, count]) => ({
        capacity: parseInt(capacity),
        count,
        percentage: stats.total > 0 ? (count / stats.total) * 100 : 0
      }))
      .sort((a, b) => a.capacity - b.capacity);
  }, [tables, stats.total]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Resumo Geral */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Mesas</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalCapacity}</div>
              <div className="text-sm text-gray-600">Capacidade Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.averageCapacity.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Capacidade Média</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.occupancyRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Taxa de Ocupação</div>
            </div>
          </div>
        </div>

        {/* Status das Mesas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status das Mesas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statusCards.map((card, index) => {
              const Icon = card.icon;
              
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-xs text-gray-500">{card.percentage.toFixed(1)}%</p>
                    </div>
                    <div className={`p-3 rounded-full ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          card.color.includes('green') ? 'bg-green-500' :
                          card.color.includes('red') ? 'bg-red-500' :
                          card.color.includes('yellow') ? 'bg-yellow-500' :
                          card.color.includes('blue') ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${card.percentage}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por Capacidade */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Capacidade</h2>
          
          {capacityDistribution.length > 0 ? (
            <div className="space-y-4">
              {capacityDistribution.map((item, index) => (
                <motion.div
                  key={item.capacity}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {item.capacity} pessoa{item.capacity !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {item.count} mesa{item.count !== 1 ? 's' : ''}
                    </span>
                    
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma mesa cadastrada</p>
            </div>
          )}
        </div>

        {/* Métricas de Eficiência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Taxa de Disponibilidade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Disponibilidade</h3>
            
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-300"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-green-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${stats.availabilityRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.availabilityRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              {stats.available} de {stats.total} mesas disponíveis
            </p>
          </div>

          {/* Taxa de Ocupação */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Ocupação</h3>
            
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-300"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${stats.occupancyRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.occupancyRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              {stats.occupied} de {stats.total} mesas ocupadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableStatsView;