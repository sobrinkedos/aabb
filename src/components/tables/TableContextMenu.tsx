import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';

interface TableContextMenuProps {
  table: BarTable;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
}

const TableContextMenu: React.FC<TableContextMenuProps> = ({
  table,
  x,
  y,
  onClose,
  onEdit
}) => {
  const { updateTableStatus } = useBarTables();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleStatusChange = async (status: TableStatus) => {
    try {
      await updateTableStatus(table.id, status);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar status da mesa:', error);
    }
  };

  const statusOptions = [
    { value: 'available', label: 'Disponível', icon: EyeIcon, color: 'text-green-600' },
    { value: 'occupied', label: 'Ocupada', icon: UserGroupIcon, color: 'text-red-600' },
    { value: 'reserved', label: 'Reservada', icon: ClockIcon, color: 'text-yellow-600' },
    { value: 'cleaning', label: 'Limpeza', icon: Cog6ToothIcon, color: 'text-blue-600' },
    { value: 'maintenance', label: 'Manutenção', icon: Cog6ToothIcon, color: 'text-gray-600' }
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48"
          style={{
            left: x,
            top: y,
            transform: 'translate(-50%, -10px)'
          }}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="font-medium text-gray-900">Mesa {table.number}</div>
            <div className="text-sm text-gray-500">{table.capacity} pessoas</div>
          </div>

          {/* Status Options */}
          <div className="py-1">
            <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Alterar Status
            </div>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isCurrentStatus = table.status === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isCurrentStatus}
                  className={`w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    isCurrentStatus ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  <span className="text-sm text-gray-700">{option.label}</span>
                  {isCurrentStatus && (
                    <span className="ml-auto text-xs text-gray-500">Atual</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={onEdit}
              className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Editar Mesa</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TableContextMenu;