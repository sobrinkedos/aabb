import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent } from 'lucide-react';

interface PricingComponentProps {
  cost: number;
  salePrice?: number;
  marginPercentage?: number;
  pricingMethod?: 'margin' | 'fixed_price';
  onPricingChange: (pricing: {
    salePrice?: number;
    marginPercentage?: number;
    pricingMethod: 'margin' | 'fixed_price';
  }) => void;
}

const PricingComponent: React.FC<PricingComponentProps> = ({
  cost,
  salePrice,
  marginPercentage,
  pricingMethod = 'margin',
  onPricingChange
}) => {
  console.log('🏷️ PricingComponent renderizado com:', { cost, salePrice, marginPercentage, pricingMethod });
  
  const [method, setMethod] = useState<'margin' | 'fixed_price'>(pricingMethod);
  const [margin, setMargin] = useState<number>(marginPercentage || 50);
  const [fixedPrice, setFixedPrice] = useState<number>(salePrice || 0);

  // Calcular preço baseado na margem
  const calculatePriceFromMargin = (costValue: number, marginValue: number) => {
    return costValue * (1 + marginValue / 100);
  };

  // Calcular margem baseada no preço
  const calculateMarginFromPrice = (costValue: number, priceValue: number) => {
    if (costValue === 0) return 0;
    return ((priceValue - costValue) / costValue) * 100;
  };

  // Atualizar valores quando o método muda
  useEffect(() => {
    if (method === 'margin') {
      const calculatedPrice = calculatePriceFromMargin(cost, margin);
      onPricingChange({
        marginPercentage: margin,
        pricingMethod: 'margin'
      });
    } else {
      const calculatedMargin = calculateMarginFromPrice(cost, fixedPrice);
      onPricingChange({
        salePrice: fixedPrice,
        marginPercentage: calculatedMargin,
        pricingMethod: 'fixed_price'
      });
    }
  }, [method, margin, fixedPrice, cost, onPricingChange]);

  const handleMethodChange = (newMethod: 'margin' | 'fixed_price') => {
    setMethod(newMethod);
    
    if (newMethod === 'fixed_price' && fixedPrice === 0) {
      // Se mudando para preço fixo e não há preço definido, calcular baseado na margem atual
      const calculatedPrice = calculatePriceFromMargin(cost, margin);
      setFixedPrice(Number(calculatedPrice.toFixed(2)));
    }
  };

  const handleMarginChange = (newMargin: number) => {
    setMargin(newMargin);
  };

  const handlePriceChange = (newPrice: number) => {
    setFixedPrice(newPrice);
  };

  const calculatedPrice = method === 'margin' 
    ? calculatePriceFromMargin(cost, margin)
    : fixedPrice;

  const calculatedMargin = method === 'fixed_price'
    ? calculateMarginFromPrice(cost, fixedPrice)
    : margin;

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border" style={{ minHeight: '200px', border: '2px solid red' }}>
      <div className="flex items-center space-x-2 mb-3">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Precificação</h3>
      </div>

      {/* Método de Precificação */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de Precificação
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="pricingMethod"
              value="margin"
              checked={method === 'margin'}
              onChange={() => handleMethodChange('margin')}
              className="mr-2"
            />
            <Percent className="w-4 h-4 mr-1" />
            Margem de Lucro
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="pricingMethod"
              value="fixed_price"
              checked={method === 'fixed_price'}
              onChange={() => handleMethodChange('fixed_price')}
              className="mr-2"
            />
            <DollarSign className="w-4 h-4 mr-1" />
            Preço Fixo
          </label>
        </div>
      </div>

      {/* Custo Base */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo Base
          </label>
          <div className="text-lg font-semibold text-gray-800 bg-white p-2 rounded border">
            R$ {cost.toFixed(2)}
          </div>
        </div>

        {/* Campo de entrada baseado no método */}
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
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 50"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 15.00"
            />
          </div>
        )}

        {/* Resultado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {method === 'margin' ? 'Preço Calculado' : 'Margem Calculada'}
          </label>
          <div className="text-lg font-semibold text-green-600 bg-white p-2 rounded border">
            {method === 'margin' 
              ? `R$ ${calculatedPrice.toFixed(2)}`
              : `${calculatedMargin.toFixed(1)}%`
            }
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Custo:</span>
            <span className="font-semibold ml-2">R$ {cost.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Preço de Venda:</span>
            <span className="font-semibold ml-2 text-green-600">R$ {calculatedPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Margem:</span>
            <span className="font-semibold ml-2">R$ {(calculatedPrice - cost).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Margem %:</span>
            <span className="font-semibold ml-2">{calculatedMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {calculatedMargin < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">
            ⚠️ Atenção: O preço de venda está abaixo do custo. Você terá prejuízo de {Math.abs(calculatedMargin).toFixed(1)}%.
          </p>
        </div>
      )}

      {calculatedMargin > 0 && calculatedMargin < 20 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            ⚠️ Margem baixa: {calculatedMargin.toFixed(1)}%. Considere aumentar o preço para uma margem mais saudável.
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingComponent;