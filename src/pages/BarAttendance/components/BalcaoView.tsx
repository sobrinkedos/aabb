import React, { useState } from 'react';
import NovoPedidoModal from './NovoPedidoModal';
import { supabase } from '../../../lib/supabase';

const BalcaoView: React.FC = () => {
  const [showNovoPedidoModal, setShowNovoPedidoModal] = useState(false);

  const handleNewOrder = () => {
    setShowNovoPedidoModal(true);
  };

  return (
    <div className="balcao-container">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Atendimento no Balcão</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleNewOrder}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Novo Pedido
            </button>
            <button 
              onClick={async () => {
                try {
                  const { data, error } = await supabase.from('menu_items').select('*').limit(1);
                  if (error) throw error;
                  alert(`Teste OK! Encontrados ${data?.length || 0} itens no menu`);
                } catch (err) {
                  alert(`Erro no teste: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Testar Conexão
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu de itens - será implementado nas próximas tarefas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Menu de Itens</h3>
              <p className="text-gray-600">
                Interface de seleção rápida de bebidas e petiscos será implementada na próxima tarefa
              </p>
            </div>
          </div>
          
          {/* Resumo do pedido - será implementado nas próximas tarefas */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pedido Atual</h3>
              <div className="text-center text-gray-600">
                <p>Nenhum item selecionado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NovoPedidoModal 
        isOpen={showNovoPedidoModal}
        onClose={() => setShowNovoPedidoModal(false)}
      />
    </div>
  );
};

export default BalcaoView;