import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { MenuItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import MenuItemModal from './MenuItemModal';

interface MenuManagementProps {
  menuItems: MenuItem[];
}

const MenuManagement: React.FC<MenuManagementProps> = ({ menuItems }) => {
  const { removeMenuItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Filtrar apenas pratos que precisam de preparo (não produtos prontos do estoque)
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isPreparedItem = item.item_type !== 'direct'; // Excluir itens diretos do estoque
    return matchesSearch && isPreparedItem;
  });

  const handleNewItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`Tem certeza que deseja remover "${item.name}" do cardápio?`)) {
      await removeMenuItem(item.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Gestão de Cardápio</h2>
          <p className="text-sm text-gray-600">
            Gerencie apenas pratos que precisam de preparo na cozinha. 
            <br />
            <span className="text-blue-600 font-medium">
              Produtos prontos do estoque aparecem automaticamente no balcão quando marcados como "Disponível para venda" no módulo Estoque.
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewItem}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Prato</span>
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <input
          type="text"
          placeholder="Buscar pratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleEditItem(item)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteItem(item)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{item.description}</p>

            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock size={14} />
                <span>{item.preparation_time || 0}min</span>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <DollarSign size={14} />
                <span className="font-semibold">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.available ? 'Disponível' : 'Indisponível'}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {item.category === 'Prato Principal' ? 'Prato Principal' : item.category === 'Petiscos' ? 'Petiscos' : 'Bebidas'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum prato encontrado</p>
        </div>
      )}

      <MenuItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
      />
    </div>
  );
};

export default MenuManagement;
