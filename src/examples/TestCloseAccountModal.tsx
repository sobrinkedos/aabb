/**
 * Exemplo de teste manual para CloseAccountModal
 */

import React, { useState } from 'react';
import { CloseAccountModal } from '../components/sales/CloseAccountModal';
import { useCloseAccountModal } from '../hooks/useCloseAccountModal';
import { Command, ComandaStatus, ItemStatus } from '../types/sales-management';

// Dados de exemplo para teste
const mockComanda: Command = {
  id: 'CMD0001-123456',
  funcionario_id: 'func-123',
  status: ComandaStatus.ABERTA,
  total: 150.00,
  quantidade_pessoas: 4,
  aberta_em: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  mesa: {
    id: 'mesa-05',
    numero: '05',
    capacidade: 4
  },
  itens: [
    {
      id: 'item-1',
      comanda_id: 'CMD0001-123456',
      produto_id: 'prod-123',
      nome_produto: 'Hambúrguer Clássico',
      quantidade: 2,
      preco_unitario: 25.90,
      preco_total: 51.80,
      status: ItemStatus.ENTREGUE,
      adicionado_em: '2024-01-15T10:05:00Z',
      created_at: '2024-01-15T10:05:00Z',
      observacoes: 'Sem cebola'
    },
    {
      id: 'item-2',
      comanda_id: 'CMD0001-123456',
      produto_id: 'prod-456',
      nome_produto: 'Batata Frita Grande',
      quantidade: 1,
      preco_unitario: 18.50,
      preco_total: 18.50,
      status: ItemStatus.ENTREGUE,
      adicionado_em: '2024-01-15T10:10:00Z',
      created_at: '2024-01-15T10:10:00Z'
    },
    {
      id: 'item-3',
      comanda_id: 'CMD0001-123456',
      produto_id: 'prod-789',
      nome_produto: 'Refrigerante 350ml',
      quantidade: 4,
      preco_unitario: 4.50,
      preco_total: 18.00,
      status: ItemStatus.ENTREGUE,
      adicionado_em: '2024-01-15T10:15:00Z',
      created_at: '2024-01-15T10:15:00Z'
    }
  ]
};

export const TestCloseAccountModal: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const modal = useCloseAccountModal({
    onSuccess: (dados) => {
      addLog(`✅ Fechamento processado com sucesso!`);
      addLog(`💰 Valor total: R$ ${dados.valor_total.toFixed(2)}`);
      addLog(`📊 Comissão: ${dados.percentual_comissao}% (R$ ${dados.valor_comissao.toFixed(2)})`);
      addLog(`💳 Método: ${dados.metodo_pagamento}`);
    },
    onError: (error) => {
      addLog(`❌ Erro: ${error.message}`);
    },
    processPayment: async (dados) => {
      addLog(`🔄 Processando pagamento...`);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular erro ocasional (20% de chance)
      if (Math.random() < 0.2) {
        throw new Error('Falha na comunicação com o terminal de pagamento');
      }
      
      addLog(`✅ Pagamento processado via ${dados.metodo_pagamento}`);
    }
  });

  const clearLogs = () => setLogs([]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🧪 Teste do Modal de Fechamento de Conta
        </h1>

        {/* Informações da Comanda */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">📋 Comanda de Teste</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>ID:</strong> {mockComanda.id}
            </div>
            <div>
              <strong>Mesa:</strong> {mockComanda.mesa?.numero}
            </div>
            <div>
              <strong>Pessoas:</strong> {mockComanda.quantidade_pessoas}
            </div>
            <div>
              <strong>Total:</strong> R$ {mockComanda.total.toFixed(2)}
            </div>
          </div>
          
          <div className="mt-3">
            <strong>Itens:</strong>
            <ul className="mt-1 space-y-1">
              {mockComanda.itens?.map(item => (
                <li key={item.id} className="text-sm text-gray-600">
                  • {item.quantidade}x {item.nome_produto} - R$ {item.preco_total.toFixed(2)}
                  {item.observacoes && <span className="italic"> ({item.observacoes})</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Botões de Teste */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => modal.openModal(mockComanda)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🚀 Abrir Modal de Fechamento
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🗑️ Limpar Logs
          </button>
        </div>

        {/* Logs de Teste */}
        <div className="bg-black rounded-lg p-4">
          <h3 className="text-green-400 font-mono text-sm mb-2">📝 Logs de Teste:</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 font-mono text-sm">
                Aguardando ações... Clique em "Abrir Modal" para começar.
              </p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="text-green-300 font-mono text-sm">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Instruções de Teste */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">📖 Como Testar:</h3>
          <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
            <li>Clique em "Abrir Modal de Fechamento"</li>
            <li>Teste diferentes percentuais de comissão (0% a 30%)</li>
            <li>Experimente percentuais inválidos (acima de 30%)</li>
            <li>Selecione diferentes métodos de pagamento</li>
            <li>Adicione observações</li>
            <li>Clique em "Confirmar Fechamento"</li>
            <li>Observe os logs para ver o resultado</li>
          </ol>
        </div>

        {/* Cenários de Teste */}
        <div className="mt-4 bg-yellow-50 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold mb-2">🎯 Cenários para Testar:</h3>
          <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
            <li><strong>Comissão padrão:</strong> 10% (deve calcular R$ 15,00 de comissão)</li>
            <li><strong>Sem comissão:</strong> 0% (total deve ser R$ 150,00)</li>
            <li><strong>Comissão máxima:</strong> 30% (deve calcular R$ 45,00 de comissão)</li>
            <li><strong>Comissão inválida:</strong> 35% (deve mostrar erro)</li>
            <li><strong>Diferentes pagamentos:</strong> Dinheiro, PIX, Cartão, etc.</li>
            <li><strong>Com observações:</strong> Adicionar notas sobre o atendimento</li>
            <li><strong>Cancelamento:</strong> Fechar modal sem confirmar</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {modal.selectedComanda && (
        <CloseAccountModal
          isOpen={modal.isOpen}
          comanda={modal.selectedComanda}
          onClose={modal.closeModal}
          onConfirm={modal.handleConfirm}
          loading={modal.loading}
        />
      )}
    </div>
  );
};

export default TestCloseAccountModal;