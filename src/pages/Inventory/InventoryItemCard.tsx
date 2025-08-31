import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit, onDelete }) => {
  const isLowStock = item.currentStock <= item.minStock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow ${isLowStock ? 'border-red-300' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
          <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="flex justify-between items-baseline mb-3">
        <span className="text-2xl font-bold text-gray-800">{item.currentStock}</span>
        <span className="text-sm text-gray-600">/ {item.minStock} {item.unit}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-blue-500'}`} 
          style={{ width: `${Math.min((item.currentStock / (item.minStock * 2)) * 100, 100)}%` }}
        ></div>
      </div>

      {isLowStock && (
        <div className="flex items-center space-x-1 text-red-600 mt-2 text-xs">
          <AlertTriangle size={14} />
          <span>Estoque baixo</span>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-3 flex justify-between">
        <span>Custo: R$ {item.cost.toFixed(2)}</span>
        <span>Fornecedor: {item.supplier || 'N/A'}</span>
      </div>
    </motion.div>
  );
};

export default InventoryItemCard;
