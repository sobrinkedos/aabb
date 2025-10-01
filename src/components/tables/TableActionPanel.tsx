import React from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';

interface TableActionPanelProps {
  table: BarTable;
  onClose: () => void;
  onEdit: (table: BarTable) => void;
  onStartOrder?: (table: BarTable) => void;
}

const TableActionPanel: React.FC<TableActionPanelProps> = ({
  table,
  onClose,
  onEdit,
  onStartOrder
}) => {
  const { updateTableStatus, deleteTable } = useBarTables();

  const handleStatusChange = async (newStatus: TableStatus) => {
    try {
      await updateTableStatus(table.id, newStatus);
    } catch (error) {
      console.error('Erro ao alterar status da mesa:', error);
      alert('Erro ao alterar status da mesa');
    }
  };

  const handleDeleteTable = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a Mesa ${table.number}?`)) {
      try {
        await deleteTable(table.id);
        onClose();
      } catch (error) {
        console.error('Erro ao excluir mesa:', error);
        alert('Erro ao excluir mesa');
      }
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'occupied':
        return 'text-red-600 bg-red-50';
      case 'reserved':
        return 'text-yellow-600 bg-yellow-50';
      case 'cleaning':
        return 'text-blue-600 bg-blue-50';
      case 'maintenance':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
        return 'Em Limpeza';
      case 'maintenance':
        return 'Manutenção';
      default:
        return 'Indefinido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Mesa {table.number}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <UserGroupIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Capacidade: {table.capacity} pessoas
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Status Atual */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status Atual:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(table.status || 'available')}`}>
              {getStatusText(table.status || 'available')}
            </div>
          </div>
        </div>

        {/* Ações Principais */}
        <div className="px-6 py-4 space-y-3">
          {/* Iniciar Atendimento - só se disponível */}
          {table.status === 'available' && onStartOrder && (
            <button
              onClick={() => onStartOrder(table)}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserGroupIcon className="h-5 w-5" />
              <span>Iniciar Atendimento</span>
            </button>
          )}

          {/* Finalizar Atendimento - só se ocupada */}
          {table.status === 'occupied' && (
            <button
              onClick={() => handleStatusChange('available')}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>Finalizar Atendimento</span>
            </button>
          )}

          {/* Alterar Status */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Alterar Status:</span>
            <div className="grid grid-cols-2 gap-2">
              {table.status !== 'available' && (
                <button
                  onClick={() => handleStatusChange('available')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Disponível</span>
                </button>
              )}
              
              {table.status !== 'occupied' && (
                <button
                  onClick={() => handleStatusChange('occupied')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  <span>Ocupada</span>
                </button>
              )}
              
              {table.status !== 'reserved' && (
                <button
                  onClick={() => handleStatusChange('reserved')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>Reservada</span>
                </button>
              )}
              
              {table.status !== 'cleaning' && (
                <button
                  onClick={() => handleStatusChange('cleaning')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Limpeza</span>
                </button>
              )}
              
              {table.status !== 'maintenance' && (
                <button
                  onClick={() => handleStatusChange('maintenance')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  <span>Manutenção</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ações Secundárias */}
        <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
          <button
            onClick={() => onEdit(table)}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Editar</span>
          </button>
          
          <button
            onClick={handleDeleteTable}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Excluir</span>
          </button>
        </div>

        {/* Informações Adicionais */}
        {table.description && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Observações:</span>
            <p className="text-sm text-gray-600 mt-1">{table.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableActionPanel;