import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRightLeft, Building, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { ProcessTreasuryTransferData, formatCurrency } from '../../../types/cash-management';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TreasuryTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessTransfer: (data: ProcessTreasuryTransferData) => Promise<void>;
  currentCashBalance: number;
  loading?: boolean;
}

export const TreasuryTransferModal: React.FC<TreasuryTransferModalProps> = ({
  isOpen,
  onClose,
  onProcessTransfer,
  currentCashBalance,
  loading = false
}) => {
  const [formData, setFormData] = useState<ProcessTreasuryTransferData>({
    amount: currentCashBalance,
    transfer_date: new Date().toISOString().split('T')[0],
    authorized_by: '',
    treasury_receipt_number: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const handleInputChange = (field: keyof ProcessTreasuryTransferData, value: any) => {
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

    if (!formData.transfer_date) {
      newErrors.transfer_date = 'Data da transferência é obrigatória';
    }

    if (!formData.authorized_by.trim()) {
      newErrors.authorized_by = 'Nome do autorizador é obrigatório';
    }

    // Validar data não futura
    const transferDate = new Date(formData.transfer_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (transferDate > today) {
      newErrors.transfer_date = 'Data não pode ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setProcessing(true);
    try {
      await onProcessTransfer(formData);
      handleClose();
    } catch (error) {
      console.error('Erro ao processar transferência:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: currentCashBalance,
      transfer_date: new Date().toISOString().split('T')[0],
      authorized_by: '',
      treasury_receipt_number: '',
      notes: ''
    });
    setErrors({});
    setProcessing(false);
    onClose();
  };

  const handleTransferAllCash = () => {
    handleInputChange('amount', currentCashBalance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transferência para Tesouraria</h3>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Building className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Transferência para Tesouraria</p>
              <p className="text-blue-700 mt-1">
                Esta operação transfere o dinheiro em caixa para a tesouraria central. Um comprovante será gerado para assinatura do conferente.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Valor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Valor da Transferência *
                </label>
                <button
                  type="button"
                  onClick={handleTransferAllCash}
                  className="text-xs text-purple-600 hover:text-purple-700 underline"
                  disabled={processing}
                >
                  Transferir todo o saldo
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={currentCashBalance}
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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

            {/* Data da transferência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Transferência *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  value={formData.transfer_date}
                  onChange={(e) => handleInputChange('transfer_date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.transfer_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={processing}
                  title="Selecione a data da transferência"
                  aria-label="Data da transferência"
                />
              </div>
              {errors.transfer_date && (
                <p className="text-sm text-red-600 mt-1">{errors.transfer_date}</p>
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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

            {/* Número do comprovante da tesouraria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Comprovante da Tesouraria
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={formData.treasury_receipt_number || ''}
                  onChange={(e) => handleInputChange('treasury_receipt_number', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: TSR-2024-001234"
                  disabled={processing}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Número de referência do comprovante da tesouraria (opcional)
              </p>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Observações adicionais sobre a transferência..."
                disabled={processing}
              />
            </div>
          </div>

          {/* Resumo */}
          {formData.amount > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Resumo da Transferência</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo atual em caixa:</span>
                  <span className="font-medium">{formatCurrency(currentCashBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor a transferir:</span>
                  <span className="font-medium text-purple-600">{formatCurrency(formData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data da transferência:</span>
                  <span className="font-medium">
                    {format(new Date(formData.transfer_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">Saldo restante em caixa:</span>
                    <span className="font-bold">{formatCurrency(currentCashBalance - formData.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning para transferência total */}
          {formData.amount === currentCashBalance && formData.amount > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Transferência Total</p>
                <p className="text-yellow-700">
                  Você está transferindo todo o saldo em caixa. O caixa ficará zerado após esta operação.
                </p>
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
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processing || loading || !formData.amount || !formData.authorized_by.trim()}
            >
              {processing ? 'Processando...' : 'Transferir e Imprimir Comprovante'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TreasuryTransferModal;