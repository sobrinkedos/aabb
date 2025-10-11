import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  target?: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status?: 'good' | 'warning' | 'critical';
}

interface PerformanceMetricsProps {
  avgServiceTime: number;
  orderCompletionRate: number;
  customerSatisfaction?: number;
  employeeEfficiency?: number;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  avgServiceTime,
  orderCompletionRate,
  customerSatisfaction = 0,
  employeeEfficiency = 0
}) => {
  const metrics: Metric[] = [
    {
      label: 'Tempo Médio de Atendimento',
      value: `${avgServiceTime.toFixed(0)} min`,
      target: '< 15 min',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      status: avgServiceTime < 15 ? 'good' : avgServiceTime < 25 ? 'warning' : 'critical'
    },
    {
      label: 'Taxa de Conclusão',
      value: `${orderCompletionRate.toFixed(1)}%`,
      target: '> 95%',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      status: orderCompletionRate > 95 ? 'good' : orderCompletionRate > 85 ? 'warning' : 'critical'
    },
    {
      label: 'Satisfação do Cliente',
      value: customerSatisfaction > 0 ? `${customerSatisfaction.toFixed(1)}%` : 'N/A',
      target: '> 90%',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      status: customerSatisfaction > 90 ? 'good' : customerSatisfaction > 75 ? 'warning' : 'critical'
    },
    {
      label: 'Eficiência Operacional',
      value: employeeEfficiency > 0 ? `${employeeEfficiency.toFixed(1)}%` : 'N/A',
      target: '> 85%',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      status: employeeEfficiency > 85 ? 'good' : employeeEfficiency > 70 ? 'warning' : 'critical'
    }
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'border-green-500 bg-green-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'critical':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'good':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Excelente
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Atenção
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Crítico
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Métricas de Performance</h3>
          <p className="text-sm text-gray-500 mt-1">Indicadores operacionais em tempo real</p>
        </div>
        <Target className="w-6 h-6 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`border-2 rounded-lg p-4 ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              {getStatusBadge(metric.status)}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                {metric.target && (
                  <p className="text-xs text-gray-500">Meta: {metric.target}</p>
                )}
              </div>
            </div>

            {/* Barra de Progresso */}
            {metric.status && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: metric.status === 'good' ? '100%' : 
                             metric.status === 'warning' ? '70%' : '40%' 
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`h-2 rounded-full ${
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Resumo Geral */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Performance Geral</p>
            <p className="text-xs text-gray-500 mt-1">
              Baseado em {metrics.length} indicadores principais
            </p>
          </div>
          <div className="text-right">
            {metrics.filter(m => m.status === 'good').length >= 3 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-lg font-bold">Ótimo</span>
              </div>
            ) : metrics.filter(m => m.status === 'critical').length >= 2 ? (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-lg font-bold">Requer Atenção</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-yellow-600">
                <Activity className="w-5 h-5" />
                <span className="text-lg font-bold">Bom</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Importações faltantes
import { AlertTriangle, Activity } from 'lucide-react';
