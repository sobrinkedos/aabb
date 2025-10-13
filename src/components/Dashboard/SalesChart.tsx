import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SalesDataPoint {
  date: string;
  value: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  title: string;
  color?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({ 
  data, 
  title,
  color = 'blue' 
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-12 text-gray-500">
          Sem dados disponíveis
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  // Calcular tendência
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
  const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'neutral';
  const trendPercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  const colorClasses = {
    blue: {
      bar: 'bg-blue-600',
      gradient: 'from-blue-500 to-blue-600',
      text: 'text-blue-600'
    },
    green: {
      bar: 'bg-green-600',
      gradient: 'from-green-500 to-green-600',
      text: 'text-green-600'
    },
    purple: {
      bar: 'bg-purple-600',
      gradient: 'from-purple-500 to-purple-600',
      text: 'text-purple-600'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Média: R$ {avgValue.toFixed(2)}
          </p>
        </div>
        <div className={`flex items-center space-x-2 ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="w-5 h-5" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-5 h-5" />
          ) : null}
          <span className="text-sm font-medium">
            {trend === 'up' ? '+' : ''}{trendPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="space-y-3">
        {data.map((point, index) => {
          const percentage = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">{point.date}</span>
                <span className="text-sm font-bold text-gray-800">
                  R$ {point.value.toFixed(2)}
                </span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Máximo</p>
          <p className="text-sm font-bold text-gray-800">R$ {maxValue.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Média</p>
          <p className="text-sm font-bold text-gray-800">R$ {avgValue.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Mínimo</p>
          <p className="text-sm font-bold text-gray-800">R$ {minValue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
