import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { useAuth } from '../../../contexts/AuthContext';
import { MenuItem } from '../../../types';
import { supabase } from '../../../lib/supabase';

interface NovoPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

const NovoPedidoModal: React.FC<NovoPedidoModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { menuItems, loading: loadingMenu } = useMenuItems();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Bebidas');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Bebidas', 'Petiscos', 'Prato Principal'];

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
    } else {
      setCart(prev => prev.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const updateItemNotes = (menuItemId: string, notes: string) => {
    setCart(prev => prev.map(item =>
      item.menuItem.id === menuItemId
        ? { ...item, notes }
        : item
    ));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = typeof item.menuItem.price === 'string' 
        ? parseFloat(item.menuItem.price) 
        : item.menuItem.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0) return;

    try {
      setLoading(true);

      console.log('Criando comanda para usuário:', user.id);
      console.log('Itens do carrinho:', cart);

      // Criar a comanda (pedido no balcão)
      const comandaData = {
        table_id: null, // Pedido no balcão
        customer_name: customerName || 'Balcão',
        employee_id: user.id,
        people_count: 1,
        notes: notes || null,
        status: 'open'
      };

      console.log('Dados da comanda:', comandaData);

      const { data: comanda, error: comandaError } = await supabase
        .from('comandas')
        .insert(comandaData)
        .select()
        .single();

      if (comandaError) {
        console.error('Erro ao criar comanda:', comandaError);
        throw comandaError;
      }

      console.log('Comanda criada:', comanda);

      // Adicionar os itens da comanda um por um
      for (const item of cart) {
        // Validar dados antes de inserir
        if (!item.menuItem.id || !comanda.id) {
          throw new Error('Dados inválidos: ID do item ou comanda não encontrado');
        }

        const price = typeof item.menuItem.price === 'string' 
          ? parseFloat(item.menuItem.price) 
          : item.menuItem.price;

        if (isNaN(price) || price <= 0) {
          throw new Error(`Preço inválido para o item ${item.menuItem.name}: ${item.menuItem.price}`);
        }

        const comandaItem = {
          comanda_id: comanda.id,
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          price: price,
          notes: item.notes || null,
          status: 'pending'
        };

        console.log('Inserindo item:', comandaItem);

        const { data: insertedItem, error: itemError } = await supabase
          .from('comanda_items')
          .insert(comandaItem)
          .select()
          .single();

        if (itemError) {
          console.error('Erro ao criar item da comanda:', itemError);
          console.error('Dados do item que causou erro:', comandaItem);
          console.error('Detalhes do erro:', {
            message: itemError.message,
            details: itemError.details,
            hint: itemError.hint,
            code: itemError.code
          });
          throw itemError;
        }

        console.log('Item inserido com sucesso:', insertedItem);
      }

      console.log('Itens da comanda criados com sucesso');

      // Limpar o formulário e fechar
      setCart([]);
      setCustomerName('');
      setNotes('');
      onClose();
      
      alert('Pedido criado com sucesso!');
    } catch (err) {
      console.error('Erro completo ao criar pedido:', err);
      alert(`Erro ao criar pedido: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Novo Pedido - Balcão</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>



        <div className="flex h-[calc(90vh-120px)]">
          {/* Menu de itens */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Categorias */}
            <div className="flex space-x-2 mb-6">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Grid de itens */}
            {loadingMenu ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        R$ {(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className="w-80 border-l bg-gray-50 p-6 overflow-y-auto">
            <div className="flex items-center mb-4">
              <ShoppingCart className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-semibold">Pedido</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum item selecionado
              </p>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                      <span className="text-sm font-bold text-green-600">
                        R$ {((typeof item.menuItem.price === 'string' ? parseFloat(item.menuItem.price) : item.menuItem.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        R$ {(typeof item.menuItem.price === 'string' ? parseFloat(item.menuItem.price) : item.menuItem.price).toFixed(2)} cada
                      </span>
                    </div>

                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                      placeholder="Observações..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      R$ {getTotalPrice().toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome do cliente (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações do pedido..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={handleSubmit}
                      disabled={loading || cart.length === 0}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {loading ? 'Criando Pedido...' : 'Finalizar Pedido'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoPedidoModal;