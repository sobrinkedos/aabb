import React from 'react';
import { useBarAttendance } from '../useBarAttendance';

/**
 * Exemplo de uso do hook useBarAttendance
 * Este componente demonstra como utilizar todas as funcionalidades do hook
 */
export const BarAttendanceExample: React.FC = () => {
  const {
    // Estado
    mesas,
    comandas,
    metricas,
    notificacoes,
    loading,
    error,
    
    // CRUD de comandas
    criarComanda,
    atualizarComanda,
    fecharComanda,
    adicionarItemComanda,
    removerItemComanda,
    atualizarStatusItem,
    
    // Gerenciamento de mesas
    ocuparMesa,
    liberarMesa,
    reservarMesa,
    limparMesa,
    atualizarStatusMesa,
    
    // Pedidos no balcão
    processarPedidoBalcao,
    
    // Divisão de conta
    dividirConta,
    
    // Métricas
    atualizarMetricas,
    
    // Notificações
    marcarNotificacaoLida,
    limparNotificacoes,
    
    // Utilidades
    recarregarDados,
    obterComandaPorMesa,
    obterMesaPorNumero
  } = useBarAttendance();

  // Exemplo: Criar nova comanda para uma mesa
  const handleCriarComanda = async () => {
    try {
      const comandaId = await criarComanda('mesa-1', 'João Silva', 4);
      console.log('Comanda criada:', comandaId);
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
    }
  };

  // Exemplo: Adicionar item à comanda
  const handleAdicionarItem = async (comandaId: string) => {
    try {
      await adicionarItemComanda(comandaId, 'menu-item-1', 2, 'Sem gelo');
      console.log('Item adicionado à comanda');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  // Exemplo: Processar pedido do balcão
  const handlePedidoBalcao = async () => {
    try {
      const pedido = {
        items: [
          {
            menu_item_id: 'menu-1',
            name: 'Cerveja Brahma',
            price: 8.50,
            quantity: 2
          },
          {
            menu_item_id: 'menu-2',
            name: 'Porção de Batata',
            price: 15.00,
            quantity: 1
          }
        ],
        total: 32.00,
        payment_method: 'dinheiro'
      };

      const comandaId = await processarPedidoBalcao(pedido);
      console.log('Pedido do balcão processado:', comandaId);
    } catch (error) {
      console.error('Erro ao processar pedido do balcão:', error);
    }
  };

  // Exemplo: Ocupar mesa
  const handleOcuparMesa = async (mesaId: string) => {
    try {
      await ocuparMesa(mesaId);
      console.log('Mesa ocupada');
    } catch (error) {
      console.error('Erro ao ocupar mesa:', error);
    }
  };

  // Exemplo: Fechar comanda
  const handleFecharComanda = async (comandaId: string) => {
    try {
      await fecharComanda(comandaId, 'cartao', 'Cliente satisfeito');
      console.log('Comanda fechada');
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
    }
  };

  // Exemplo: Dividir conta
  const handleDividirConta = async (comandaId: string) => {
    try {
      const configuracao = {
        type: 'equal' as const,
        person_count: 2,
        splits: [
          {
            person_name: 'João',
            items: [],
            subtotal: 25.00,
            service_charge: 2.50,
            discount: 0,
            total: 27.50
          },
          {
            person_name: 'Maria',
            items: [],
            subtotal: 25.00,
            service_charge: 2.50,
            discount: 0,
            total: 27.50
          }
        ],
        service_charge_percentage: 10
      };

      await dividirConta(comandaId, configuracao);
      console.log('Conta dividida');
    } catch (error) {
      console.error('Erro ao dividir conta:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dados do bar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Erro</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={recarregarDados}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Sistema de Atendimento do Bar
      </h1>

      {/* Métricas */}
      {metricas && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Métricas do Dia
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-600">Comandas</p>
              <p className="text-xl font-bold text-blue-900">
                {metricas.comandas_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Vendas</p>
              <p className="text-xl font-bold text-blue-900">
                R$ {(metricas.total_sales || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Mesas Atendidas</p>
              <p className="text-xl font-bold text-blue-900">
                {metricas.tables_served || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
      {notificacoes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-yellow-900">
              Notificações ({notificacoes.length})
            </h2>
            <button 
              onClick={limparNotificacoes}
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              Limpar Todas
            </button>
          </div>
          <div className="space-y-2">
            {notificacoes.slice(0, 3).map(notif => (
              <div 
                key={notif.id}
                className={`p-2 rounded ${notif.read ? 'bg-gray-100' : 'bg-white'}`}
              >
                <p className="font-medium">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.message}</p>
                {!notif.read && (
                  <button 
                    onClick={() => marcarNotificacaoLida(notif.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mesas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mesas ({mesas.length})
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {mesas.map(mesa => {
            const comanda = obterComandaPorMesa(mesa.id);
            return (
              <div 
                key={mesa.id}
                className={`p-3 rounded-lg border-2 ${
                  mesa.status === 'available' ? 'border-green-300 bg-green-50' :
                  mesa.status === 'occupied' ? 'border-red-300 bg-red-50' :
                  mesa.status === 'reserved' ? 'border-yellow-300 bg-yellow-50' :
                  'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Mesa {mesa.number}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    mesa.status === 'available' ? 'bg-green-200 text-green-800' :
                    mesa.status === 'occupied' ? 'bg-red-200 text-red-800' :
                    mesa.status === 'reserved' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {mesa.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">
                  Capacidade: {mesa.capacity} pessoas
                </p>
                
                {comanda && (
                  <div className="mt-2 p-2 bg-white rounded">
                    <p className="text-sm font-medium">
                      {comanda.customer_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: R$ {(comanda.total || 0).toFixed(2)}
                    </p>
                  </div>
                )}
                
                <div className="mt-2 flex gap-1">
                  {mesa.status === 'available' && (
                    <button 
                      onClick={() => handleOcuparMesa(mesa.id)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Ocupar
                    </button>
                  )}
                  {mesa.status === 'occupied' && (
                    <button 
                      onClick={() => liberarMesa(mesa.id)}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Liberar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comandas Abertas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comandas Abertas ({comandas.length})
        </h2>
        <div className="space-y-3">
          {comandas.map(comanda => (
            <div 
              key={comanda.id}
              className="p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">
                    {comanda.customer_name || 'Cliente'}
                  </p>
                  {comanda.table && (
                    <p className="text-sm text-gray-600">
                      Mesa {comanda.table.number}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    R$ {(comanda.total || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {comanda.items.length} itens
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAdicionarItem(comanda.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Adicionar Item
                </button>
                <button 
                  onClick={() => handleDividirConta(comanda.id)}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Dividir Conta
                </button>
                <button 
                  onClick={() => handleFecharComanda(comanda.id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Fechar Comanda
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={handleCriarComanda}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Nova Comanda
          </button>
          <button 
            onClick={handlePedidoBalcao}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Pedido Balcão
          </button>
          <button 
            onClick={atualizarMetricas}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Atualizar Métricas
          </button>
          <button 
            onClick={recarregarDados}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Recarregar Dados
          </button>
        </div>
      </div>
    </div>
  );
};