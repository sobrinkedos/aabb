/**
 * Painel de Pendências do Caixa - Integração Real
 * 
 * Mostra as pendências de pagamento e permite processá-las
 */

import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, DollarSign, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { CashManager } from '../../services/cash-manager';
import { PaymentPending, CashSession } from '../../types/sales-management';
import { getComandaNumber, getPendingReference } from '../../utils/comanda-formatter';

interface CashPendingPanelProps {
  onPendingProcessed?: (pendingId: string) => void;
  onError?: (error: string) => void;
}



export const CashPendingPanel: React.FC<CashPendingPanelProps> = ({
  onPendingProcessed,
  onError
}) => {
  const [pendingPayments, setPendingPayments] = useState<PaymentPending[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const cashManager = CashManager.getInstance();

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar sessão atual
      const session = cashManager.getCurrentSession();
      setCashSession(session);
      
      if (session) {
        // Carregar pendências
        const pendings = await cashManager.getPendingPayments();
        setPendingPayments(pendings);
      } else {
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async (pendingId: string) => {
    try {
      setProcessingId(pendingId);
      
      // Processar pendência
      await cashManager.processPendingPayment(pendingId, 'current-operator');
      
      // Recarregar dados
      await loadData();
      
      if (onPendingProcessed) {
        onPendingProcessed(pendingId);
      }
    } catch (error) {
      console.error('Erro ao processar pendência:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'dinheiro': return '💵';
      case 'cartao_debito': return '💳';
      case 'cartao_credito': return '💳';
      case 'pix': return '📱';
      case 'credito_membro': return '👤';
      case 'transferencia': return '🏦';
      default: return '💰';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'cartao_debito': 'Cartão Débito',
      'cartao_credito': 'Cartão Crédito',
      'pix': 'PIX',
      'credito_membro': 'Crédito Membro',
      'transferencia': 'Transferência'
    };
    return labels[method] || method;
  };

  if (!cashSession) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Caixa Fechado
          </h3>
          <p className="text-gray-600">
            Abra uma sessão de caixa para visualizar as pendências de pagamento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Pendências de Pagamento
              </h2>
              <p className="text-sm text-gray-600">
                Sessão: {cashSession.id} • {pendingPayments.length} pendente{pendingPayments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista de Pendências */}
      <div className="p-6">
        {pendingPayments.length > 0 ? (
          <div className="space-y-4">
            {pendingPayments.map((pending) => (
              <div key={pending.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getPaymentMethodIcon(pending.payment_method)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Comanda #{getComandaNumber(pending.command_id)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Criada em {new Date(pending.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Total</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(pending.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Comissão</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatCurrency(pending.commission_amount)} ({pending.commission_percentage}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Método</p>
                        <p className="text-sm font-medium text-gray-700">
                          {getPaymentMethodLabel(pending.payment_method)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                      </div>
                    </div>

                    {pending.observations && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observações</p>
                        <p className="text-sm text-gray-700 italic">
                          {pending.observations}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6">
                    <button
                      onClick={() => handleProcessPending(pending.id)}
                      disabled={processingId === pending.id}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {processingId === pending.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Processar Pagamento
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma Pendência
            </h3>
            <p className="text-gray-600">
              Todas as comandas foram processadas
            </p>
          </div>
        )}
      </div>

      {/* Footer com Resumo */}
      {pendingPayments.length > 0 && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {pendingPayments.length} pendência{pendingPayments.length !== 1 ? 's' : ''} aguardando processamento
            </div>
            <div className="text-lg font-semibold text-gray-900">
              Total: {formatCurrency(
                pendingPayments.reduce((sum, p) => sum + p.amount, 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashPendingPanel;