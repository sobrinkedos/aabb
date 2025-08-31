import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import ItemModal from './ItemModal';
import InventoryItemCard from './InventoryItemCard';
import { InventoryItem } from '../../types';

const InventoryModule: React.FC = () => {
  const { inventory, inventoryCategories, removeInventoryItem } = useApp();
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const filteredInventory = useMemo(() => 
    inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [inventory, searchTerm]);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.cost * item.currentStock), 0);
    const lowStockCount = inventory.filter(item => item.currentStock <= item.minStock).length;
    return { totalValue, lowStockCount, totalItems: inventory.length };
  }, [inventory]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Módulo Estoque</h1>
          <p className="text-gray-600">Controle e gestão de inventário</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus size={20} />
          <span>Novo Item</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={DollarSign} title="Valor Total do Estoque" value={`R$ ${stats.totalValue.toFixed(2)}`} color="green" />
        <StatCard icon={Package} title="Itens Totais" value={stats.totalItems} color="blue" />
        <StatCard icon={AlertTriangle} title="Itens com Estoque Baixo" value={stats.lowStockCount} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Itens do Inventário</h2>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => (
            <InventoryItemCard 
              key={item.id} 
              item={item} 
              categories={inventoryCategories}
              onEdit={handleEdit}
              onDelete={removeInventoryItem}
            />
          ))}
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum item encontrado</p>
          </div>
        )}
      </div>

      {showItemModal && (
        <ItemModal
          isOpen={showItemModal}
          onClose={handleCloseModal}
          item={selectedItem}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default InventoryModule;
