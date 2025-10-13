import React from 'react';
import { TableStatus } from '../../../types';

interface MesasLegendProps {
  stats: {
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    maintenance: number;
  };
  compact?: boolean;
}

const MesasLegend: React.FC<MesasLegendProps> = ({ stats, compact = false }) => {
  const legendItems = [
    {
      status: 'available' as TableStatus,
      color: 'bg-green-500',
      label: 'Disponível',
      description: 'Clique para abrir comanda',
      count: stats.available
    },
    {
      status: 'occupied' as TableStatus,
      color: 'bg-red-500',
      label: 'Ocupada',
      description: 'Clique para ver detalhes',
      count: stats.occupied
    },
    {
      status: 'reserved' as TableStatus,
      color: 'bg-yellow-500',
      label: 'Reservada',
      description: 'Mesa reservada',
      count: stats.reserved
    },
    {
      status: 'cleaning' as TableStatus,
      color: 'bg-gray-500',
      label: 'Limpeza',
      description: 'Mesa em limpeza',
      count: stats.cleaning
    },
    {
      status: 'maintenance' as TableStatus,
      color: 'bg-orange-500',
      label: 'Manutenção',
      description: 'Mesa em manutenção',
      count: stats.maintenance
    }
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        {legendItems.map(item => (
          <div key={item.status} className="flex items-center space-x-2">
            <div className={`w-3 h-3 ${item.color} rounded`}></div>
            <span className="text-gray-700">
              {item.label} ({item.count})
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3 text-center">
        Legenda do Status das Mesas
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {legendItems.map(item => (
          <div key={item.status} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`w-6 h-6 ${item.color} rounded-lg shadow-sm`}></div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-600 mt-1">{item.description}</div>
              <div className="text-lg font-bold text-gray-800 mt-1">
                {item.count}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-600">
          <strong>Dica:</strong> Arraste as mesas para reposicioná-las no layout do salão
        </p>
      </div>
    </div>
  );
};

export default MesasLegend;