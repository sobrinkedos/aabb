import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Package,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Award,
  Activity
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// Tipos
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface PeriodFilter {
  label: string;
  days: number;
}

const DashboardAdvanced: React.FC = () => {
  const { orders, inventory } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);

  const periods: PeriodFilter[] = [
    { label: 'Hoje', days: 1 },
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
    { label: '90 dias', days: 90 }
  ];

  // Calcular métricas avançadas
  const metrics = useMemo(() => {
    const now = new Date();
    const periodStart = startOfDay(subDays(now, selectedPeriod));
    const periodEnd = endOfDay(now);
    const previousPeriodStart = startOfDay(subDays(periodStart, selectedPeriod));
    const previousPeriodEnd = endOfDay(subDays(now, selectedPeriod));

    // Pedidos do período atual
    const currentPeriodOrders = orders.filter(o => 
      isWithinInterval(o.createdAt, { start: periodStart, end: periodEnd })
    );

    // Pedidos do período anterior (para comparação)
    const previousPeriodOrders = orders.filter(o =>
      isWithinInterval(o.createdAt, { start: previousPeriodStart, end: previousPeriodEnd })
    );

    // Pedidos finalizados
    const completedOrders = currentPeriodOrders.filter(o => o.status === 'delivered');
    const previousCompletedOrders = previousPeriodOrders.filter(o => o.status === 'delivered');

    // Faturamento
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousCompletedOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = previousRevenue > 0 
      ? ((revenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Ticket médio
    const avgTicket = completedOrders.length > 0 
      ? revenue / completedOrders.length 
      : 0;
    const previousAvgTicket = previousCompletedOrders.length > 0
      ? previousRevenue / previousCompletedOrders.length
      : 0;
    const avgTicketChange = previousAvgTicket > 0
      ? ((avgTicket - previousAvgTicket) / previousAvgTicket) * 100
      : 0;

    // Total de vendas
    const totalSales = completedOrders.length;
    const previousTotalSales = previousCompletedOrders.length;
    const salesChange = previousTotalSales > 0
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100
      : 0;

    // Pedidos pendentes
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    // Estoque
    const lowStockItems = inventory.filter(i => i.currentStock <= i.minStock).length;
    const totalStockValue = inventory.reduce((sum, i) => 
      sum + (i.currentStock * (i.price || 0)), 0
    );

    // Produtos mais vendidos
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productSales.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        productSales.set(item.name, {
          name: item.name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity)
        });
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Vendas por dia
    const salesByDay = new Map<string, number>();
    completedOrders.forEach(order => {
      const day = format(order.createdAt, 'dd/MM');
      salesByDay.set(day, (salesByDay.get(day) || 0) + order.total);
    });

    // Tempo médio de atendimento (em minutos)
    const avgServiceTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          const diff = o.updatedAt.getTime() - o.createdAt.getTime();
          return sum + (diff / 1000 / 60);
        }, 0) / completedOrders.length
      : 0;

    return {
      revenue,
      revenueChange,
      avgTicket,
      avgTicketChange,
      totalSales,
      salesChange,
      pendingOrders,
      lowStockItems,
      totalStockValue,
      topProducts,
      salesByDay: Array.from(salesByDay.entries()).slice(-7),
      avgServiceTime,
      completedOrders
    };
  }, [orders, inventory, selectedPeriod]);

  // Componente de Card de Métrica
  const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color, 
    bgColor,
    trend 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change > 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : change < 0 ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : null}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard de Gestão
          </h1>
          <p className="text-gray-600">Análise completa do desempenho do negócio</p>
        </div>

        {/* Filtro de Período */}
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-md p-1">
          {periods.map((period) => (
            <button
              key={period.days}
              onClick={() => setSelectedPeriod(period.days)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.days
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Faturamento"
          value={`R$ ${metrics.revenue.toFixed(2)}`}
          change={metrics.revenueChange}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <MetricCard
          title="Ticket Médio"
          value={`R$ ${metrics.avgTicket.toFixed(2)}`}
          change={metrics.avgTicketChange}
          icon={Target}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Total de Vendas"
          value={metrics.totalSales}
          change={metrics.salesChange}
          icon={ShoppingCart}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <MetricCard
          title="Tempo Médio"
          value={`${metrics.avgServiceTime.toFixed(0)} min`}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Pedidos Pendentes"
          value={metrics.pendingOrders}
          icon={Activity}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <MetricCard
          title="Itens em Estoque Baixo"
          value={metrics.lowStockItems}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <MetricCard
          title="Valor em Estoque"
          value={`R$ ${metrics.totalStockValue.toFixed(2)}`}
          icon={Package}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Dia */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Vendas por Dia</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {metrics.salesByDay.length > 0 ? (
              metrics.salesByDay.map(([day, value]) => {
                const maxValue = Math.max(...metrics.salesByDay.map(([, v]) => v));
                const percentage = (value / maxValue) * 100;
                return (
                  <div key={day}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">{day}</span>
                      <span className="text-sm font-bold text-gray-800">
                        R$ {value.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-blue-600 h-2 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-8">Sem dados para o período</p>
            )}
          </div>
        </motion.div>

        {/* Produtos Mais Vendidos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top 5 Produtos</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {metrics.topProducts.length > 0 ? (
              metrics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.quantity} unidades
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      R$ {product.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Sem vendas no período</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pedidos Recentes e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Pedidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Últimos Pedidos</h3>
            <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {metrics.completedOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">
                    {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">R$ {order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{order.items.length} itens</p>
                </div>
              </div>
            ))}
            {metrics.completedOrders.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum pedido finalizado</p>
            )}
          </div>
        </motion.div>

        {/* Alertas de Estoque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Alertas de Estoque</h3>
            <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Gerenciar
            </Link>
          </div>
          <div className="space-y-3">
            {inventory
              .filter(item => item.currentStock <= item.minStock)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.category || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-gray-500">Mín: {item.minStock}</p>
                  </div>
                </div>
              ))}
            {inventory.filter(item => item.currentStock <= item.minStock).length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-600">Todos os itens com estoque adequado!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Insights e Recomendações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border border-blue-200"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600 rounded-full">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Insights do Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Crescimento</p>
                <p className={`text-xl font-bold ${
                  metrics.revenueChange > 0 ? 'text-green-600' : 
                  metrics.revenueChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metrics.revenueChange > 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">vs período anterior</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Eficiência</p>
                <p className="text-xl font-bold text-blue-600">
                  {metrics.avgServiceTime.toFixed(0)} min
                </p>
                <p className="text-xs text-gray-500 mt-1">tempo médio de atendimento</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Produtos Ativos</p>
                <p className="text-xl font-bold text-purple-600">
                  {metrics.topProducts.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">produtos vendidos</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardAdvanced;
