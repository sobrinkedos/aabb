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

  // Early return após hooks para evitar violação das regras do React
  if (!isOpen || !comanda) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-white shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            Comanda #{comanda?.id?.substring(0, 8)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComandaDetailsModal;