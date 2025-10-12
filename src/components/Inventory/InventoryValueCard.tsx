import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Download, TrendingUp, Package } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryValueCardProps {
  inventory: InventoryItem[];
  onExportReport: () => void;
}

const InventoryValueCard: React.FC<InventoryValueCardProps> = ({ inventory, onExportReport }) => {
  const inventoryStats = useMemo(() => {
    const totalCostValue = inventory.reduce((sum, item) => {
      const cost = item.cost || 0;
      return sum + (cost * item.currentStock);
    }, 0);

    const totalSaleValue = inventory.reduce((sum, item) => {
      const salePrice = item.salePrice || 0;
      return sum + (salePrice * item.currentStock);
    }, 0);

    const potentialProfit = totalSaleValue - totalCostValue;
    const profitMargin = totalCostValue > 0 ? (potentialProfit / totalCostValue) * 100 : 0;

    const availableForSaleItems = inventory.filter(item => item.availableForSale);
    const availableForSaleValue = availableForSaleItems.reduce((sum, item) => {
      const salePrice = item.salePrice || 0;
      return sum + (salePrice * item.currentStock);
    }, 0);

    return {
      totalCostValue,
      totalSaleValue,
      potentialProfit,
      profitMargin,
      availableForSaleValue,
      totalItems: inventory.length,
      availableForSaleCount: availableForSaleItems.length
    };
  }, [inventory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Valor Total do Estoque</h3>
            <p className="text-sm text-gray-600">Baseado nos preços de venda</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExportReport}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          <span className="text-sm font-medium">Exportar</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total de Venda */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Total (Venda)</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {inventoryStats.totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Valor Total de Custo */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Total (Custo)</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {inventoryStats.totalCostValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Lucro Potencial */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Lucro Potencial</p>
              <p className={`text-2xl font-bold ${inventoryStats.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {inventoryStats.potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">
                {inventoryStats.profitMargin.toFixed(1)}% margem
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${inventoryStats.potentialProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>

        {/* Itens Disponíveis para Venda */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Disponível p/ Venda</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {inventoryStats.availableForSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">
                {inventoryStats.availableForSaleCount} de {inventoryStats.totalItems} itens
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Resumo Adicional */}
      <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total de Itens no Estoque:</span>
          <span className="font-semibold text-gray-800">{inventoryStats.totalItems}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Itens Disponíveis para Venda:</span>
          <span className="font-semibold text-gray-800">
            {inventoryStats.availableForSaleCount} ({((inventoryStats.availableForSaleCount / inventoryStats.totalItems) * 100).toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Margem de Lucro Média:</span>
          <span className={`font-semibold ${inventoryStats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {inventoryStats.profitMargin.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryValueCard;