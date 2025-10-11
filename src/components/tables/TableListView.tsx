import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';
import TableModal from './TableModal';

interface TableListViewProps {
  onTableSelect?: (table: BarTable) => void;
  selectedTableId?: string;
}

const TableListView: React.FC<TableListViewProps> = ({
  onTableSelect,
  selectedTableId
}) => {
  const { tables, loading, deleteTable } = useBarTables();
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<BarTable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'number' | 'capacity' | 'status'>('number');

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'occupied':
        return <UserGroupIcon className="h-5 w-5 text-red-500" />;
      case 'reserved':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cleaning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
      case 'maintenance':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: TableStatus) => {
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

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedTables = React.useMemo(() => {
    let filtered = tables;

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(table =>
        table.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(table => table.status === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return a.number.localeCompare(b.number, undefined, { numeric: true });
        case 'capacity':
          return b.capacity - a.capacity;
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [tables, searchTerm, statusFilter, sortBy]);

  const handleEdit = (table: BarTable) => {
    setEditingTable(table);
    setShowModal(true);
  };

  const handleDelete = async (table: BarTable) => {
    if (!confirm(`Tem certeza que deseja excluir a mesa ${table.number}?`)) return;

    try {
      await deleteTable(table.id);
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      alert('Erro ao excluir mesa. Tente novamente.');
    }
  };

  const handleCreate = () => {
    setEditingTable(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Filtros e Controles */}
      <div className="border-b p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar mesas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TableStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="available">Disponível</option>
              <option value="occupied">Ocupada</option>
              <option value="reserved">Reservada</option>
              <option value="cleaning">Limpeza</option>
              <option value="maintenance">Manutenção</option>
            </select>

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'number' | 'capacity' | 'status')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="number">Ordenar por Número</option>
              <option value="capacity">Ordenar por Capacidade</option>
              <option value="status">Ordenar por Status</option>
            </select>
          </div>

          {/* Botão Criar */}
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nova Mesa</span>
          </button>
        </div>
      </div>

      {/* Lista de Mesas */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedTables.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Nenhuma mesa encontrada' : 'Nenhuma mesa cadastrada'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie sua primeira mesa para começar'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" />
                  Criar Mesa
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedTables.map((table) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedTableId === table.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onTableSelect?.(table)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(table.status as TableStatus)}
                    </div>

                    {/* Informações da Mesa */}
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          Mesa {table.number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status as TableStatus)}`}>
                          {getStatusText(table.status as TableStatus)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Capacidade: {table.capacity} pessoas</span>
                        {table.position_x !== null && table.position_y !== null && (
                          <span>Posição: ({table.position_x}, {table.position_y})</span>
                        )}
                      </div>
                      
                      {table.notes && (
                        <p className="text-sm text-gray-500 mt-1">{table.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(table);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar mesa"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(table);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir mesa"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredAndSortedTables.length} de {tables.length} mesa{tables.length !== 1 ? 's' : ''}
          </span>
          
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{tables.filter(t => t.status === 'available').length} disponíveis</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{tables.filter(t => t.status === 'occupied').length} ocupadas</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <TableModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTable(null);
        }}
        table={editingTable}
      />
    </div>
  );
};

export default TableListView;