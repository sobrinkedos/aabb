import React from 'react';
import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  title: string;
}

const COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100' },
  { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100' },
  { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100' },
  { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100' },
  { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100' },
  { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-100' },
  { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-100' },
  { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100' }
];

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data, title }) => {
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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <PieChart className="w-5 h-5 text-gray-400" />
      </div>

      {/* Barra de Progresso Combinada */}
      <div className="mb-6">
        <div className="flex h-4 rounded-full overflow-hidden">
          {data.map((item, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <motion.div
                key={item.name}
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={color.bg}
                title={`${item.name}: ${item.percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Lista de Categorias */}
      <div className="space-y-3">
        {data.map((item, index) => {
          const color = COLORS[index % COLORS.length];
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.percentage.toFixed(1)}% do total
                  </p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-bold text-gray-800">
                  R$ {item.value.toFixed(2)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-lg font-bold text-gray-800">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
