/**
 * Componente de teste para verificar se o novo modal está funcionando
 */

import React from 'react';
import { CloseAccountModal } from '../sales/CloseAccountModal';
import { useCloseAccountModal } from '../../hooks/useCloseAccountModal';
import { Command } from '../../types/sales-management';

const exemploComanda: Command = {
  id: 'CMD-TEST-001',
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
  
  mesa: {
    id: 'MESA-05',
    numero: 5,
    capacidade: 6
  },
  
  itens: [
    {
      id: 'ITEM-001',
      comanda_id: 'CMD-TEST-001',
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
      comanda_id: 'CMD-TEST-001',
      produto_id: 'PROD-002',
      nome_produto: 'Cerveja Heineken 350ml',
      quantidade: 3,
      preco_unitario: 10.30,
      preco_total: 30.90,
      status: 'entregue' as any,
      adicionado_em: new Date().toISOString(),
      entregue_em: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ]
};

export const TestNewModal: React.FC = () => {
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
      console.log('✅ Teste - Modal funcionou:', result);
      alert('Modal funcionou! Verifique o console.');
    },
    onError: (error) => {
      console.error('❌ Teste - Erro no modal:', error);
      alert(`Erro no modal: ${error.message}`);
    }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste do Novo Modal</h1>
      
      <button
        onClick={() => openModal(exemploComanda)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Abrir Modal de Teste
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <span>Erro: {error}</span>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

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

export default TestNewModal;