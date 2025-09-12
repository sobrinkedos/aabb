import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building2, AlertTriangle, Clock, ShoppingBag } from 'lucide-react';
import { CashSessionWithEmployee, CloseCashSessionData, PaymentReconciliationData, PaymentMethod, formatCurrency, PAYMENT_METHOD_LABELS } from '../../../types/cash-management';
import { useBalcaoOrders } from '../../../hooks/useBalcaoOrders';
import { supabase } from '../../../lib/supabase';

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashSessionWithEmployee;
  onCloseCash: (data: CloseCashSessionData) => Promise<void>;
}

export const CloseCashModal: React.FC<CloseCashModalProps> = ({
  isOpen,
  onClose,
  session,
  onCloseCash
}) => {
  const { preparingOrders, readyOrders } = useBalcaoOrders();
  
  const [formData, setFormData] = useState<CloseCashSessionData>({    
    closing_amount: session.expected_amount,
    closing_notes: '',
    reconciliation: [
      { payment_method: 'dinheiro', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'cartao_debito', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'cartao_credito', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'pix', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'transferencia', expected_amount: 0, actual_amount: 0, transaction_count: 0 }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [pendingCommandaItems, setPendingCommandaItems] = useState<any[]>([]);
  const [loadingValidation, setLoadingValidation] = useState(false);

  // Carregar dados de reconciliação e validar pedidos pendentes quando a modal abrir
  useEffect(() => {
    if (isOpen && session) {
      // Aqui você pode carregar os valores esperados por método de pagamento
      // Por enquanto, vamos usar valores mock
      setFormData(prev => ({
        ...prev,
        closing_amount: session.expected_amount
      }));
      
      // Carregar itens de comandas pendentes de entrega
      loadPendingCommandaItems();
    }
  }, [isOpen, session]);
  
  // Função para carregar itens de comandas pendentes de entrega
  const loadPendingCommandaItems = async () => {
    setLoadingValidation(true);
    try {
      const { data: pendingItems, error } = await supabase
        .from('comanda_items')
        .select(`
          *,
          comanda:comandas!inner(
            id,
            customer_name,
            table_id,
            bar_tables(number)
          ),
          menu_item:menu_items(name)
        `)
        .in('status', ['pending', 'preparing', 'ready'])
        .eq('comanda.status', 'open')
        .order('added_at', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar itens pendentes:', error);
        setPendingCommandaItems([]);
      } else {
        setPendingCommandaItems(pendingItems || []);
      }
    } catch (error) {
      console.error('Erro ao validar pedidos pendentes:', error);
      setPendingCommandaItems([]);
    } finally {
      setLoadingValidation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se há pedidos pendentes de entrega
    const totalPendingOrders = preparingOrders.length + readyOrders.length + pendingCommandaItems.length;
    
    if (totalPendingOrders > 0) {
      const confirmMessage = `ATENÇÃO: Existem ${totalPendingOrders} pedidos pendentes de entrega:\n\n` +
        `• ${preparingOrders.length} pedidos de balcão em preparo\n` +
        `• ${readyOrders.length} pedidos de balcão prontos para entrega\n` +
        `• ${pendingCommandaItems.length} itens de comandas não entregues\n\n` +
        'Tem certeza que deseja fechar o caixa mesmo com pedidos pendentes?';
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    setLoading(true);
    
    try {
      await onCloseCash(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReconciliation = (paymentMethod: PaymentMethod, field: 'actual_amount' | 'transaction_count', value: number) => {
    setFormData(prev => ({
      ...prev,
      reconciliation: prev.reconciliation.map(recon => 
        recon.payment_method === paymentMethod 
          ? { ...recon, [field]: value }
          : recon
      )
    }));
  };

  const totalActualAmount = formData.reconciliation.reduce((sum, recon) => sum + recon.actual_amount, 0);
  const cashDiscrepancy = totalActualAmount - session.expected_amount;
  
  // Calcular total de pedidos pendentes
  const totalPendingOrders = preparingOrders.length + readyOrders.length + pendingCommandaItems.length;
  const hasPendingDeliveries = totalPendingOrders > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Fechar Caixa</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta de Pedidos Pendentes */}
          {hasPendingDeliveries && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    ⚠️ Atenção: Pedidos Pendentes de Entrega
                  </h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    {preparingOrders.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{preparingOrders.length} pedidos de balcão em preparo</span>
                      </div>
                    )}
                    {readyOrders.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span>{readyOrders.length} pedidos de balcão prontos para entrega</span>
                      </div>
                    )}
                    {pendingCommandaItems.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{pendingCommandaItems.length} itens de comandas não entregues</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Recomenda-se entregar todos os pedidos antes de fechar o caixa.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Resumo da Sessão */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Resumo da Sessão</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Valor inicial:</span>
                <span className="font-medium">{formatCurrency(session.opening_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor esperado total:</span>
                <span className="font-medium">{formatCurrency(session.expected_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Aberta em:</span>
                <span className="font-medium">{new Date(session.opened_at).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Funcionário:</span>
                <span className="font-medium">{session.employee?.name}</span>
              </div>
            </div>
          </div>

          {/* Reconciliação por Método de Pagamento */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reconciliação por Método de Pagamento</h3>
            <div className="space-y-4">
              {formData.reconciliation.map((recon, index) => {
                const getIcon = (method: PaymentMethod) => {
                  switch (method) {
                    case 'dinheiro': return <DollarSign className="h-5 w-5" />;
                    case 'cartao_debito':
                    case 'cartao_credito': return <CreditCard className="h-5 w-5" />;
                    case 'pix': return <Smartphone className="h-5 w-5" />;
                    case 'transferencia': return <Building2 className="h-5 w-5" />;
                    default: return <DollarSign className="h-5 w-5" />;
                  }
                };

                return (
                  <div key={recon.payment_method} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {getIcon(recon.payment_method)}
                      <h4 className="font-medium text-gray-900">
                        {PAYMENT_METHOD_LABELS[recon.payment_method]}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Valor Esperado
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded text-sm font-medium">
                          {formatCurrency(recon.expected_amount)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Valor Real *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={recon.actual_amount}
                          onChange={(e) => updateReconciliation(
                            recon.payment_method, 
                            'actual_amount', 
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          disabled={loading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Transações
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={recon.transaction_count}
                          onChange={(e) => updateReconciliation(
                            recon.payment_method, 
                            'transaction_count', 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    {Math.abs(recon.actual_amount - recon.expected_amount) > 0.01 && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        recon.actual_amount > recon.expected_amount 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}>
                        {recon.actual_amount > recon.expected_amount ? 'Sobra' : 'Falta'}: 
                        {formatCurrency(Math.abs(recon.actual_amount - recon.expected_amount))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo Final */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Resumo Final</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Total esperado:</span>
                <span className="font-medium">{formatCurrency(session.expected_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total contado:</span>
                <span className="font-medium">{formatCurrency(totalActualAmount)}</span>
              </div>
              <div className="flex justify-between col-span-2 pt-2 border-t border-blue-200">
                <span className="font-medium">Diferença:</span>
                <span className={`font-bold ${
                  Math.abs(cashDiscrepancy) < 0.01 
                    ? 'text-green-600' 
                    : cashDiscrepancy > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                }`}>
                  {cashDiscrepancy === 0 ? 'Exato' : formatCurrency(cashDiscrepancy)}
                  {cashDiscrepancy > 0 && ' (Sobra)'}
                  {cashDiscrepancy < 0 && ' (Falta)'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações do Fechamento
            </label>
            <textarea
              value={formData.closing_notes || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                closing_notes: e.target.value 
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Observações sobre o fechamento..."
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingValidation}
              className={`flex-1 px-4 py-2 text-white rounded-md disabled:opacity-50 transition-colors ${
                hasPendingDeliveries 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Fechando...' : 
               loadingValidation ? 'Validando...' :
               hasPendingDeliveries ? 'Fechar Mesmo Assim' : 'Fechar Caixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
