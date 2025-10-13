/**
 * Modal para Processar Pagamento de Comanda
 * 
 * Permite ao operador do caixa escolher o método de pagamento
 * e processar comandas pendentes
 */

import React, { useState } from 'react';
import { X, CreditCard, DollarSign } from 'lucide-react';
import { ComandaWithItems } from '../../types/bar-attendance';
import { getComandaNumber } from '../../utils/comanda-formatter';

interface ProcessComandaPaymentModalProps {
  isOpen: boolean;
  comanda: ComandaWithItems | null;
  onClose: () => void;
  onConfirm: (paymentMethod: string, observations?: string) => Promise<void>;
  loading?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { value: 'cartao_debito', label: 'Cartão Débito', icon: '💳' },
  { value: 'cartao_credito', label: 'Cartão Crédito', icon: '💳' },
  { value: 'pix', label: 'PIX', icon: '📱' },
  { value: 'vale_refeicao', label: 'Vale Refeição', icon: '🎫' },
  { value: 'credito_conta', label: 'Crédito em Conta', icon: '👤' }
];

export const ProcessComandaPaymentModal: React.FC<ProcessComandaPaymentModalProps> = ({
  isOpen,
  comanda,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('dinheiro');
  const [observations, setObservations] = useState('');

  if (!isOpen || !comanda) return null;

  const handleConfirm = async () => {
    await onConfirm(selectedPaymentMethod, observations.trim() || undefined);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Processar Pagamento
              </h2>
              <p className="text-sm text-gray-500">
                Comanda #{getComandaNumber(comanda.id)}
                {comanda.table && ` - Mesa ${comanda.table.number}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Detalhes da Comanda */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalhes da Comanda
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{comanda.customer_name || 'Cliente'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mesa</p>
                  <p className="font-medium">
                    {comanda.table ? `Mesa ${comanda.table.number}` : 'Balcão'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pessoas</p>
                  <p className="font-medium">{comanda.people_count || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aberta em</p>
                  <p className="font-medium">
                    {new Date(comanda.opened_at || comanda.created_at || '').toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Itens da Comanda */}
              {comanda.items && comanda.items.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Itens ({comanda.items.length})
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {comanda.items.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(comanda.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Método de Pagamento
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setSelectedPaymentMethod(method.value)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === method.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-sm font-medium text-center">
                      {method.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Adicione observações sobre o pagamento..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Confirmar Pagamento
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessComandaPaymentModal;