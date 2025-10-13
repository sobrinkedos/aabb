/**
 * Dashboard de Estatísticas de Funcionários
 * 
 * Exibe métricas importantes sobre a equipe de funcionários
 */

import React from 'react';
import { 
  Users, UserCheck, UserX, Clock, 
  TrendingUp, TrendingDown, BarChart3, 
  Calendar, Award, AlertTriangle 
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  byShift: Record<string, number>;
  recentHires: number;
  avgTenure: number;
  topPerformers: number;
  needsAttention: number;
}

interface EmployeeStatsProps {
  stats: EmployeeStats;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
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
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center">
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({ stats }) => {
  const activePercentage = stats.total > 0 ? (stats.active / stats.total * 100).toFixed(1) : '0';
  
  // Função para obter a função mais comum
  const getMostCommonRole = () => {
    const roles = Object.entries(stats.byRole);
    if (roles.length === 0) return 'N/A';
    
    const mostCommon = roles.reduce((a, b) => a[1] > b[1] ? a : b);
    return mostCommon[0];
  };

  // Função para obter o turno mais comum
  const getMostCommonShift = () => {
    const shifts = Object.entries(stats.byShift);
    if (shifts.length === 0) return 'N/A';
    
    const mostCommon = shifts.reduce((a, b) => a[1] > b[1] ? a : b);
    return mostCommon[0];
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Funcionários"
          value={stats.total}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatCard
          title="Funcionários Ativos"
          value={stats.active}
          icon={<UserCheck className="h-6 w-6" />}
          color="green"
          subtitle={`${activePercentage}% do total`}
        />
        
        <StatCard
          title="Funcionários Inativos"
          value={stats.inactive}
          icon={<UserX className="h-6 w-6" />}
          color="red"
          subtitle={`${(100 - parseFloat(activePercentage)).toFixed(1)}% do total`}
        />
        
        <StatCard
          title="Contratações Recentes"
          value={stats.recentHires}
          icon={<Calendar className="h-6 w-6" />}
          color="purple"
          subtitle="Últimos 30 dias"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Distribuição por Função</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.byRole).map(([role, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : '0';
              return (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 capitalize">{role}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(stats.byRole).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum funcionário cadastrado
            </p>
          )}
        </div>

        {/* Shift Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Distribuição por Turno</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.byShift).map(([shift, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : '0';
              const shiftLabels: Record<string, string> = {
                'manha': 'Manhã',
                'tarde': 'Tarde',
                'noite': 'Noite',
                'qualquer': 'Qualquer'
              };
              
              return (
                <div key={shift} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{shiftLabels[shift] || shift}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(stats.byShift).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum funcionário cadastrado
            </p>
          )}
        </div>

        {/* Performance Indicators */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Indicadores</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Top Performers
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {stats.topPerformers}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Precisam Atenção
                </span>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {stats.needsAttention}
              </span>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tempo Médio na Empresa</div>
              <div className="text-lg font-bold text-gray-900">
                {stats.avgTenure} meses
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Função Mais Comum</div>
              <div className="text-lg font-bold text-blue-900 capitalize">
                {getMostCommonRole()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStats;