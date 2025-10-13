import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Building2, Receipt, AlertCircle } from 'lucide-react';
import { PaymentModalProps, ProcessComandaPaymentData, PaymentMethod, formatCurrency } from '../../../types/cash-management';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  comanda,
  onProcessPayment,
  loading = false
}) => {
  const [formData, setFormData] = useState<Partial<ProcessComandaPaymentData>>({
    comanda_id: comanda.id,
    payment_method: 'dinheiro',
    amount: comanda.total,
    reference_number: '',
    customer_name: comanda.customer_name || '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentMethods: { method: PaymentMethod; icon: React.ReactNode; label: string }[] = [
    { method: 'dinheiro', icon: <DollarSign className="h-5 w-5" />, label: 'Dinheiro' },
    { method: 'cartao_debito', icon: <CreditCard className="h-5 w-5" />, label: 'Cartão de Débito' },
    { method: 'cartao_credito', icon: <CreditCard className="h-5 w-5" />, label: 'Cartão de Crédito' },
    { method: 'pix', icon: <Smartphone className="h-5 w-5" />, label: 'PIX' },
    { method: 'transferencia', icon: <Building2 className="h-5 w-5" />, label: 'Transferência' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Selecione um método de pagamento';
    }

    if ((formData.payment_method === 'cartao_debito' || formData.payment_method === 'cartao_credito' || formData.payment_method === 'pix') && !formData.reference_number) {
      newErrors.reference_number = 'Número de referência é obrigatório para este método';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onProcessPayment(formData as ProcessComandaPaymentData);
      onClose();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod): string => {
    const colors = {
      dinheiro: 'border-green-300 bg-green-50 text-green-700',
      cartao_debito: 'border-blue-300 bg-blue-50 text-blue-700',
      cartao_credito: 'border-purple-300 bg-purple-50 text-purple-700',
      pix: 'border-orange-300 bg-orange-50 text-orange-700',
      transferencia: 'border-gray-300 bg-gray-50 text-gray-700'
    };
    return colors[method] || colors.dinheiro;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Processar Pagamento</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Detalhes da Comanda */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Detalhes da Comanda</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Identificação</p>
              <p className="font-medium">
                {comanda.table ? `Mesa ${comanda.table.number}` : 'Balcão'}
                {comanda.customer_name && ` - ${comanda.customer_name}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Itens</p>
              <p className="font-medium">{comanda.items.length} itens</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pessoas</p>
              <p className="font-medium">{comanda.people_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Aberta em</p>
              <p className="font-medium">{new Date(comanda.opened_at).toLocaleString('pt-BR')}</p>
            </div>
          </div>
          
          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total da Comanda:</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(comanda.total)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Valor do Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Pagamento *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Método de Pagamento *</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map(({ method, icon, label }) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: method }))}
                  className={`p-3 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                    formData.payment_method === method
                      ? getPaymentMethodColor(method)
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  {icon}
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
            {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>}
          </div>

          {/* Número de Referência */}
          {(formData.payment_method === 'cartao_debito' || formData.payment_method === 'cartao_credito' || formData.payment_method === 'pix') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Referência *
              </label>
              <input
                type="text"
                value={formData.reference_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.reference_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o número de referência da transação"
                disabled={loading}
              />
              {errors.reference_number && <p className="mt-1 text-sm text-red-600">{errors.reference_number}</p>}
            </div>
          )}

          {/* Nome do Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={formData.customer_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nome do cliente (opcional)"
              disabled={loading}
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Observações sobre o pagamento (opcional)"
              disabled={loading}
            />
          </div>

          {/* Informações importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Informações Importantes</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• O pagamento será processado imediatamente</li>
                  <li>• A comanda será automaticamente fechada</li>
                  <li>• Um comprovante será gerado para o cliente</li>
                  <li>• As métricas do funcionário serão atualizadas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Processar Pagamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};