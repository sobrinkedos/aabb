import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';
import { supabase } from '../../lib/supabase';
import { findNextAvailablePosition } from '../../utils/table-layout';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table?: BarTable | null;
}

const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  table
}) => {
  const { refetch, tables } = useBarTables();
  const [formData, setFormData] = useState({
    number: '',
    capacity: 2,
    status: 'available' as TableStatus,
    notes: '',
    position_x: 100,
    position_y: 100
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!table;

  // Função para calcular próxima posição disponível
  const calculateNextPosition = () => {
    const existingPositions = tables
      .filter(t => t.position_x !== null && t.position_y !== null)
      .map(t => ({ x: t.position_x!, y: t.position_y! }));
    
    return findNextAvailablePosition(existingPositions);
  };

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number,
        capacity: table.capacity,
        status: (table.status as TableStatus) || 'available',
        notes: table.notes || '',
        position_x: table.position_x || 100,
        position_y: table.position_y || 100
      });
    } else {
      // Para nova mesa, calcular posição automática
      const nextPosition = calculateNextPosition();
      setFormData({
        number: '',
        capacity: 2,
        status: 'available',
        notes: '',
        position_x: nextPosition.x,
        position_y: nextPosition.y
      });
    }
    setError(null);
  }, [table, isOpen, tables.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Atualizar mesa existente
        const { error } = await supabase
          .from('bar_tables')
          .update({
            number: formData.number,
            capacity: formData.capacity,
            status: formData.status,
            notes: formData.notes || null,
            position_x: formData.position_x,
            position_y: formData.position_y,
            updated_at: new Date().toISOString()
          })
          .eq('id', table!.id);

        if (error) throw error;
      } else {
        // Criar nova mesa
        const { error } = await supabase
          .from('bar_tables')
          .insert({
            number: formData.number,
            capacity: formData.capacity,
            status: formData.status,
            notes: formData.notes || null,
            position_x: formData.position_x,
            position_y: formData.position_y
          });

        if (error) throw error;
      }

      await refetch();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar mesa:', err);
      if (err.code === '23505') {
        setError('Já existe uma mesa com este número');
      } else {
        setError(err.message || 'Erro ao salvar mesa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!table || !confirm('Tem certeza que deseja excluir esta mesa?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bar_tables')
        .delete()
        .eq('id', table.id);

      if (error) throw error;

      await refetch();
      onClose();
    } catch (err: any) {
      console.error('Erro ao excluir mesa:', err);
      setError(err.message || 'Erro ao excluir mesa');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: { value: TableStatus; label: string; color: string }[] = [
    { value: 'available', label: 'Disponível', color: 'text-green-600' },
    { value: 'occupied', label: 'Ocupada', color: 'text-red-600' },
    { value: 'reserved', label: 'Reservada', color: 'text-yellow-600' },
    { value: 'cleaning', label: 'Limpeza', color: 'text-blue-600' },
    { value: 'maintenance', label: 'Manutenção', color: 'text-gray-600' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {isEditing ? 'Editar Mesa' : 'Nova Mesa'}
                  </h3>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Número da Mesa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número da Mesa *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 1, A1, VIP-01"
                      />
                    </div>

                    {/* Capacidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidade (pessoas) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="20"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TableStatus }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Posição */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Posição X
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.position_x}
                          onChange={(e) => setFormData(prev => ({ ...prev, position_x: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Posição Y
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.position_y}
                          onChange={(e) => setFormData(prev => ({ ...prev, position_y: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Observações sobre a mesa..."
                      />
                    </div>

                    {/* Botões */}
                    <div className="flex justify-between pt-4">
                      <div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          disabled={loading}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4 mr-2" />
                          )}
                          {isEditing ? 'Salvar' : 'Criar'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TableModal;