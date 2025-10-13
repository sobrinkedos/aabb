import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, User, AlertTriangle } from 'lucide-react';
import { ProcessCashWithdrawalData, formatCurrency } from '../../../types/cash-management';

interface CashWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessWithdrawal: (data: ProcessCashWithdrawalData) => Promise<void>;
  currentCashBalance: number;
  loading?: boolean;
}

export const CashWithdrawalModal: React.FC<CashWithdrawalModalProps> = ({
  isOpen,
  onClose,
  onProcessWithdrawal,
  currentCashBalance,
  loading = false
}) => {
  const [formData, setFormData] = useState<ProcessCashWithdrawalData>({
    amount: 0,
    reason: '',
    authorized_by: '',
    recipient: '',
    purpose: 'other'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const handleInputChange = (field: keyof ProcessCashWithdrawalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro específico quando o campo for modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (formData.amount > currentCashBalance) {
      newErrors.amount = 'Valor não pode ser maior que o saldo em caixa';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    if (!formData.authorized_by.trim()) {
      newErrors.authorized_by = 'Nome do autorizador é obrigatório';
    }

    if (formData.purpose === 'transfer' && !formData.recipient?.trim()) {
      newErrors.recipient = 'Destinatário é obrigatório para transferências';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setProcessing(true);
    try {
      await onProcessWithdrawal(formData);
      handleClose();
    } catch (error) {
      console.error('Erro ao processar saída:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: 0,
      reason: '',
      authorized_by: '',
      recipient: '',
      purpose: 'other'
    });
    setErrors({});
    setProcessing(false);
    onClose();
  };

  const purposeOptions = [
    { value: 'change', label: 'Troco' },
    { value: 'expense', label: 'Despesa' },
    { value: 'transfer', label: 'Transferência' },
    { value: 'other', label: 'Outros' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <Minus className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Saída de Dinheiro</h3>
              <p className="text-sm text-gray-600">
                Saldo disponível: {formatCurrency(currentCashBalance)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={processing}
            title="Fechar modal"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alert */}
        <div className="p-6 pb-0">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Atenção</p>
              <p className="text-yellow-700 mt-1">
                Esta operação reduzirá o saldo em caixa e deve ser autorizada por um supervisor.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Saída *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={currentCashBalance}
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  disabled={processing}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Finalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finalidade *
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={processing}
                title="Selecione a finalidade da saída"
                aria-label="Finalidade da saída de dinheiro"
              >
                {purposeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Destinatário (apenas para transferências) */}
            {formData.purpose === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destinatário *
                </label>
                <input
                  type="text"
                  value={formData.recipient || ''}
                  onChange={(e) => handleInputChange('recipient', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.recipient ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome do destinatário"
                  disabled={processing}
                />
                {errors.recipient && (
                  <p className="text-sm text-red-600 mt-1">{errors.recipient}</p>
                )}
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo/Descrição *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={3}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Descreva o motivo da saída de dinheiro..."
                disabled={processing}
              />
              {errors.reason && (
                <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Autorizado por */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autorizado por *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={formData.authorized_by}
                  onChange={(e) => handleInputChange('authorized_by', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.authorized_by ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome do supervisor/gerente"
                  disabled={processing}
                />
              </div>
              {errors.authorized_by && (
                <p className="text-sm text-red-600 mt-1">{errors.authorized_by}</p>
              )}
            </div>
          </div>

          {/* Resumo */}
          {formData.amount > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Resumo da Operação</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo atual:</span>
                  <span className="font-medium">{formatCurrency(currentCashBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor da saída:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(formData.amount)}</span>
                </div>
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">Saldo após saída:</span>
                    <span className="font-bold">{formatCurrency(currentCashBalance - formData.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              disabled={processing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processing || loading || !formData.amount || !formData.reason.trim() || !formData.authorized_by.trim()}
            >
              {processing ? 'Processando...' : 'Processar Saída'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CashWithdrawalModal;