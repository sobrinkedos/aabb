import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Clock,
  AlertTriangle,
  Zap,
  ArrowRight,
  Wine,
  ChefHat,
  Package
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContextSimple';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, inventory, notifications } = useApp();
  const { user } = useAuth();

  // Note: Sales data is currently placeholder. This should be implemented.
  const todaySales = orders.filter(o => o.status === 'delivered' && format(o.updatedAt, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock).length;

  const isDemoUser = user?.email === 'demo@clubmanager.com';

  const stats = [
    {
      title: 'Faturamento Hoje',
      value: `R$ ${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pedidos Pendentes',
      value: pendingOrders,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Vendas Hoje',
      value: todaySales.length,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Estoque Baixo',
      value: lowStockItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Dashboard Executivo
              {isDemoUser && (
                <span className="ml-3 text-lg text-green-600 font-normal">
                  🚀 Modo Demo Ativo
                </span>
              )}
            </h1>
            <p className="text-gray-600">Visão geral das operações do clube</p>
          </div>
          {isDemoUser && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Zap size={16} />
              <span className="text-sm font-medium">Teste todas as funcionalidades!</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {isDemoUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Bem-vindo ao ClubManager Demo!</h3>
              <p className="text-gray-600 mb-4">
                Explore todos os módulos e funcionalidades do sistema. Você pode criar pedidos, gerenciar a cozinha, 
                controlar estoque e muito mais!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/bar"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <Wine className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-800">Testar Módulo Bar</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>
                <Link
                  to="/kitchen"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <ChefHat className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-800">Testar Módulo Cozinha</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const isEstoqueBaixo = stat.title === 'Estoque Baixo';
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-md p-6 ${
                isEstoqueBaixo ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
              }`}
              onClick={isEstoqueBaixo ? () => navigate('/inventory/estoque-baixo') : undefined}
              whileHover={isEstoqueBaixo ? { scale: 1.02 } : {}}
              whileTap={isEstoqueBaixo ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos Recentes</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}</p>
                  <p className="text-sm text-gray-600">
                    {format(order.createdAt, 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">R$ {order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' :
                     order.status === 'preparing' ? 'Preparando' :
                     order.status === 'ready' ? 'Pronto' : 'Entregue'}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Nenhum pedido ainda</p>
                {isDemoUser && (
                  <Link
                    to="/bar"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Criar primeiro pedido →
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertas de Estoque</h3>
          <div className="space-y-3">
            {inventory
              .filter(item => item.currentStock <= item.minStock)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-gray-500">Mín: {item.minStock}</p>
                  </div>
                </div>
              ))}
            {inventory.filter(item => item.currentStock <= item.minStock).length === 0 && (
              <p className="text-gray-500 text-center py-4">Todos os itens com estoque adequado</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Módulos Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/bar"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Wine className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">Módulo Bar</h4>
            </div>
            <p className="text-sm text-gray-600">Gestão completa de pedidos, comandas e vendas do bar</p>
          </Link>
          <Link
            to="/cash"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-800 group-hover:text-green-600 transition-colors">Gestão de Caixa</h4>
            </div>
            <p className="text-sm text-gray-600">Controle financeiro, fechamento de caixa e relatórios</p>
          </Link>
          <Link
            to="/kitchen"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2 mb-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-gray-800 group-hover:text-orange-600 transition-colors">Módulo Cozinha</h4>
            </div>
            <p className="text-sm text-gray-600">Controle de cardápio, pedidos e gestão da cozinha</p>
          </Link>
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-5 h-5 text-gray-400" />
              <h4 className="font-medium text-gray-500">Módulos Futuros</h4>
            </div>
            <p className="text-sm text-gray-400">Quadras, Piscina, Eventos, RH e mais</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
