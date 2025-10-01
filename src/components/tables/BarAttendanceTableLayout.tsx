import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TableCellsIcon,
  ListBulletIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';
import NovaComandaModal from '../../pages/BarAttendance/components/NovaComandaModal';
import TableModal from './TableModal';
import TableContextMenu from './TableContextMenu';

interface TableWithComandaData extends BarTable {
  currentComanda?: any;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

type ViewMode = 'layout' | 'list' | 'stats';

const BarAttendanceTableLayout: React.FC = () => {
  const { tables, loading, refetch } = useBarTables();
  const [currentView, setCurrentView] = useState<ViewMode>('layout');
  const [selectedTable, setSelectedTable] = useState<BarTable | null>(null);
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<BarTable | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    table: BarTable;
    x: number;
    y: number;
  } | null>(null);

  // Por enquanto, usar as mesas diretamente sem comandas
  const tablesWithComandas = tables;

  console.log('BarAttendanceTableLayout - tables:', tables);
  console.log('BarAttendanceTableLayout - loading:', loading);

  const handleTableClick = (table: BarTable) => {
    if (table.status === 'available') {
      // Mesa disponível - abrir modal para nova comanda
      setSelectedTable(table);
      setShowNovaComandaModal(true);
    } else {
      // Mesa ocupada - mostrar detalhes (implementar depois)
      setSelectedTable(table);
    }
  };

