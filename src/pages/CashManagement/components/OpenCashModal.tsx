import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { OpenCashSessionData } from '../../../types/cash-management';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCash: (data: OpenCashSessionData) => Promise<void>;
  getLastClosedSessionBalance?: (employeeId?: string) => Promise<number>;
}

export const OpenCashModal: React.FC<OpenCashModalProps> = ({
  isOpen,
  onClose,
  onOpenCash,
  getLastClosedSessionBalance
}) => {
  const [formData, setFormData] = useState<OpenCashSessionData>({
    opening_amount: 0,
    opening_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [lastSessionBalance, setLastSessionBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Carregar o saldo da última sessão fechada quando o modal abrir
  useEffect(() => {
    const loadLastBalance = async () => {
      if (isOpen && getLastClosedSessionBalance) {
        setLoadingBalance(true);
        try {
          const balance = await getLastClosedSessionBalance();
          setLastSessionBalance(balance);
          // Sugerir o valor da última sessão como valor inicial
          if (balance > 0 && formData.opening_amount === 0) {
            setFormData(prev => ({ ...prev, opening_amount: balance }));
          }
        } catch (error) {
          console.error('Erro ao carregar saldo da última sessão:', error);
        } finally {
          setLoadingBalance(false);
        }
      }
    };

    loadLastBalance();
  }, [isOpen, getLastClosedSessionBalance, formData.opening_amount]);

  const useSuggestedValue = () => {
    if (lastSessionBalance !== null) {
      setFormData(prev => ({ ...prev, opening_amount: lastSessionBalance }));
    }
  };

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
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600" aria-label="Fechar modal">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sugestão do saldo anterior */}
          {lastSessionBalance !== null && lastSessionBalance > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Saldo da última sessão fechada
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    R$ {lastSessionBalance.toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={useSuggestedValue}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    disabled={loading}
                  >
                    Usar este valor como abertura
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {loadingBalance && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">Carregando histórico...</span>
              </div>
            </div>
          )}

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
              aria-label="Valor inicial em reais"
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
