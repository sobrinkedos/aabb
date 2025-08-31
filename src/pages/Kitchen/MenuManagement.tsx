import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { MenuItem } from '../../types';

interface MenuManagementProps {
  menuItems: MenuItem[];
}

const MenuManagement: React.FC<MenuManagementProps> = ({ menuItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Gestão de Cardápio</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Prato</span>
        </motion.button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <input
          type="text"
          placeholder="Buscar pratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todas as Categorias</option>
          <option value="food">Pratos Principais</option>
          <option value="snacks">Petiscos</option>
        </select>
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
                <button className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit size={16} />
                </button>
                <button className="text-gray-400 hover:text-red-600 transition-colors">
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
                {item.category === 'food' ? 'Prato Principal' : 'Petisco'}
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
    </div>
  );
};

export default MenuManagement;
