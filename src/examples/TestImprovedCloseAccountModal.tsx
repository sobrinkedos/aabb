/**
 * Exemplo de teste do Modal de Fechamento de Conta Melhorado
 * 
 * Este componente demonstra o uso do modal com itens consumidos,
 * ajuste de comissão e envio para caixa como pendente de pagamento
 */

import React, { useState } from 'react';
import { CloseAccountModal } from '../components/sales/CloseAccountModal';
import { useCloseAccountModal } from '../hooks/useCloseAccountModal';
import { Command, CommandItem } from '../types/sales-management';
import { CashManager } from '../services/cash-manager';

// Dados de exemplo para teste
const exemploComanda: Command = {
  id: 'CMD-001',
  mesa_id: 'MESA-05',
  cliente_id: 'CLI-123',
  nome_cliente: 'João Silva',
  funcionario_id: 'FUNC-001',
  status: 'aberta' as any,
  total: 87.50,
  quantidade_pessoas: 4,
  aberta_em: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  data_abertura: new Date().toISOString(),
  
  // Dados da mesa
  mesa: {
    id: 'MESA-05',
    numero: 5,
    capacidade: 6
  },
  
  // Itens consumidos
  itens: [
    {
      id: 'ITEM-001',
      comanda_id: 'CMD-001',
      produto_id: 'PROD-001',
      nome_produto: 'Bolinho de Bacalhau',
      quantidade: 2,
      preco_unitario: 16.90,
      preco_total: 33.80,
      status: 'entregue' as any,
      adicionado_em: new Date().toISOString(),
      entregue_em: new Date().toISOString(),
      created_at: new Date().toISOString(),
      observacoes: 'Sem cebola'
    },
    {
      id: 'ITEM-002',
      comanda_id: 'CMD-001',
      produto_id: 'PROD-002',
      nome_produto: 'Cerveja Heineken 350ml',
      quantidade: 3,
      preco_unitario: 10.30,
      preco_total: 30.90,
      status: 'entregue' as any,
      adicionado_em: new Date().toISOString(),
      entregue_em: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'ITEM-003',
      comanda_id: 'CMD-001',
      produto_id: 'PROD-003',
      nome_produto: 'Bebum Especial',
      quantidade: 1,
      preco_unitario: 22.80,
      preco_total: 22.80,
      status: 'entregue' as any,
      adicionado_em: new Date().toISOString(),
      entregue_em: new Date().toISOString(),
      created_at: new Date().toISOString(),
      observacoes: 'Bem gelado'
    }
  ] as CommandItem[]
};

export const TestImprovedCloseAccountModal: React.FC = () => {
  const [cashSessionOpen, setCashSessionOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  
  const cashManager = CashManager.getInstance();

  // Hook do modal com callbacks
  const {
    isOpen,
    selectedComanda,
    loading,
    error,
    openModal,
    closeModal,
    handleConfirm,
    clearError
  } = useCloseAccountModal({
    onSuccess: (result) => {
      console.log('✅ Fechamento processado com sucesso:', result);
      
      // Simular adição à lista de pendências
      if (result.data) {
        setPendingPayments(prev => [...prev, {
          id: result.data.pending_id,
          command_id: result.data.transaction_id,
          amount: result.data.total_amount,
          commission_amount: result.data.commission_amount,
          payment_method: result.data.payment_method,
          status: 'pending',
          created_at: result.data.processed_at
        }]);
      }
      
      alert('Comanda enviada para o caixa como pendente de pagamento!');
    },
    onError: (error) => {
      console.error('❌ Erro no fechamento:', error);
      alert(`Erro: ${error.message}`);
    }
  });

  const handleOpenCashSession = async () => {
    try {
      await cashManager.openCash(100.00, 'OPERATOR-001');
      setCashSessionOpen(true);
      alert('Sessão de caixa aberta com R$ 100,00');
    } catch (error) {
      alert(`Erro ao abrir caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleCloseCashSession = async () => {
    try {
      const result = await cashManager.closeCash(150.00, 'OPERATOR-001');
      setCashSessionOpen(false);
      setPendingPayments([]);
      alert(`Caixa fechado. Divergência: R$ ${result.discrepancy.toFixed(2)}`);
    } catch (error) {
      alert(`Erro ao fechar caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleProcessPending = async (pendingId: string) => {
    try {
      await cashManager.processPendingPayment(pendingId, 'OPERATOR-001');
      setPendingPayments(prev => prev.filter(p => p.id !== pendingId));
      alert('Pagamento processado com sucesso!');
    } catch (error) {
      alert(`Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Teste do Modal de Fechamento Melhorado
          </h1>

          {/* Status do Caixa */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Status do Caixa
            </h2>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                cashSessionOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {cashSessionOpen ? 'Aberto' : 'Fechado'}
              </span>
              <div className="space-x-2">
                {!cashSessionOpen ? (
                  <button
                    onClick={handleOpenCashSession}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Abrir Caixa
                  </button>
                ) : (
                  <button
                    onClick={handleCloseCashSession}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Fechar Caixa
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Comanda de Exemplo */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Comanda de Exemplo
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p><strong>ID:</strong> {exemploComanda.id}</p>
                <p><strong>Mesa:</strong> {exemploComanda.mesa?.numero}</p>
                <p><strong>Cliente:</strong> {exemploComanda.nome_cliente}</p>
              </div>
              <div>
                <p><strong>Total:</strong> R$ {exemploComanda.total.toFixed(2)}</p>
                <p><strong>Pessoas:</strong> {exemploComanda.quantidade_pessoas}</p>
                <p><strong>Itens:</strong> {exemploComanda.itens?.length || 0}</p>
              </div>
            </div>
            
            <button
              onClick={() => openModal(exemploComanda)}
              disabled={!cashSessionOpen}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fechar Comanda
            </button>
            
            {!cashSessionOpen && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Abra uma sessão de caixa primeiro
              </p>
            )}
          </div>

          {/* Lista de Pendências */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pendências de Pagamento ({pendingPayments.length})
            </h2>
            
            {pendingPayments.length > 0 ? (
              <div className="space-y-3">
                {pendingPayments.map((pending) => (
                  <div key={pending.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pendência #{pending.id}</p>
                        <p className="text-sm text-gray-600">
                          Valor: R$ {pending.amount.toFixed(2)} | 
                          Comissão: R$ {pending.commission_amount.toFixed(2)} | 
                          Método: {pending.payment_method}
                        </p>
                      </div>
                      <button
                        onClick={() => handleProcessPending(pending.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Processar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma pendência de pagamento
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedComanda && (
        <CloseAccountModal
          isOpen={isOpen}
          comanda={selectedComanda}
          onClose={closeModal}
          onConfirm={handleConfirm}
          loading={loading}
        />
      )}
    </div>
  );
};

export default TestImprovedCloseAccountModal;