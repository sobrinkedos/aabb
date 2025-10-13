/**
 * Demonstração da Integração Real
 * 
 * Exemplo de como usar os componentes reais integrados com Supabase
 */

import React, { useState, useEffect } from 'react';
import { CloseCommandButton } from '../components/Bar/CloseCommandButton';
import { CashPendingPanel } from '../components/cash/CashPendingPanel';
import { CashManager } from '../services/cash-manager';
import { CommandManager } from '../services/command-manager';
import { Command, CashSession } from '../types/sales-management';
import { DollarSign, Users, Clock, CheckCircle } from 'lucide-react';

export const RealIntegrationDemo: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cashManager = CashManager.getInstance();
  const commandManager = CommandManager.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar sessão de caixa
      const session = cashManager.getCurrentSession();
      setCashSession(session);
      
      // Carregar comandas abertas
      const openCommands = await commandManager.listarComandasAbertas();
      setCommands(openCommands);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showMessage('error', 'Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleOpenCash = async () => {
    try {
      setLoading(true);
      const initialAmount = parseFloat(prompt('Valor inicial do caixa:') || '0');
      
      if (initialAmount <= 0) {
        showMessage('error', 'Valor inicial deve ser maior que zero');
        return;
      }

      await cashManager.openCash(initialAmount, 'current-operator');
      await loadData();
      showMessage('success', `Caixa aberto com ${formatCurrency(initialAmount)}`);
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erro ao abrir caixa');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCash = async () => {
    if (!cashSession) return;

    try {
      setLoading(true);
      const actualAmount = parseFloat(prompt('Valor físico no caixa:') || '0');
      
      const result = await cashManager.closeCash(actualAmount, 'current-operator');
      await loadData();
      
      const divergence = result.discrepancy;
      showMessage(
        'success', 
        `Caixa fechado. Divergência: ${formatCurrency(divergence)}`
      );
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erro ao fechar caixa');
    } finally {
      setLoading(false);
    }
  };

  const handleCommandClosed = () => {
    loadData();
    showMessage('success', 'Comanda enviada para o caixa com sucesso!');
  };

  const handlePendingProcessed = (pendingId: string) => {
    loadData();
    showMessage('success', `Pagamento processado: ${pendingId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-green-100 text-green-800';
      case 'pendente_pagamento': return 'bg-yellow-100 text-yellow-800';
      case 'fechada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta';
      case 'pendente_pagamento': return 'Pendente Pagamento';
      case 'fechada': return 'Fechada';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Vendas - Integração Real
          </h1>
          <p className="text-gray-600">
            Demonstração do sistema integrado com Supabase
          </p>
        </div>

        {/* Mensagem */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel de Comandas */}
          <div className="space-y-6">
            {/* Status do Caixa */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  Status do Caixa
                </h2>
                
                {cashSession ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Aberto
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Fechado
                  </span>
                )}
              </div>

              {cashSession ? (
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Sessão:</strong> {cashSession.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Valor Inicial:</strong> {formatCurrency(cashSession.initial_amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Valor Esperado:</strong> {formatCurrency(cashSession.expected_amount)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">
                  Nenhuma sessão de caixa aberta
                </p>
              )}

              <div className="flex gap-2">
                {!cashSession ? (
                  <button
                    onClick={handleOpenCash}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Abrir Caixa
                  </button>
                ) : (
                  <button
                    onClick={handleCloseCash}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Fechar Caixa
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Comandas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Comandas Abertas ({commands.length})
                </h2>
                
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  Atualizar
                </button>
              </div>

              {commands.length > 0 ? (
                <div className="space-y-3">
                  {commands.map((command) => (
                    <div key={command.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Comanda #{command.id}
                          </h3>
                          {command.mesa && (
                            <p className="text-sm text-gray-600">
                              Mesa {command.mesa.numero}
                            </p>
                          )}
                          {command.nome_cliente && (
                            <p className="text-sm text-gray-600">
                              Cliente: {command.nome_cliente}
                            </p>
                          )}
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(command.status)}`}>
                          {getStatusLabel(command.status)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(command.total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {command.itens?.length || 0} {(command.itens?.length || 0) === 1 ? 'item' : 'itens'}
                          </p>
                        </div>

                        <CloseCommandButton
                          comanda={command}
                          onSuccess={handleCommandClosed}
                          onError={(error) => showMessage('error', error)}
                          disabled={!cashSession}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma comanda aberta</p>
                </div>
              )}
            </div>
          </div>

          {/* Painel de Pendências do Caixa */}
          <div>
            <CashPendingPanel
              onPendingProcessed={handlePendingProcessed}
              onError={(error) => showMessage('error', error)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealIntegrationDemo;