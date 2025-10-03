import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SalesChart, CategoryBreakdown, PerformanceMetrics } from '../components/Dashboard';

interface PeriodFilter {
  label: string;
  days: number;
}

const DashboardComplete: React.FC = () => {
  const { orders, inventory } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const periods: PeriodFilter[] = [
    { label: 'Hoje', days: 1 },
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
    { label: '90 dias', days: 90 }
  ];

  // Calcular todas as métricas
  const dashboardData = useMemo(() => {
    const now = new Date();
    const periodStart = startOfDay(subDays(now, selectedPeriod));
    const periodEnd = endOfDay(now);
    const previousPeriodStart = startOfDay(subDays(periodStart, selectedPeriod));
    const previousPeriodEnd = endOfDay(subDays(now, selectedPeriod));

    // Filtrar pedidos
    const currentOrders = orders.filter(o => 
      isWithinInterval(o.createdAt, { start: periodStart, end: periodEnd })
    );
    const previousOrders = orders.filter(o =>
      isWithinInterval(o.createdAt, { start: previousPeriodStart, end: previousPeriodEnd })
    );

    const completedOrders = currentOrders.filter(o => o.status === 'delivered');
    const previousCompleted = previousOrders.filter(o => o.status === 'delivered');

    // Métricas financeiras
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousCompleted.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

    const avgTicket = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
    const totalSales = completedOrders.length;

    // Vendas por dia para gráfico
    const salesByDay = new Map<string, number>();
    for (let i = selectedPeriod - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'dd/MM');
      salesByDay.set(dateStr, 0);
    }

    completedOrders.forEach(order => {
      const day = format(order.createdAt, 'dd/MM');
      if (salesByDay.has(day)) {
        salesByDay.set(day, (salesByDay.get(day) || 0) + order.total);
      }
    });

    const salesChartData = Array.from(salesByDay.entries()).map(([date, value]) => ({
      date,
      value
    }));

    // Vendas por categoria
    const categoryMap = new Map<string, number>();
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'Outros';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (item.price * item.quantity));
      });
    });

    const totalCategoryValue = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0);
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalCategoryValue > 0 ? (value / totalCategoryValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Métricas de performance
    const avgServiceTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          const diff = o.updatedAt.getTime() - o.createdAt.getTime();
          return sum + (diff / 1000 / 60);
        }, 0) / completedOrders.length
      : 0;

    const orderCompletionRate = currentOrders.length > 0
      ? (completedOrders.length / currentOrders.length) * 100
      : 0;

    // Estoque
    const lowStockItems = inventory.filter(i => i.currentStock <= i.minStock);
    const totalStockValue = inventory.reduce((sum, i) => 
      sum + (i.currentStock * (i.price || 0)), 0
    );

    return {
      revenue,
      revenueChange,
      avgTicket,
      totalSales,
      salesChartData,
      categoryData,
      avgServiceTime,
      orderCompletionRate,
      lowStockItems,
      totalStockValue,
      pendingOrders: orders.filter(o => o.status === 'pending').length
    };
  }, [orders, inventory, selectedPeriod]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    const data = {
      periodo: periods.find(p => p.days === selectedPeriod)?.label,
      faturamento: dashboardData.revenue,
      vendas: dashboardData.totalSales,
      ticketMedio: dashboardData.avgTicket,
      geradoEm: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header com Controles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard Completo
          </h1>
          <p className="text-gray-600">Gestão completa e análise de indicadores do negócio</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          {/* Botões de Ação */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Exportar dados"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </motion.div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div className={`text-sm font-medium px-2 py-1 rounded ${
              dashboardData.revenueChange > 0 ? 'bg-green-400' : 'bg-green-700'
            }`}>
              {dashboardData.revenueChange > 0 ? '+' : ''}{dashboardData.revenueChange.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Faturamento</p>
          <p className="text-3xl font-bold">R$ {dashboardData.revenue.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total de Vendas</p>
          <p className="text-3xl font-bold">{dashboardData.totalSales}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Ticket Médio</p>
          <p className="text-3xl font-bold">R$ {dashboardData.avgTicket.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Tempo Médio</p>
          <p className="text-3xl font-bold">{dashboardData.avgServiceTime.toFixed(0)} min</p>
        </motion.div>
      </div>

      {/* Alertas Importantes */}
      {(dashboardData.pendingOrders > 0 || dashboardData.lowStockItems.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">Atenção Necessária</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {dashboardData.pendingOrders > 0 && (
                  <li>• {dashboardData.pendingOrders} pedido(s) pendente(s) aguardando processamento</li>
                )}
                {dashboardData.lowStockItems.length > 0 && (
                  <li>• {dashboardData.lowStockItems.length} item(ns) com estoque baixo</li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart 
          data={dashboardData.salesChartData}
          title="Evolução de Vendas"
          color="blue"
        />
        
        <CategoryBreakdown 
          data={dashboardData.categoryData}
          title="Vendas por Categoria"
        />
      </div>

      {/* Métricas de Performance */}
      <PerformanceMetrics
        avgServiceTime={dashboardData.avgServiceTime}
        orderCompletionRate={dashboardData.orderCompletionRate}
        customerSatisfaction={0}
        employeeEfficiency={0}
      />

      {/* Resumo de Estoque */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Resumo de Estoque</h3>
            <p className="text-sm text-gray-500 mt-1">Valor total e itens críticos</p>
          </div>
          <Package className="w-6 h-6 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Valor Total em Estoque</p>
            <p className="text-2xl font-bold text-blue-600">
              R$ {dashboardData.totalStockValue.toFixed(2)}
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Itens em Estoque</p>
            <p className="text-2xl font-bold text-green-600">
              {inventory.length}
            </p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Itens em Estoque Baixo</p>
            <p className="text-2xl font-bold text-red-600">
              {dashboardData.lowStockItems.length}
            </p>
          </div>
        </div>

        {dashboardData.lowStockItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Itens Críticos</h4>
            <div className="space-y-2">
              {dashboardData.lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm text-gray-800">{item.name}</span>
                  <span className="text-sm font-medium text-red-600">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardComplete;
