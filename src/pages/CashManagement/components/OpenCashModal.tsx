import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { OpenCashSessionData } from '../../../types/cash-management';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCash: (data: OpenCashSessionData) => Promise<void>;
}

export const OpenCashModal: React.FC<OpenCashModalProps> = ({
  isOpen,
  onClose,
  onOpenCash
}) => {
  const [formData, setFormData] = useState<OpenCashSessionData>({
    opening_amount: 0,
    opening_notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onOpenCash(formData);
      onClose();
      setFormData({ opening_amount: 0, opening_notes: '' });
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Abrir Caixa</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Inicial (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.opening_amount}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                opening_amount: parseFloat(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.opening_notes || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                opening_notes: e.target.value 
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Observações sobre a abertura do caixa..."
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
