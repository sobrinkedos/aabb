import React, { useState, useEffect } from 'react';
import { X, Clock, Users, DollarSign, Plus, Trash2 } from 'lucide-react';
import { BarTable, Comanda, ComandaItem, TableStatus } from '../../../types';

interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

interface ComandaWithItems extends Comanda {
  items: ComandaItem[];
}
import { useComandas } from '../../../hooks/useComandas';

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
  const { getComandaByTable, addItemToComanda, removeItemFromComanda } = useComandas();
  const [comanda, setComanda] = useState<ComandaWithItems | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mesa && mesa.status === 'occupied') {
      loadComandaDetails();
    }
  }, [isOpen, mesa]);

  const loadComandaDetails = async () => {
    if (!mesa) return;
    
    try {
      setLoading(true);
      const comandaData = await getComandaByTable(mesa.id);
      setComanda(comandaData);
    } catch (error) {
      console.error('Erro ao carregar detalhes da comanda:', error);
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

  if (!isOpen || !mesa) return null;

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
                        {comanda.items.map((item, index) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.quantity}x Item #{item.menu_item_id}
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
                        ))}
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
    </div>
  );
};

export default MesaDetailsModal;