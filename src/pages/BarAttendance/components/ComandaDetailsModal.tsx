import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, User, MapPin, DollarSign, Calculator, Search, Filter } from 'lucide-react';
import { Comanda, ComandaItem, ComandaWithItems, BillSplitConfig } from '../../../types/bar-attendance';
import { useComandas } from '../../../hooks/useComandas';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { MenuItem } from '../../../types';
import DivisaoContaModal from './DivisaoContaModal';
import ComprovantesMultiplos from './ComprovantesMultiplos';

interface ComandaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaWithItems | null;
  onComandaUpdated?: () => void;
}

const ComandaDetailsModal: React.FC<ComandaDetailsModalProps> = ({
  isOpen,
  onClose,
  comanda,
  onComandaUpdated
}) => {
  const { addItemToComanda, updateItemStatus, removeItemFromComanda, updateComandaStatus, createBillSplit, processMultiplePayments } = useComandas();
  const { menuItems } = useMenuItems(true);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDivisaoModal, setShowDivisaoModal] = useState(false);
  const [showComprovantesModal, setShowComprovantesModal] = useState(false);
  const [currentSplitConfig, setCurrentSplitConfig] = useState<BillSplitConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [cart, setCart] = useState<Array<{item: MenuItem, quantity: number, notes: string}>>([]);

  useEffect(() => {
    if (!isOpen) {
      setShowAddItemForm(false);
      setSelectedMenuItem(null);
      setQuantity(1);
      setNotes('');
      setShowDivisaoModal(false);
      setShowComprovantesModal(false);
      setCurrentSplitConfig(null);
      setSearchTerm('');
      setCategoryFilter('all');
      setSuccessMessage('');
      setCart([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  if (!isOpen || !comanda) return null;

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.available;
  });

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTimeElapsed = (openedAt: string) => {
    if (!openedAt) return '0m';
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

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Indefinido';
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const addToCart = () => {
    if (!selectedMenuItem) return;
    
    setCart([...cart, {
      item: selectedMenuItem,
      quantity,
      notes
    }]);
    
    // Reset form
    setSelectedMenuItem(null);
    setQuantity(1);
    setNotes('');
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleAddItems = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      for (const cartItem of cart) {
        await addItemToComanda(comanda.id, {
          menu_item_id: cartItem.item.id,
          quantity: cartItem.quantity,
          price: cartItem.item.price,
          notes: cartItem.notes || undefined
        });
      }

      setSuccessMessage(`${cart.length} item(s) adicionado(s) com sucesso!`);
      setCart([]);
      
      if (onComandaUpdated) {
        onComandaUpdated();
      }
    } catch (error) {
      console.error('Erro ao adicionar itens:', error);
      alert('Erro ao adicionar itens à comanda');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled') => {
    try {
      await updateItemStatus(itemId, newStatus as any);
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

  const handleDividirConta = () => {
    setShowDivisaoModal(true);
  };

  const handleConfirmSplit = async (splitConfig: BillSplitConfig) => {
    try {
      await createBillSplit(comanda.id, splitConfig);
      setCurrentSplitConfig(splitConfig);
      setShowDivisaoModal(false);
      setShowComprovantesModal(true);
    } catch (error) {
      console.error('Erro ao criar divisão de conta:', error);
      alert('Erro ao processar divisão de conta');
    }
  };

  const handleProcessPayments = async (payments: any[]) => {
    try {
      await processMultiplePayments(comanda.id, payments);
      setShowComprovantesModal(false);
      onClose();
      alert('Pagamentos processados com sucesso!');
    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      alert('Erro ao processar pagamentos');
    }
  };

  const totalItems = comanda.items?.length || 0;
  const totalValue = comanda.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const cartTotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  const timeElapsed = getTimeElapsed(comanda.opened_at || '');
  const isOverdue = comanda.opened_at ? new Date().getTime() - new Date(comanda.opened_at).getTime() > (2 * 60 * 60 * 1000) : false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Comanda #{comanda.id?.substring(0, 8)}
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
            title="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Informações da Comanda */}
          <div className="w-80 bg-gray-50 border-r flex flex-col flex-shrink-0">
            <div className="p-6 border-b bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informações</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-500">Mesa</div>
                    <div className="font-semibold">{comanda.table?.number || 'Balcão'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-500">Cliente</div>
                    <div className="font-semibold">{comanda.customer?.name || comanda.customer_name || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-500">Tempo Decorrido</div>
                    <div className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {timeElapsed}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-semibold text-green-600 text-xl">R$ {totalValue.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ações</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddItemForm(!showAddItemForm)}
                  className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    showAddItemForm 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>{showAddItemForm ? 'Fechar Adição' : 'Adicionar Itens'}</span>
                </button>
                
                {comanda.status === 'open' && totalValue > 0 && (
                  <button
                    onClick={handleDividirConta}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calculator className="w-5 h-5" />
                    <span>Dividir Conta</span>
                  </button>
                )}
                
                {comanda.status === 'open' && (
                  <button
                    onClick={handleCloseComanda}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Fechar Comanda
                  </button>
                )}
              </div>

              {/* Resumo do Carrinho */}
              {showAddItemForm && cart.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Carrinho ({cart.length})</h3>
                  <div className="bg-white rounded-lg border p-3 max-h-40 overflow-y-auto">
                    {cart.map((cartItem, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cartItem.item.name}</div>
                          <div className="text-xs text-gray-500">{cartItem.quantity} x R$ {cartItem.item.price.toFixed(2)}</div>
                          {cartItem.notes && (
                            <div className="text-xs text-gray-400 truncate">"{cartItem.notes}"</div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-green-600 ml-2">
                          R$ {(cartItem.item.price * cartItem.quantity).toFixed(2)}
                        </div>
                        <button 
                          onClick={() => removeFromCart(index)}
                          className="ml-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                          title="Remover item do carrinho"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-green-600 text-lg">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handleAddItems}
                      disabled={loading}
                      className="w-full mt-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Adicionando...</span>
                        </>
                      ) : (
                        <span>Adicionar à Comanda</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Área Principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {showAddItemForm ? (
              // Interface de Adição de Itens
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Adicionar Itens à Comanda</h3>
                  
                  {/* Filtros */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar item..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        title="Filtrar por categoria"
                      >
                        <option value="all">Todas as Categorias</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Lista de Itens */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Cardápio ({filteredMenuItems.length} itens)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMenuItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedMenuItem(item)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedMenuItem?.id === item.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-900 text-sm">{item.name}</h5>
                            <span className="text-green-600 font-bold text-sm">R$ {item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{item.description || 'Sem descrição'}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                            {selectedMenuItem?.id === item.id && (
                              <span className="text-blue-600 text-xs font-medium">✓ Selecionado</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredMenuItems.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-lg font-medium mb-2">Nenhum item encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                      </div>
                    )}
                  </div>

                  {/* Configuração do Item Selecionado */}
                  {selectedMenuItem && (
                    <div className="w-80 bg-white border-l flex flex-col h-full">
                      <div className="p-6 flex-1 overflow-y-auto">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">⚙️</span>
                          Configurar Item
                        </h4>
                        
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                          <h5 className="font-bold text-blue-900 text-lg mb-1">{selectedMenuItem.name}</h5>
                          <p className="text-sm text-blue-700 mb-2">{selectedMenuItem.category}</p>
                          <div className="text-2xl font-bold text-green-600">R$ {selectedMenuItem.price.toFixed(2)}</div>
                        </div>
                        
                        <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Quantidade
                          </label>
                          <div className="flex items-center justify-center space-x-4">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-700 rounded-full flex items-center justify-center text-xl font-bold shadow-md transition-all"
                            >
                              −
                            </button>
                            <div className="text-2xl font-bold w-12 text-center">{quantity}</div>
                            <button
                              onClick={() => setQuantity(quantity + 1)}
                              className="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center text-xl font-bold shadow-md transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Observações
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: sem cebola, bem passado..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="mb-6 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
                          <div className="text-center">
                            <div className="text-xs font-bold text-green-700 mb-1">TOTAL</div>
                            <div className="text-2xl font-bold text-green-600">
                              R$ {(selectedMenuItem.price * quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-green-600">
                              {quantity} x R$ {selectedMenuItem.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 pt-0">
                        <button
                          onClick={addToCart}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-bold flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Adicionar ao Carrinho</span>
                        </button>
                        
                        <div className="mt-4 text-center text-xs text-gray-500">
                          O item será adicionado ao carrinho para inclusão posterior
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Lista de Itens da Comanda
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Itens da Comanda ({totalItems})
                    </h3>
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      Total: <span className="font-bold text-green-600">R$ {totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {!comanda.items || comanda.items.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🍽️</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum item na comanda</h4>
                      <p className="text-gray-600 mb-4">Comece adicionando itens do cardápio</p>
                      <button
                        onClick={() => setShowAddItemForm(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Adicionar Itens</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comanda.items.map((item, index) => (
                        <div key={item.id} className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                  {index + 1}
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">
                                  {(item as any).menu_items?.name || (item as any).menu_item?.name || 'Item não encontrado'}
                                </h4>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">📊 Quantidade:</span>
                                  <span className="bg-gray-100 px-2 py-1 rounded">{item.quantity}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">💰 Preço unitário:</span>
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">R$ {item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">🕰️ Adicionado em:</span>
                                  <span>{formatDate((item as any).added_at || '')}</span>
                                </div>
                              </div>
                              
                              {item.notes && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-yellow-800">📝 Observações:</span>
                                    <span className="text-yellow-700">{item.notes}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-3 ml-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  R$ {(item.price * item.quantity).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.quantity} x R$ {item.price.toFixed(2)}
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                {item.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateItemStatus(item.id, 'preparing')}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-1"
                                  >
                                    <span>👨‍🍳</span>
                                    <span>Preparar</span>
                                  </button>
                                )}
                                {item.status === 'preparing' && (
                                  <button
                                    onClick={() => handleUpdateItemStatus(item.id, 'ready')}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center space-x-1"
                                  >
                                    <span>✅</span>
                                    <span>Pronto</span>
                                  </button>
                                )}
                                {item.status === 'ready' && (
                                  <button
                                    onClick={() => handleUpdateItemStatus(item.id, 'delivered')}
                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center space-x-1"
                                  >
                                    <span>🍽️</span>
                                    <span>Entregue</span>
                                  </button>
                                )}
                                
                                {item.status !== 'delivered' && (
                                  <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
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
            )}
          </div>
        </div>

        <DivisaoContaModal
          isOpen={showDivisaoModal}
          onClose={() => setShowDivisaoModal(false)}
          comanda={comanda}
          onConfirmSplit={handleConfirmSplit}
        />

        {currentSplitConfig && (
          <ComprovantesMultiplos
            isOpen={showComprovantesModal}
            onClose={() => setShowComprovantesModal(false)}
            comanda={comanda}
            splitConfig={currentSplitConfig}
            onProcessPayments={handleProcessPayments}
          />
        )}
      </div>
    </div>
  );
};

export default ComandaDetailsModal;