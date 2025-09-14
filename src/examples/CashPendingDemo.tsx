/**
 * Demonstração do Sistema de Pendências de Caixa
 * 
 * Este componente mostra como as comandas fechadas são enviadas
 * como pendências para o caixa e como são processadas
 */

import React, { useState, useEffect } from 'react';
import { CashManager } from '../services/cash-manager';
import { PaymentPending, CashSession } from '../types/sales-management';
import { Clock, DollarSign, CreditCard, CheckCircle, XCircle } from 'lucide-react';

export const CashPendingDemo: React.FC = () => {
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentPending[]>([]);
  const [loading, setLoading] = useState(false);
  
  const cashManager = CashManager.getInstance();

  // Atualizar dados quando o componente monta
  useEffect(() => {
    updateData();
  }, []);

  const updateData = () => {
    const session = cashManager.getCurrentSession();
    setCashSession(session);
    
    if (session) {
      const pending = cashManager.getPendingPayments();
      setPendingPayments(pending);
    }
  };

  const handleOpenCash = async () => {
    try {
      setLoading(true);
      await cashManager.openCash(200.00, 'OPERATOR-001');
      updateData();
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCash = async () => {
    try {
      setLoading(true);
      const actualAmount = parseFloat(prompt('Valor físico no caixa:') || '0');
      await cashManager.closeCash(actualAmount, 'OPERATOR-001');
      updateData();
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePending = async () => {
    try {
      setLoading(true);
      
      // Simular dados de uma comanda fechada
      const paymentData = {
        valor_total: Math.random() * 100 + 20, // Entre R$ 20 e R$ 120
        percentual_comissao: 10,
        valor_comissao: 0,
        metodo_pagamento: ['dinheiro', 'cartao_debito', 'cartao_credito', 'pix'][Math.floor(Math.random() * 4)] as any,
        command_id: `CMD-${Date.now()}`,
        observacoes: 'Comanda fechada via modal'
      };
      
      paymentData.valor_comissao = (paymentData.valor_total * paymentData.percentual_comissao) / 100;
      
      await cashManager.createPaymentPending(paymentData);
      updateData();
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async (pendingId: string) => {
    try {
      setLoading(true);
      await cashManager.processPendingPayment(pendingId, 'OPERATOR-001');
      updateData();
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
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
      default: return '💰';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'dinheiro': return 'Dinheiro';
      case 'cartao_debito': return 'Cartão Débito';
      case 'cartao_credito': return 'Cartão Crédito';
      case 'pix': return 'PIX';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Sistema de Pendências de Caixa
          </h1>

          {/* Status do Caixa */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">
                  Status da Sessão de Caixa
                </h2>
                {cashSession ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Sessão Aberta</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>ID:</strong> {cashSession.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Valor Inicial:</strong> {formatCurrency(cashSession.initial_amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Valor Esperado:</strong> {formatCurrency(cashSession.expected_amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Aberta em:</strong> {new Date(cashSession.opened_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Sessão Fechada</span>
                  </div>
                )}
              </div>
              
              <div className="space-x-3">
                {!cashSession ? (
                  <button
                    onClick={handleOpenCash}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    Abrir Caixa
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCreatePending}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Simular Comanda
                    </button>
                    <button
                      onClick={handleCloseCash}
                      disabled={loading}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Fechar Caixa
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Pendências */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Pendências de Pagamento
              </h2>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-lg font-medium text-orange-800">
                  {pendingPayments.length} pendente{pendingPayments.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {pendingPayments.length > 0 ? (
              <div className="grid gap-4">
                {pendingPayments.map((pending) => (
                  <div key={pending.id} className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getPaymentMethodIcon(pending.payment_method)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Pendência #{pending.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Comanda: {pending.command_id}
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
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Criada em</p>
                            <p className="text-sm text-gray-600">
                              {new Date(pending.created_at).toLocaleString('pt-BR')}
                            </p>
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
                          disabled={loading}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <CreditCard className="w-5 h-5" />
                          Processar Pagamento
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma Pendência
                </h3>
                <p className="text-gray-600 mb-4">
                  Não há pagamentos pendentes no momento
                </p>
                {cashSession && (
                  <button
                    onClick={handleCreatePending}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Simular Comanda Fechada
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Como Funciona o Sistema
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. <strong>Abrir Caixa:</strong> Inicie uma sessão de caixa com valor inicial</p>
              <p>2. <strong>Fechar Comanda:</strong> Quando uma comanda é fechada no modal, ela vira uma pendência</p>
              <p>3. <strong>Processar Pagamento:</strong> O operador do caixa processa as pendências</p>
              <p>4. <strong>Fechar Caixa:</strong> Ao final do dia, feche o caixa informando o valor físico</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashPendingDemo;