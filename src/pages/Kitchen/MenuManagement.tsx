import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Clock, DollarSign, Package } from 'lucide-react';
import { MenuItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import MenuItemModal from './MenuItemModal';
import DirectItemModal from '../../components/DirectItemModal';

interface MenuManagementProps {
  menuItems: MenuItem[];
}

const MenuManagement: React.FC<MenuManagementProps> = ({ menuItems }) => {
  const { removeMenuItem, addMenuItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirectItemModalOpen, setIsDirectItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Filtrar apenas por termo de busca, exibir todos os pratos
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleNewItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleNewDirectItem = () => {
    setIsDirectItemModalOpen(true);
  };

  const handleSaveDirectItem = async (item: Partial<MenuItem>) => {
    try {
      await addMenuItem(item as MenuItem);
      setIsDirectItemModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar produto pronto:', error);
    }
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Gestão de Cardápio</h2>
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewDirectItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Package size={20} />
            <span>Produto Pronto</span>
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
                <span>{item.preparationTime || 0}min</span>
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
      
      <DirectItemModal
        isOpen={isDirectItemModalOpen}
        onClose={() => setIsDirectItemModalOpen(false)}
        onSave={handleSaveDirectItem}
      />
    </div>
  );
};

export default MenuManagement;
