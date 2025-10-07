import React, { useState, useEffect } from 'react';
import { X, Clock, Users, DollarSign, Plus, Trash2, CreditCard, ShoppingCart } from 'lucide-react';
import { BarTable, Comanda, ComandaItem, TableStatus } from '../../../types';
import { ComandaWithItems } from '../../../types/bar-attendance';

interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

import { useComandas } from '../../../hooks/useComandas';
import { useBarAttendance } from '../../../hooks/useBarAttendance';
import { supabase } from '../../../lib/supabase';

interface MesaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: TableWithComanda | null;
  onStatusChange: (mesaId: string, status: TableStatus) => void;
}

const MesaDetailsModal: React.FC<MesaDetailsModalProps> = ({
  isOpen,
  onClose,
  mesa,
  onStatusChange
}) => {
  // Early return ANTES de todos os hooks
  if (!isOpen || !mesa) return null;

  const { addItemToComanda, removeItemFromComanda } = useComandas();
  const { fecharComanda } = useBarAttendance();
  const [comanda, setComanda] = useState<ComandaWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosingComanda, setIsClosingComanda] = useState(false);

  useEffect(() => {
    if (isOpen && mesa && mesa.status === 'occupied') {
      loadComandaDetails();
    }
  }, [isOpen, mesa]);

  const loadComandaDetails = async () => {
    if (!mesa) return;
    
    try {
      setLoading(true);
      
      // Buscar comanda ativa da mesa com todos os itens
      const { data: comandaData, error } = await supabase
        .from('comandas')
        .select(`
          *,
          bar_tables(number, capacity),
          comanda_items(
            *,
            menu_items(name, price, category)
          )
        `)
        .eq('table_id', mesa.id)
        .eq('status', 'open')
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Ignora erro de "não encontrado"
          throw error;
        }
        setComanda(null);
        return;
      }

      // Mapear para o formato ComandaWithItems
      const comandaComItens: ComandaWithItems = {
        ...comandaData,
        items: comandaData.comanda_items?.map((item: any) => ({
          ...item,
          menu_item: item.menu_items
        })) || [],
        table: comandaData.bar_tables
      };

      setComanda(comandaComItens);
    } catch (error) {
      console.error('Erro ao carregar detalhes da comanda:', error);
      setComanda(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'occupied': return 'text-red-600 bg-red-100';
      case 'reserved': return 'text-yellow-600 bg-yellow-100';
      case 'cleaning': return 'text-gray-600 bg-gray-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'cleaning': return 'Limpeza';
      case 'maintenance': return 'Manutenção';
      default: return 'Indefinido';
    }
  };

  const handleSendToCaixa = async (metodoPagamento: string, observacoes?: string) => {
    if (!comanda) return;
    
    setIsClosingComanda(true);
    
    try {
      console.log('💳 Enviando comanda para o caixa:', comanda.id, 'Método:', metodoPagamento);
      
      // Atualizar status da comanda para pending_payment ao invés de fechar
      const { error } = await supabase
        .from('comandas')
        .update({
          status: 'pending_payment',
          payment_method: metodoPagamento,
          notes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', comanda.id);
      
      if (error) throw error;
      
      console.log('✅ Comanda enviada para o caixa com sucesso');
      
      // Recarregar dados da comanda
      await loadComandaDetails();
      
      // Fechar modal
      setShowCloseModal(false);
      
      // Não liberar a mesa automaticamente - só será liberada após pagamento no caixa
      // onStatusChange(mesa!.id, 'available');
      
    } catch (error) {
      console.error('❌ Erro ao enviar comanda para o caixa:', error);
    } finally {
      setIsClosingComanda(false);
    }
  };

  const handleStatusChange = (newStatus: TableStatus) => {
    if (!mesa) return;
    onStatusChange(mesa.id, newStatus);
    onClose();
  };

  const getTimeDifference = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}min`;
    }
    return `${diffMinutes}min`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Mesa {mesa.number}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mesa.status)}`}>
              {getStatusText(mesa.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Informações básicas da mesa */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">Capacidade</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {mesa.capacity} pessoas
              </span>
            </div>

            {mesa.status === 'occupied' && mesa.occupiedSince && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-900">Tempo de ocupação</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {getTimeDifference(mesa.occupiedSince)}
                </span>
              </div>
            )}
          </div>

          {/* Informações da comanda (se ocupada) */}
          {mesa.status === 'occupied' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações da Comanda
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Carregando comanda...</span>
                </div>
              ) : comanda ? (
                <div className="space-y-4">
                  {/* Resumo da comanda */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Cliente</span>
                        <p className="font-medium">
                          {comanda.customer_name || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Pessoas</span>
                        <p className="font-medium">
                          {comanda.people_count || mesa.peopleCount || 1}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Aberta em</span>
                        <p className="font-medium">
                          {formatTime(comanda.opened_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total da comanda */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign size={20} className="text-green-600" />
                        <span className="font-medium text-gray-900">Total da Comanda</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(comanda.total)}
                      </span>
                    </div>
                  </div>

                  {/* Itens da comanda */}
                  {comanda.items && comanda.items.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Itens da Comanda ({comanda.items.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {comanda.items.map((item, index) => {
                          console.log('🔍 Debug item no MesaDetailsModal:', item);
                          return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.quantity}x {item.menu_item?.name || item.menu_items?.name || `Item #${item.menu_item_id}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Adicionado em {formatTime(item.added_at)}
                              </p>
                              {item.notes && (
                                <p className="text-sm text-gray-500 italic">
                                  Obs: {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                item.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status === 'delivered' ? 'Entregue' :
                                 item.status === 'ready' ? 'Pronto' :
                                 item.status === 'preparing' ? 'Preparando' :
                                 'Pendente'}
                              </span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma comanda encontrada para esta mesa
                </div>
              )}
            </div>
          )}

          {/* Ações rápidas */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {mesa.status === 'available' && (
                <>
                  <button
                    onClick={() => handleStatusChange('occupied')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Ocupar Mesa
                  </button>
                  <button
                    onClick={() => handleStatusChange('reserved')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Reservar Mesa
                  </button>
                </>
              )}
              
              {mesa.status === 'occupied' && (
                <>
                  {comanda && comanda.status === 'open' && comanda.items && comanda.items.length > 0 && (
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors col-span-2 flex items-center justify-center space-x-2"
                    >
                      <DollarSign size={16} />
                      <span>Enviar para Caixa - {formatCurrency(comanda.total)}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('available')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Liberar Mesa
                  </button>
                  <button
                    onClick={() => handleStatusChange('cleaning')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Marcar para Limpeza
                  </button>
                </>
              )}
              
              {(mesa.status === 'cleaning' || mesa.status === 'reserved') && (
                <button
                  onClick={() => handleStatusChange('available')}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors col-span-2"
                >
                  Liberar Mesa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Fechar Comanda */}
      {showCloseModal && comanda && (
        <CloseComandaModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          comanda={comanda}
          onConfirm={handleSendToCaixa}
          isLoading={isClosingComanda}
        />
      )}
    </div>
  );
};

// Modal para fechar comanda
interface CloseComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaWithItems;
  onConfirm: (metodoPagamento: string, observacoes?: string) => void;
  isLoading: boolean;
}

const CloseComandaModal: React.FC<CloseComandaModalProps> = ({
  isOpen,
  onClose,
  comanda,
  onConfirm,
  isLoading
}) => {
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(metodoPagamento, observacoes);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Fechamento de Conta</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-1">
              Comanda {comanda.id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600">
              {comanda.table?.number ? `Mesa ${comanda.table.number}` : 'Balcão'} - {comanda.customer_name || 'Cliente'}
            </p>
          </div>

          {/* Lista de Itens Consumidos */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <ShoppingCart size={18} className="mr-2" />
              Itens Consumidos
            </h3>
            
            {comanda.items && comanda.items.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {comanda.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.menu_item?.name || 'Item'}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x {formatCurrency(item.price)}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1">Obs: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        item.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'delivered' ? 'Entregue' :
                         item.status === 'ready' ? 'Pronto' :
                         item.status === 'preparing' ? 'Preparando' :
                         'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
                <p>Nenhum item encontrado na comanda</p>
                <p className="text-sm">Verifique se a comanda possui itens adicionados</p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total da Conta:</span>
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(comanda.total)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={metodoPagamento}
                onChange={(e) => setMetodoPagamento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="vale_refeicao">Vale Refeição</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações para o caixa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Enviar para Caixa</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MesaDetailsModal;