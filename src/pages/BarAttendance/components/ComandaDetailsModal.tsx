import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, User, MapPin, DollarSign } from 'lucide-react';
import { Comanda, ComandaItem } from '../../../types/bar-attendance';
import { useComandas } from '../../../hooks/useComandas';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { MenuItem } from '../../../types';

interface ComandaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: Comanda | null;
}

const ComandaDetailsModal: React.FC<ComandaDetailsModalProps> = ({
  isOpen,
  onClose,
  comanda
}) => {
  const { addItemToComanda, updateItemStatus, removeItemFromComanda, updateComandaStatus } = useComandas();
  const { menuItems } = useMenuItems();
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowAddItemForm(false);
      setSelectedMenuItem('');
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !comanda) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTimeElapsed = (openedAt: string) => {
    const opened = new Date(openedAt);
    const now = new Date();
    const diffMs = now.getTime() - opened.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleAddItem = async () => {
    if (!selectedMenuItem) return;

    const menuItem = menuItems.find(item => item.id === selectedMenuItem);
    if (!menuItem) return;

    setLoading(true);
    try {
      await addItemToComanda(comanda.id, {
        menu_item_id: selectedMenuItem,
        quantity,
        price: menuItem.price,
        notes: notes || undefined
      });

      setShowAddItemForm(false);
      setSelectedMenuItem('');
      setQuantity(1);
      setNotes('');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar item à comanda');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: ComandaItem['status']) => {
    try {
      await updateItemStatus(itemId, newStatus);
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error);
      alert('Erro ao atualizar status do item');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item da comanda?')) return;

    try {
      await removeItemFromComanda(itemId);
    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert('Erro ao remover item da comanda');
    }
  };

  const handleCloseComanda = async () => {
    if (!confirm('Tem certeza que deseja fechar esta comanda?')) return;

    try {
      await updateComandaStatus(comanda.id, 'pending_payment');
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      alert('Erro ao fechar comanda');
    }
  };

  const totalItems = comanda.items?.length || 0;
  const totalValue = comanda.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const timeElapsed = getTimeElapsed(comanda.opened_at);
  const isOverdue = new Date().getTime() - new Date(comanda.opened_at).getTime() > (2 * 60 * 60 * 1000); // 2 horas

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Detalhes da Comanda
            </h2>
            {isOverdue && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                ⚠️ Tempo Excessivo
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informações da Comanda */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Mesa</div>
                <div className="font-semibold">{comanda.table?.number || 'Balcão'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Cliente</div>
                <div className="font-semibold">{comanda.customer?.name || comanda.customer_name || '-'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Tempo Decorrido</div>
                <div className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {timeElapsed}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-semibold text-green-600">R$ {totalValue.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Aberta em: {formatDate(comanda.opened_at)} • {comanda.people_count} pessoas
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddItemForm(!showAddItemForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Item</span>
              </button>
              {comanda.status === 'open' && (
                <button
                  onClick={handleCloseComanda}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Fechar Comanda
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Formulário para adicionar item */}
        {showAddItemForm && (
          <div className="p-6 border-b bg-blue-50">
            <h3 className="text-lg font-semibold mb-4">Adicionar Item à Comanda</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item do Cardápio
                </label>
                <select
                  value={selectedMenuItem}
                  onChange={(e) => setSelectedMenuItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um item</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - R$ {item.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddItemForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedMenuItem || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adicionando...' : 'Adicionar Item'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Itens da Comanda ({totalItems})
            </h3>
            
            {!comanda.items || comanda.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum item adicionado à comanda
              </div>
            ) : (
              <div className="space-y-3">
                {comanda.items.map(item => (
                  <div key={item.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">
                            {item.menu_item?.name || 'Item não encontrado'}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Quantidade: {item.quantity} • Preço unitário: R$ {item.price.toFixed(2)}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            Obs: {item.notes}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          Adicionado em: {formatDate(item.added_at)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'preparing')}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Preparar
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'ready')}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Pronto
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'delivered')}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              Entregue
                            </button>
                          )}
                          {item.status !== 'delivered' && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Remover item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComandaDetailsModal;