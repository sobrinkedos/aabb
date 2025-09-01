import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Package, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { MenuItem, InventoryItem } from '../types';
import { useApp } from '../contexts/AppContext';

interface DirectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>) => void;
}

interface DirectItemFormData {
  name: string;
  description: string;
  price: number;
  category: 'Prato Principal' | 'Petiscos' | 'Bebidas';
  directInventoryItemId: string;
  available: boolean;
}

const DirectItemModal: React.FC<DirectItemModalProps> = ({ isOpen, onClose, onSave }) => {
  const { inventory: inventoryItems } = useApp();
  const [filteredInventoryItems, setFilteredInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<DirectItemFormData>({
    defaultValues: {
      available: true,
      category: 'Bebidas'
    }
  });

  const watchedInventoryItemId = watch('directInventoryItemId');

  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedInventoryItem(null);
      setSearchTerm('');
    }
  }, [isOpen, reset]);

  useEffect(() => {
    const filtered = inventoryItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      item.currentStock > 0
    );
    setFilteredInventoryItems(filtered);
  }, [inventoryItems, searchTerm]);

  useEffect(() => {
    if (watchedInventoryItemId) {
      const item = inventoryItems.find(inv => inv.id === watchedInventoryItemId);
      if (item) {
        setSelectedInventoryItem(item);
        // Auto-preencher campos baseados no item do estoque
        setValue('name', item.name);
        setValue('description', `${item.name} - ${item.unit}`);
        // Sugerir preço com margem de 100%
        setValue('price', item.cost * 2);
      }
    }
  }, [watchedInventoryItemId, inventoryItems, setValue]);

  const onSubmit = (data: DirectItemFormData) => {
    const menuItem: Partial<MenuItem> = {
      ...data,
      itemType: 'direct',
      inventoryItem: selectedInventoryItem || undefined
    };
    onSave(menuItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Adicionar Produto Pronto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Seleção do Item do Estoque */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produto do Estoque *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produto no estoque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {searchTerm && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredInventoryItems.length > 0 ? (
                  filteredInventoryItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setValue('directInventoryItemId', item.id);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Estoque: {item.currentStock} {item.unit} | Custo: R$ {item.cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-center">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
            )}

            {selectedInventoryItem && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">{selectedInventoryItem.name}</div>
                    <div className="text-sm text-blue-700">
                      Estoque: {selectedInventoryItem.currentStock} {selectedInventoryItem.unit} | 
                      Custo: R$ {selectedInventoryItem.cost.toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInventoryItem(null);
                      setValue('directInventoryItemId', '');
                      setValue('name', '');
                      setValue('description', '');
                      setValue('price', 0);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <input
              type="hidden"
              {...register('directInventoryItemId', {
                required: 'Selecione um produto do estoque'
              })}
            />
            {errors.directInventoryItemId && (
              <p className="mt-1 text-sm text-red-600">{errors.directInventoryItemId.message}</p>
            )}
          </div>

          {/* Nome do Item no Cardápio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome no Cardápio *
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Nome é obrigatório',
                minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Cerveja Heineken 350ml"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrição do produto..."
            />
          </div>

          {/* Preço e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Venda (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', {
                  required: 'Preço é obrigatório',
                  min: { value: 0.01, message: 'Preço deve ser maior que zero' }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                {...register('category', { required: 'Categoria é obrigatória' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Bebidas">Bebidas</option>
                <option value="Petiscos">Petiscos</option>
                <option value="Prato Principal">Prato Principal</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Disponível */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('available')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Disponível para venda
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Adicionar Produto
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DirectItemModal;