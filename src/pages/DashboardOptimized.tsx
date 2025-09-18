import React, { memo, useMemo } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

// Componente de estatística otimizado
const StatCard = memo(({ stat, index, onClick }: { 
  stat: any; 
  index: number; 
  onClick?: () => void; 
}) => {
  const isClickable = !!onClick;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`bg-white rounded-lg shadow-md p-6 ${
        isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
      onClick={onClick}
      whileHover={isClickable ? { scale: 1.02 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
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
});

// Componente de pedido recente otimizado
const RecentOrderItem = memo(({ order }: { order: any }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div>
      <p className="font-medium text-gray-800">
        {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}
      </p>
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
));

// Componente de alerta de estoque otimizado
const StockAlertItem = memo(({ item }: { item: any }) => (
  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
    <div>
      <p className="font-medium text-gray-800">{item.name}</p>
      <p className="text-sm text-gray-600">{item.category || 'Sem categoria'}</p>
    </div>
    <div className="text-right">
      <p className="font-medium text-red-600">{item.currentStock} {item.unit}</p>
      <p className="text-xs text-gray-500">Mín: {item.minStock}</p>
    </div>
  </div>
));

// Componente de módulo otimizado
const ModuleCard = memo(({ module }: { module: any }) => (
  <Link
    to={module.path}
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group"
  >
    <div className="flex items-center space-x-2 mb-2">
      <module.icon className={`w-5 h-5 ${module.color}`} />
      <h4 className={`font-medium text-gray-800 group-hover:${module.hoverColor} transition-colors`}>
        {module.name}
      </h4>
    </div>
    <p className="text-sm text-gray-600">{module.description}</p>
  </Link>
));

const DashboardOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { orders, inventory, notifications } = useApp();
  
  // Calcular stats de forma otimizada
  const dashboardStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = orders.filter(o => 
      o.status === 'delivered' && 
      o.updatedAt.toISOString().split('T')[0] === today
    );
    
    return {
      todayRevenue: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      todaySales: todaySales.length,
      lowStockItems: inventory.filter(item => item.currentStock <= item.minStock).length
    };
  }, [orders, inventory]);
  
  const isLoading = false; // Remover loading para melhor performance
  const { user } = useAuth();

  const isDemoUser = user?.email === 'demo@clubmanager.com';

  // Memoizar estatísticas
  const stats = useMemo(() => [
    {
      title: 'Faturamento Hoje',
      value: `R$ ${dashboardStats.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pedidos Pendentes',
      value: dashboardStats.pendingOrders,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Vendas Hoje',
      value: dashboardStats.todaySales,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Estoque Baixo',
      value: dashboardStats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ], [dashboardStats]);

  // Memoizar pedidos recentes
  const recentOrders = useMemo(() => 
    orders.slice(0, 5), 
    [orders]
  );

  // Memoizar itens de estoque baixo
  const lowStockItems = useMemo(() => 
    inventory.filter(item => item.currentStock <= item.minStock).slice(0, 5),
    [inventory]
  );

  // Memoizar módulos
  const modules = useMemo(() => [
    {
      name: 'Módulo Bar',
      description: 'Gestão completa de pedidos, comandas e vendas do bar',
      icon: Wine,
      color: 'text-blue-600',
      hoverColor: 'text-blue-600',
      path: '/bar'
    },
    {
      name: 'Gestão de Caixa',
      description: 'Controle financeiro, fechamento de caixa e relatórios',
      icon: DollarSign,
      color: 'text-green-600',
      hoverColor: 'text-green-600',
      path: '/cash'
    },
    {
      name: 'Módulo Cozinha',
      description: 'Controle de cardápio, pedidos e gestão da cozinha',
      icon: ChefHat,
      color: 'text-orange-600',
      hoverColor: 'text-orange-600',
      path: '/kitchen'
    },
    {
      name: 'Módulos Futuros',
      description: 'Quadras, Piscina, Eventos, RH e mais',
      icon: Package,
      color: 'text-gray-400',
      hoverColor: 'text-gray-500',
      path: '#'
    }
  ], []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Zap size={16} />
              <span className="text-sm font-medium">Teste todas as funcionalidades!</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Demo Banner */}
      {isDemoUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            stat={stat}
            index={index}
            onClick={stat.title === 'Estoque Baixo' ? () => navigate('/inventory/estoque-baixo') : undefined}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos Recentes</h3>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <RecentOrderItem key={order.id} order={order} />
            ))}
            {recentOrders.length === 0 && (
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

        {/* Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertas de Estoque</h3>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <StockAlertItem key={item.id} item={item} />
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-gray-500 text-center py-4">Todos os itens com estoque adequado</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Módulos Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <ModuleCard key={module.name} module={module} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default memo(DashboardOptimized);