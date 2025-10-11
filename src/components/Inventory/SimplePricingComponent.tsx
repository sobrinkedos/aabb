import React, { useState } from 'react';
import { Calculator, DollarSign, Percent } from 'lucide-react';

interface SimplePricingComponentProps {
  cost: number;
  onPricingChange: (pricing: {
    salePrice?: number;
    marginPercentage?: number;
    pricingMethod: 'margin' | 'fixed_price';
  }) => void;
}

const SimplePricingComponent: React.FC<SimplePricingComponentProps> = ({
  cost,
  onPricingChange
}) => {
  const [method, setMethod] = useState<'margin' | 'fixed_price'>('margin');
  const [margin, setMargin] = useState<number>(50);
  const [fixedPrice, setFixedPrice] = useState<number>(0);

  const calculatePriceFromMargin = (costValue: number, marginValue: number) => {
    return costValue * (1 + marginValue / 100);
  };

  const calculateMarginFromPrice = (costValue: number, priceValue: number) => {
    if (costValue === 0) return 0;
    return ((priceValue - costValue) / costValue) * 100;
  };

  const handleMethodChange = (newMethod: 'margin' | 'fixed_price') => {
    setMethod(newMethod);
    
    if (newMethod === 'margin') {
      onPricingChange({
        marginPercentage: margin,
        pricingMethod: 'margin'
      });
    } else {
      const calculatedPrice = fixedPrice || calculatePriceFromMargin(cost, margin);
      setFixedPrice(calculatedPrice);
      onPricingChange({
        salePrice: calculatedPrice,
        pricingMethod: 'fixed_price'
      });
    }
  };

  const handleMarginChange = (newMargin: number) => {
    setMargin(newMargin);
    onPricingChange({
      marginPercentage: newMargin,
      pricingMethod: 'margin'
    });
  };

  const handlePriceChange = (newPrice: number) => {
    setFixedPrice(newPrice);
    onPricingChange({
      salePrice: newPrice,
      pricingMethod: 'fixed_price'
    });
  };

  const calculatedPrice = method === 'margin' 
    ? calculatePriceFromMargin(cost, margin)
    : fixedPrice;

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-center space-x-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">💰 Configuração de Preços</h3>
      </div>

      {/* Método de Precificação */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Como você quer definir o preço?
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="pricingMethod"
              value="margin"
              checked={method === 'margin'}
              onChange={() => handleMethodChange('margin')}
              className="mr-2"
            />
            <Percent className="w-4 h-4 mr-1 text-green-600" />
            <span className="text-sm font-medium">Por Margem de Lucro</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="pricingMethod"
              value="fixed_price"
              checked={method === 'fixed_price'}
              onChange={() => handleMethodChange('fixed_price')}
              className="mr-2"
            />
            <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
            <span className="text-sm font-medium">Preço Fixo</span>
          </label>
        </div>
      </div>

      {/* Campos de entrada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo Base
          </label>
          <div className="text-lg font-semibold text-gray-800 bg-white p-3 rounded border">
            R$ {cost.toFixed(2)}
          </div>
        </div>

        {method === 'margin' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margem de Lucro (%)
            </label>
            <input
              type="number"
              value={margin}
              onChange={(e) => handleMarginChange(Number(e.target.value))}
              min="0"
              step="1"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="50"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço de Venda (R$)
            </label>
            <input
              type="number"
              value={fixedPrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="15.00"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {method === 'margin' ? 'Preço Final' : 'Margem Resultante'}
          </label>
          <div className="text-lg font-semibold text-green-600 bg-white p-3 rounded border">
            {method === 'margin' 
              ? `R$ ${calculatedPrice.toFixed(2)}`
              : `${calculateMarginFromPrice(cost, fixedPrice).toFixed(1)}%`
            }
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-white p-3 rounded-lg border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">💰 Preço de Venda:</span>
            <span className="font-bold ml-2 text-green-600">R$ {calculatedPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">📈 Margem:</span>
            <span className="font-bold ml-2">{calculateMarginFromPrice(cost, calculatedPrice).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePricingComponent;