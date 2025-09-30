import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';
import { useComandas } from '../../hooks/useComandas';
import TableLayoutManager from './TableLayoutManager';
import NovaComandaModal from '../../pages/BarAttendance/components/NovaComandaModal';
import { formatCurrency } from '../../types/cash-management';
import { calculateAutoPosition } from '../../utils/table-layout';

interface TableWithComandaData extends BarTable {
  currentComanda?: any;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

const TableWithComandaIntegration: React.FC = () => {
  const { tables, loading } = useBarTables();
  const { comandas } = useComandas();
  const [selectedTable, setSelectedTable] = useState<BarTable | null>(null);
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);
  const [tablesWithComandas, setTablesWithComandas] = useState<TableWithComandaData[]>([]);

  // Combinar dados das mesas com comandas
  useEffect(() => {
    const enrichedTables: TableWithComandaData[] = tables.map(table => {
      const comanda = comandas.find(c => c.table_id === table.id && c.status === 'open');
      
      // Atualizar status da mesa baseado na comanda
      const updatedStatus = comanda ? 'occupied' : table.status;
      
      return {
        ...table,
        status: updatedStatus as TableStatus,
        currentComanda: comanda,
        occupiedSince: comanda?.opened_at,
        currentTotal: comanda?.total || 0,
        peopleCount: comanda?.people_count || undefined
      };
    });
    
    setTablesWithComandas(enrichedTables);
  }, [tables, comandas]);

  const handleTableSelect = (table: BarTable) => {
    const enrichedTable = tablesWithComandas.find(t => t.id === table.id);
    
    if (enrichedTable?.status === 'available') {
      // Mesa disponível - abrir modal para nova comanda
      setSelectedTable(table);
      setShowNovaComandaModal(true);
    } else {
      // Mesa ocupada - mostrar detalhes (implementar depois)
      setSelectedTable(table);
    }
  };

  const handleCloseModal = () => {
    setShowNovaComandaModal(false);
    setSelectedTable(null);
  };

  const getTableStatusInfo = (table: TableWithComandaData) => {
    switch (table.status) {
      case 'available':
        return {
          color: 'bg-green-500 border-green-600',
          textColor: 'text-green-800',
          bgColor: 'bg-green-50',
          label: 'Disponível',
          action: 'Clique para abrir comanda'
        };
      case 'occupied':
        return {
          color: 'bg-red-500 border-red-600',
          textColor: 'text-red-800',
          bgColor: 'bg-red-50',
          label: 'Ocupada',
          action: 'Clique para ver detalhes'
        };
      case 'reserved':
        return {
          color: 'bg-yellow-500 border-yellow-600',
          textColor: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          label: 'Reservada',
          action: 'Clique para gerenciar'
        };
      case 'cleaning':
        return {
          color: 'bg-blue-500 border-blue-600',
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50',
          label: 'Limpeza',
          action: 'Em limpeza'
        };
      case 'maintenance':
        return {
          color: 'bg-gray-500 border-gray-600',
          textColor: 'text-gray-800',
          bgColor: 'bg-gray-50',
          label: 'Manutenção',
          action: 'Em manutenção'
        };
      default:
        return {
          color: 'bg-gray-300 border-gray-400',
          textColor: 'text-gray-800',
          bgColor: 'bg-gray-50',
          label: 'Indefinido',
          action: 'Status indefinido'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com estatísticas */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestão de Mesas e Comandas</h2>
            <p className="text-gray-600">
              {tablesWithComandas.length} mesas configuradas
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{tablesWithComandas.filter(t => t.status === 'available').length} disponíveis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{tablesWithComandas.filter(t => t.status === 'occupied').length} ocupadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>{tablesWithComandas.filter(t => t.status === 'reserved').length} reservadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout das Mesas */}
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
          {tablesWithComandas.map((table) => {
            const statusInfo = getTableStatusInfo(table);
            
            // Calcular posição padrão se não estiver definida
            const tableIndex = tablesWithComandas.findIndex(t => t.id === table.id);
            const defaultPos = calculateAutoPosition(tableIndex);
            const posX = table.position_x ?? defaultPos.x;
            const posY = table.position_y ?? defaultPos.y;

            return (
              <motion.div
                key={table.id}
                initial={{ 
                  x: posX, 
                  y: posY 
                }}
                animate={{ 
                  x: posX, 
                  y: posY 
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute cursor-pointer select-none"
                onClick={() => handleTableSelect(table)}
              >
                <div
                  className={`
                    w-24 h-24 rounded-lg border-2 shadow-lg transition-all duration-200
                    ${statusInfo.color}
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

                {/* Informações da Comanda */}
                {table.currentComanda && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32">
                    <div className="bg-white rounded-lg shadow-lg border p-2 text-center">
                      <div className="text-xs font-medium text-gray-900">
                        {table.currentComanda.customer_name || 'Cliente'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {table.peopleCount} pessoa{table.peopleCount !== 1 ? 's' : ''}
                      </div>
                      {table.currentTotal > 0 && (
                        <div className="text-xs font-bold text-green-600">
                          {formatCurrency(table.currentTotal)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className={`px-2 py-1 rounded text-xs font-medium shadow-sm border ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                    {statusInfo.label}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Empty State */}
          {tablesWithComandas.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma mesa configurada
                </h3>
                <p className="text-gray-500 mb-4">
                  Configure as mesas para começar a gerenciar comandas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
        onClose={handleCloseModal}
        selectedTable={selectedTable}
        onComandaCreated={() => {
          handleCloseModal();
          // Aqui você pode adicionar lógica para atualizar os dados
        }}
      />
    </div>
  );
};

export default TableWithComandaIntegration;