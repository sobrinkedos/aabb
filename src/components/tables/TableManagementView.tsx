import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TableCellsIcon,
  ListBulletIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import TableLayoutManager from './TableLayoutManager';
import TableListView from './TableListView';
import TableStatsView from './TableStatsView';
import { BarTable } from '../../types/bar-attendance';

type ViewMode = 'layout' | 'list' | 'stats';

const TableManagementView: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('layout');
  const [selectedTable, setSelectedTable] = useState<BarTable | null>(null);

  const viewOptions = [
    {
      id: 'layout' as ViewMode,
      name: 'Layout Visual',
      icon: TableCellsIcon,
      description: 'Visualizar e organizar mesas no layout'
    },
    {
      id: 'list' as ViewMode,
      name: 'Lista',
      icon: ListBulletIcon,
      description: 'Visualizar mesas em formato de lista'
    },
    {
      id: 'stats' as ViewMode,
      name: 'Estatísticas',
      icon: ChartBarIcon,
      description: 'Métricas e relatórios das mesas'
    }
  ];

  const handleTableSelect = (table: BarTable) => {
    setSelectedTable(table);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'layout':
        return (
          <TableLayoutManager
            onTableSelect={handleTableSelect}
            selectedTableId={selectedTable?.id}
          />
        );
      case 'list':
        return (
          <TableListView
            onTableSelect={handleTableSelect}
            selectedTableId={selectedTable?.id}
          />
        );
      case 'stats':
        return <TableStatsView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header com navegação */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Mesas</h1>
              <p className="text-gray-600 mt-1">
                Configure e monitore as mesas do estabelecimento
              </p>
            </div>
          </div>

          {/* Navegação por abas */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {viewOptions.map((option) => {
                const Icon = option.icon;
                const isActive = currentView === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => setCurrentView(option.id)}
                    className={`relative flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{option.name}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-50 rounded-md -z-10"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Conteúdo da view atual */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {renderCurrentView()}
        </motion.div>
      </div>

      {/* Informações da mesa selecionada */}
      {selectedTable && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-white border-t p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${
                  selectedTable.status === 'available' ? 'bg-green-500' :
                  selectedTable.status === 'occupied' ? 'bg-red-500' :
                  selectedTable.status === 'reserved' ? 'bg-yellow-500' :
                  selectedTable.status === 'cleaning' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`} />
                <span className="font-medium">Mesa {selectedTable.number}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                Capacidade: {selectedTable.capacity} pessoas
              </div>
              
              {selectedTable.notes && (
                <div className="text-sm text-gray-500">
                  {selectedTable.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTable(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TableManagementView;