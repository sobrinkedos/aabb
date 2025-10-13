import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, AlertTriangle, ShoppingCart, XCircle } from 'lucide-react';
import { InventoryItem, InventoryCategory } from '../../types';

interface InventoryItemCardProps {
  item: InventoryItem;
  categories: InventoryCategory[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, categories, onEdit, onDelete }) => {
  const isLowStock = item.currentStock <= item.minStock;
  const isAvailableForSale = item.availableForSale || false;
  const category = categories.find(cat => cat.id === item.categoryId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow relative ${
        isLowStock 
          ? 'border-red-300' 
          : isAvailableForSale 
          ? 'border-green-300' 
          : 'border-gray-200'
      }`}
    >
      {/* Imagem do produto */}
      {item.image_url && (
        <div className="w-full h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={item.image_url}
            alt={item.name}
            className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}


      <div className="flex items-start justify-between mb-3">
        <div className="pr-4 flex-1">
          <h3 className="font-semibold text-gray-800">{item.name}</h3>
          <p className="text-sm text-gray-500">{category?.name || 'Sem categoria'}</p>
        </div>
        <div className="flex space-x-2 ml-2">
          <button 
            onClick={() => onEdit(item)} 
            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"
            title="Editar item"
            aria-label={`Editar ${item.name}`}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(item.id)} 
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-gray-100"
            title="Excluir item"
            aria-label={`Excluir ${item.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Indicador de Status de Venda */}
      <div className="mb-3">
        {isAvailableForSale ? (
          <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <ShoppingCart size={12} />
            <span>Disponível para venda</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <XCircle size={12} />
            <span>Não disponível para venda</span>
          </div>
        )}
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

      {(isLowStock || !isAvailableForSale) && (
        <div className="flex flex-col space-y-1 mt-2">
          {isLowStock && (
            <div className="flex items-center space-x-1 text-red-600 text-xs">
              <AlertTriangle size={14} />
              <span>Estoque baixo</span>
            </div>
          )}
          {!isAvailableForSale && (
            <div className="flex items-center space-x-1 text-orange-600 text-xs">
              <XCircle size={14} />
              <span>Produto não liberado para venda no balcão</span>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-3 space-y-1">
        <div className="flex justify-between">
          <span>Custo: R$ {item.cost.toFixed(2)}</span>
          <span>Fornecedor: {item.supplier || 'N/A'}</span>
        </div>
        {item.salePrice && (
          <div className="flex justify-between">
            <span className="text-green-600 font-medium">Preço de Venda: R$ {item.salePrice.toFixed(2)}</span>
            {item.marginPercentage && (
              <span className="text-blue-600">Margem: {item.marginPercentage.toFixed(1)}%</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InventoryItemCard;