  const handleTableRightClick = (e: React.MouseEvent, table: BarTable) => {
    e.preventDefault();
    setContextMenu({
      table,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleEditTable = (table: BarTable) => {
    setEditingTable(table);
    setShowTableModal(true);
    setContextMenu(null);
  };

  const handleCreateTable = () => {
    setEditingTable(null);
    setShowTableModal(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 border-green-600';
      case 'occupied':
        return 'bg-red-500 border-red-600';
      case 'reserved':
        return 'bg-yellow-500 border-yellow-600';
      case 'cleaning':
        return 'bg-blue-500 border-blue-600';
      case 'maintenance':
        return 'bg-gray-500 border-gray-600';
      default:
        return 'bg-gray-300 border-gray-400';
    }
  };

  const getTableStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'cleaning':
        return 'Limpeza';
      case 'maintenance':
        return 'Manutenção';
      default:
        return 'Indefinido';
    }
  };

  const getStats = () => {
    const stats = {
      total: tablesWithComandas.length,
      available: tablesWithComandas.filter(t => t.status === 'available').length,
      occupied: tablesWithComandas.filter(t => t.status === 'occupied').length,
      reserved: tablesWithComandas.filter(t => t.status === 'reserved').length,
      cleaning: tablesWithComandas.filter(t => t.status === 'cleaning').length,
      maintenance: tablesWithComandas.filter(t => t.status === 'maintenance').length
    };
    return stats;
  };

  const stats = getStats();

  const viewOptions = [
    {
      id: 'layout' as ViewMode,
      name: 'Layout Visual',
      icon: TableCellsIcon,
      description: 'Visualizar mesas no layout'
    },
    {
      id: 'list' as ViewMode,
      name: 'Lista',
      icon: ListBulletIcon,
      description: 'Visualizar em formato de lista'
    },
    {
      id: 'stats' as ViewMode,
      name: 'Estatísticas',
      icon: ChartBarIcon,
      description: 'Métricas das mesas'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Mesas e Comandas</h1>
              <p className="text-gray-600 mt-1">
                Configure e monitore as mesas do estabelecimento
              </p>
            </div>

            <button
              onClick={handleCreateTable}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nova Mesa</span>
            </button>
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
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{stats.available} disponíveis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{stats.occupied} ocupadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>{stats.reserved} reservadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>{stats.cleaning} limpeza</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>{stats.maintenance} manutenção</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da view atual */}
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-hidden"
      >
        {currentView === 'layout' && (
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
              {/* Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Mesas */}
              {tablesWithComandas.map((table) => (
                <motion.div
                  key={table.id}
                  initial={{ 
                    x: table.position_x || 100, 
                    y: table.position_y || 100 
                  }}
                  animate={{ 
                    x: table.position_x || 100, 
                    y: table.position_y || 100 
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute cursor-pointer select-none"
                  onClick={() => handleTableClick(table)}
                  onContextMenu={(e) => handleTableRightClick(e, table)}
                >
                  <div
                    className={`
                      w-24 h-24 rounded-lg border-2 shadow-lg transition-all duration-200
                      ${getTableStatusColor(table.status || 'available')}
                      hover:shadow-xl
                      ${selectedTable?.id === table.id ? 'ring-4 ring-blue-300 ring-offset-2' : ''}
                    `}
                  >
                    <div className="h-full flex flex-col items-center justify-center text-white relative">
                      {/* Número da Mesa */}
                      <div className="text-lg font-bold">{table.number}</div>
                      <div className="text-xs opacity-90">{table.capacity}p</div>
                      
                      {/* Indicador de Comanda Ativa */}
                      {table.currentComanda && (
                        <div className="absolute -top-1 -right-1 bg-white text-red-600 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-red-600">
                          {table.peopleCount || '!'}
                        </div>
                      )}
                      
                      {/* Ícone de Ação */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        {table.status === 'available' ? (
                          <div className="bg-green-600 text-white rounded-full p-1">
                            <PlusIcon className="h-3 w-3" />
                          </div>
                        ) : table.status === 'occupied' ? (
                          <div className="bg-red-600 text-white rounded-full p-1">
                            <EyeIcon className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="bg-gray-600 text-white rounded-full p-1">
                            <PencilIcon className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>



                  {/* Status Label */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm border">
                      {getTableStatusText(table.status || 'available')}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Empty State */}
              {tablesWithComandas.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma mesa configurada
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Configure as mesas para começar a gerenciar comandas
                    </p>
                    <button
                      onClick={handleCreateTable}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 inline mr-1" />
                      Criar Mesa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tablesWithComandas.map((table) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                    selectedTable?.id === table.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleTableClick(table)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        table.status === 'available' ? 'bg-green-500' :
                        table.status === 'occupied' ? 'bg-red-500' :
                        table.status === 'reserved' ? 'bg-yellow-500' :
                        table.status === 'cleaning' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                      <h3 className="text-lg font-medium text-gray-900">Mesa {table.number}</h3>
                    </div>
                    

                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Capacidade: {table.capacity} pessoas</div>
                    <div>Status: {getTableStatusText(table.status || 'available')}</div>

                    
                    {table.notes && (
                      <div className="text-gray-500 italic">{table.notes}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'stats' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Resumo Geral */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.available}</div>
                    <div className="text-sm text-gray-600">Disponíveis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{stats.occupied}</div>
                    <div className="text-sm text-gray-600">Ocupadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{stats.reserved}</div>
                    <div className="text-sm text-gray-600">Reservadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600">{stats.cleaning + stats.maintenance}</div>
                    <div className="text-sm text-gray-600">Manutenção</div>
                  </div>
                </div>
              </div>

              {/* Taxa de Ocupação */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Ocupação</h3>
                
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-300"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-red-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-sm text-gray-600 mt-4">
                  {stats.occupied} de {stats.total} mesas ocupadas
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Informações da mesa selecionada */}
      {selectedTable && !showNovaComandaModal && (
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

      {/* Modal de Nova Comanda */}
      <NovaComandaModal
        isOpen={showNovaComandaModal}
        onClose={() => {
          setShowNovaComandaModal(false);
          setSelectedTable(null);
        }}
        selectedTable={selectedTable}
        onComandaCreated={() => {
          setShowNovaComandaModal(false);
          setSelectedTable(null);
          refetch();
        }}
      />

      {/* Modal de Mesa */}
      <TableModal
        isOpen={showTableModal}
        onClose={() => {
          setShowTableModal(false);
          setEditingTable(null);
        }}
        table={editingTable}
      />

      {/* Context Menu */}
      {contextMenu && (
        <TableContextMenu
          table={contextMenu.table}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onEdit={() => handleEditTable(contextMenu.table)}
        />
      )}
    </div>
  );
};

export default BarAttendanceTableLayout;