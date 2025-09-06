import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, User, MapPin, DollarSign, ShoppingCart, Search, ClipboardList } from 'lucide-react';
import { Comanda, ComandaItem, ComandaWithItems } from '../../../types/bar-attendance';
import { useComandas } from '../../../hooks/useComandas';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { MenuItem } from '../../../types';

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
  const { addItemToComanda, updateItemStatus, removeItemFromComanda } = useComandas();
  const { menuItems } = useMenuItems(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<Array<{item: MenuItem, quantity: number, notes: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Reset states when modal closes - DEVE vir antes do early return
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedCategory('all');
      setCart([]);
    }
  }, [isOpen]);

  // Early return após TODOS os hooks para evitar violação das regras do React
  if (!isOpen || !comanda) return null;

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.available;
  });

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  // Add item to cart
  const addToCart = (menuItem: MenuItem) => {
    const existingIndex = cart.findIndex(cartItem => cartItem.item.id === menuItem.id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { item: menuItem, quantity: 1, notes: '' }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(cartItem => cartItem.item.id !== itemId));
  };

  // Update cart item quantity
  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(cartItem => 
      cartItem.item.id === itemId 
        ? { ...cartItem, quantity }
        : cartItem
    ));
  };

  // Add cart items to comanda
  const addCartToComanda = async () => {
    if (cart.length === 0 || !comanda?.id) return;
    
    setLoading(true);
    try {
      for (const cartItem of cart) {
        await addItemToComanda(comanda.id, {
          menu_item_id: cartItem.item.id,
          quantity: cartItem.quantity,
          price: cartItem.item.price,
          notes: cartItem.notes
        });
      }
      setCart([]);
      onComandaUpdated?.();
    } catch (error) {
      console.error('Erro ao adicionar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from comanda
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItemFromComanda(itemId);
      onComandaUpdated?.();
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  // Update item status
  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await updateItemStatus(itemId, newStatus as any);
      onComandaUpdated?.();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Calculate totals
  const comandaTotal = comanda?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const cartTotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  const timeElapsed = comanda?.opened_at ? 
    Math.floor((new Date().getTime() - new Date(comanda.opened_at).getTime()) / (1000 * 60)) : 0;

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              Comanda #{comanda?.id?.substring(0, 8)}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{timeElapsed}min aberta</span>
            </div>
            {comanda?.customer_name && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{comanda.customer_name}</span>
              </div>
            )}
            {comanda?.table_number && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Mesa {comanda.table_number}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Menu Items */}
          <div className="flex-1 flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 border-b bg-gray-50 shrink-0">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar itens do cardápio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMenuItems.map(item => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-blue-300">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <span className="text-sm font-bold text-green-600 ml-2">
                        R$ {item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Cart and Current Items */}
          <div className="w-80 border-l bg-gray-50 flex flex-col">
            {/* Cart Section */}
            <div className="p-3 border-b bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Carrinho ({cart.length})</span>
                </h3>
                {cart.length > 0 && (
                  <span className="text-sm font-bold text-green-600">
                    R$ {cartTotal.toFixed(2)}
                  </span>
                )}
              </div>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  Adicione itens do cardápio
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map(cartItem => (
                    <div key={cartItem.item.id} className="bg-gray-50 p-2 rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-xs">{cartItem.item.name}</span>
                        <button
                          onClick={() => removeFromCart(cartItem.item.id)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                            className="w-5 h-5 bg-gray-200 rounded text-xs hover:bg-gray-300 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-xs font-medium w-6 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="w-5 h-5 bg-gray-200 rounded text-xs hover:bg-gray-300 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-medium">
                          R$ {(cartItem.item.price * cartItem.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {cart.length > 0 && (
                <button
                  onClick={addCartToComanda}
                  disabled={loading}
                  className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  {loading ? 'Adicionando...' : 'Adicionar à Comanda'}
                </button>
              )}
            </div>

            {/* Current Items Section */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4" />
                  <span>Itens da Comanda ({comanda?.items?.length || 0})</span>
                </h3>
                <span className="text-xs font-medium text-blue-600">
                  R$ {comandaTotal.toFixed(2)}
                </span>
              </div>
              
              {!comanda?.items || comanda.items.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-gray-500 text-xs text-center">
                    Comanda vazia
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {comanda.items.map((item) => (
                    <div key={item.id} className="bg-white p-2 rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-xs block truncate">
                          {(item as any).menu_items?.name || (item as any).menu_item?.name || 'Item não encontrado'}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                        <span>Qtd: {item.quantity}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'preparing')}
                              className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-200"
                            >
                              Preparar
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'ready')}
                              className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded hover:bg-green-200"
                            >
                              Pronto
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'delivered')}
                              className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200"
                            >
                              Entregar
                            </button>
                          )}
                        </div>
                        {item.status !== 'delivered' && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComandaDetailsModal;
