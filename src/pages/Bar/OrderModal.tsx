import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, User } from 'lucide-react';
import { MenuItem, OrderItem, BarCustomer } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import CustomerQuickRegister from '../../components/Bar/CustomerQuickRegister';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, menuItems }) => {
  const { addOrder } = useApp();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<BarCustomer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const addItem = (menuItem: MenuItem) => {
    const existingItem = selectedItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setSelectedItems(prev => prev.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}`,
        menuItemId: menuItem.id,
        quantity: 1,
        price: menuItem.price
      };
      setSelectedItems(prev => [...prev, newItem]);
    }
  };

  const removeItem = (menuItemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    
    setSelectedItems(prev => prev.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, quantity }
        : item
    ));
  };

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCustomerSelected = (customer: BarCustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0 || isSubmitting) return;

    // Verificar se cliente foi selecionado
    if (!selectedCustomer) {
      alert('Por favor, selecione um cliente antes de finalizar o pedido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrder({
        tableNumber: tableNumber || undefined,
        items: selectedItems.map(({ id, ...rest }) => rest), // Remove o 'id' do frontend
        status: 'pending',
        employeeId: user!.id,
        customerId: selectedCustomer.id,
        notes: notes || undefined
      });

      // Reset form
      setSelectedItems([]);
      setTableNumber('');
      setNotes('');
      setSelectedCustomer(null);
      onClose();
    } catch (error) {
      console.error("Falha ao criar o pedido:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Novo Pedido</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex h-[70vh]">
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cardápio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <span className="text-lg font-bold text-green-600">
                          R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      <button
                        onClick={() => addItem(item)}
                        disabled={!item.available || isSubmitting}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {item.available ? 'Adicionar' : 'Indisponível'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-1/3 bg-gray-50 p-6 border-l border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedido</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Seção do Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    {selectedCustomer ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">{selectedCustomer.name}</p>
                            <p className="text-sm text-green-600">{selectedCustomer.phone}</p>
                            {selectedCustomer.is_vip && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                ⭐ VIP
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(null)}
                            className="text-green-600 hover:text-green-800"
                            disabled={isSubmitting}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomerModal(true)}
                        className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        <User size={20} className="mr-2" />
                        Selecionar Cliente
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número da Mesa
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {selectedItems.map((item) => {
                      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{menuItem?.name}</p>
                            <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={isSubmitting}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={isSubmitting}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações especiais..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {total.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={selectedItems.length === 0 || isSubmitting || !selectedCustomer}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Confirmando...' : 'Confirmar Pedido'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
          
          {/* Modal de Cadastro de Cliente */}
          {showCustomerModal && (
            <CustomerQuickRegister
              onCustomerSelected={handleCustomerSelected}
              onClose={() => setShowCustomerModal(false)}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrderModal;
