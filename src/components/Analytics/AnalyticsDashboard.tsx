/**
 * Dashboard de Analytics de Funcionários
 * 
 * Visualização completa das métricas e estatísticas
 */

import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Clock, 
  AlertCircle, Download, RefreshCw, Calendar,
  PieChart, Activity, Target, Zap
} from 'lucide-react';
import { useAnalytics, useRealTimeMetrics } from '../../hooks/useAnalytics';

// ============================================================================
// INTERFACES
// ============================================================================

interface AnalyticsDashboardProps {
  className?: string;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
  subtitle
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center">
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingUp className="h-4 w-4 text-red-500 mr-1 transform rotate-180" />
          )}
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
        </div>
      )}
    </div>
  );
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, actions }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {actions}
    </div>
    {children}
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'creation' | 'performance' | 'usage'>('overview');
  
  const {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    getCreationMetrics,
    getPerformanceMetrics,
    getUsageMetrics,
    downloadReport
  } = useAnalytics({ autoRefresh: true, refreshInterval: 60000 });

  const { metrics: realtimeMetrics } = useRealTimeMetrics('creation');

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-600 mb-2">Erro ao carregar analytics</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const creationMetrics = getCreationMetrics(period);
  const performanceMetrics = getPerformanceMetrics();
  const usageMetrics = getUsageMetrics();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics de Funcionários</h1>
          <p className="text-gray-600 mt-1">
            Métricas e estatísticas do sistema de gerenciamento
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Último Dia</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>

          {/* Actions */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => downloadReport('employee-analytics', 'json')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'creation', label: 'Criação', icon: Users },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'usage', label: 'Uso do Sistema', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Funcionários"
              value={creationMetrics.totalCreated}
              icon={<Users className="h-6 w-6" />}
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
            
            <MetricCard
              title="Taxa de Sucesso"
              value={`${creationMetrics.successRate.toFixed(1)}%`}
              icon={<Target className="h-6 w-6" />}
              color="green"
              subtitle="Criações bem-sucedidas"
            />
            
            <MetricCard
              title="Tempo Médio"
              value={`${creationMetrics.averageCreationTime.toFixed(1)}s`}
              icon={<Clock className="h-6 w-6" />}
              color="yellow"
              subtitle="Tempo de criação"
            />
            
            <MetricCard
              title="Usuários Ativos"
              value={usageMetrics.activeUsers}
              icon={<Activity className="h-6 w-6" />}
              color="purple"
              subtitle="Últimas 24h"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <ChartCard title="Distribuição por Função">
              <div className="space-y-3">
                {creationMetrics.creationsByRole.map((role, index) => (
                  <div key={role.role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'][index % 5]
                      }`}></div>
                      <span className="text-sm text-gray-700 capitalize">{role.role}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{role.count}</span>
                      <span className="text-xs text-gray-500">({role.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Performance Overview */}
            <ChartCard title="Performance do Sistema">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Tempo de Resposta</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {performanceMetrics.averageResponseTime.toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">Taxa de Cache</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {performanceMetrics.cacheHitRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-800">Operações Lentas</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {performanceMetrics.slowestOperations.length}
                  </span>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === 'creation' && (
        <div className="space-y-6">
          {/* Creation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Criações por Período"
              value={creationMetrics.creationsByPeriod.length}
              icon={<Calendar className="h-6 w-6" />}
              color="blue"
            />
            
            <MetricCard
              title="Taxa de Falha"
              value={`${creationMetrics.failureRate.toFixed(1)}%`}
              icon={<AlertCircle className="h-6 w-6" />}
              color="red"
            />
            
            <MetricCard
              title="Erros de Validação"
              value={creationMetrics.validationErrors.length}
              icon={<AlertCircle className="h-6 w-6" />}
              color="yellow"
            />
          </div>

          {/* Validation Errors */}
          <ChartCard title="Erros de Validação Mais Comuns">
            <div className="space-y-3">
              {creationMetrics.validationErrors.slice(0, 5).map((error, index) => (
                <div key={`${error.field}-${error.errorType}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-medium text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{error.field}</span>
                      <p className="text-xs text-gray-500">{error.errorType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{error.count}</span>
                    <p className="text-xs text-gray-500">{error.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Tempo Médio de Resposta"
              value={`${performanceMetrics.averageResponseTime.toFixed(0)}ms`}
              icon={<Clock className="h-6 w-6" />}
              color="blue"
            />
            
            <MetricCard
              title="Taxa de Cache Hit"
              value={`${performanceMetrics.cacheHitRate.toFixed(1)}%`}
              icon={<Zap className="h-6 w-6" />}
              color="green"
            />
            
            <MetricCard
              title="Operações com Retry"
              value={performanceMetrics.retryAttempts.length}
              icon={<RefreshCw className="h-6 w-6" />}
              color="yellow"
            />
          </div>

          {/* Slowest Operations */}
          <ChartCard title="Operações Mais Lentas">
            <div className="space-y-3">
              {performanceMetrics.slowestOperations.slice(0, 5).map((op, index) => (
                <div key={op.operation} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-medium text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{op.operation}</span>
                      <p className="text-xs text-gray-500">{op.count} execuções</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{op.averageTime.toFixed(0)}ms</span>
                    <p className="text-xs text-gray-500">máx: {op.maxTime.toFixed(0)}ms</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Usuários Ativos"
              value={usageMetrics.activeUsers}
              icon={<Users className="h-6 w-6" />}
              color="blue"
            />
            
            <MetricCard
              title="Taxa de Acesso"
              value={`${usageMetrics.systemAccessRate.toFixed(1)}%`}
              icon={<Activity className="h-6 w-6" />}
              color="green"
            />
            
            <MetricCard
              title="Duração Média da Sessão"
              value={`${(usageMetrics.sessionDuration / 60).toFixed(1)}min`}
              icon={<Clock className="h-6 w-6" />}
              color="purple"
            />
          </div>

          {/* Module Usage */}
          <ChartCard title="Uso por Módulo">
            <div className="space-y-3">
              {usageMetrics.moduleUsage.map((module, index) => (
                <div key={module.module} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'][index % 5]
                    }`}></div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{module.module}</span>
                      <p className="text-xs text-gray-500">{module.uniqueUsers} usuários únicos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{module.accessCount}</span>
                    <p className="text-xs text-gray-500">{(module.averageSessionTime / 60).toFixed(1)}min avg</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;