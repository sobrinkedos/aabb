import React, { useState, useEffect } from 'react';
import { X, Users, Calculator, Receipt, CreditCard } from 'lucide-react';
import { ComandaWithItems, BillSplitConfig, BillSplitDetails, BillSplitType } from '../../../types/bar-attendance';

interface DivisaoContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaWithItems | null;
  onConfirmSplit: (splitConfig: BillSplitConfig) => void;
}

const DivisaoContaModal: React.FC<DivisaoContaModalProps> = ({
  isOpen,
  onClose,
  comanda,
  onConfirmSplit
}) => {
  // Early return ANTES de todos os hooks
  if (!isOpen || !comanda) return null;

  const [splitType, setSplitType] = useState<BillSplitType>('equal');
  const [personCount, setPersonCount] = useState(2);
  const [serviceChargePercentage, setServiceChargePercentage] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [splits, setSplits] = useState<BillSplitDetails[]>([]);
  const [personNames, setPersonNames] = useState<string[]>([]);

  // Função para calcular divisão - movida para antes dos useEffect
  const calculateSplit = (type: BillSplitType, count: number, names: string[]) => {
    if (!comanda?.items || comanda.items.length === 0) {
      setSplits([]);
      return;
    }

    const subtotal = comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceCharge = (subtotal * serviceChargePercentage) / 100;
    const totalBeforeDiscount = subtotal + serviceCharge;
    const finalTotal = totalBeforeDiscount - discountAmount;

    let newSplits: BillSplitDetails[] = [];

    if (type === 'equal') {
      const amountPerPerson = finalTotal / count;
      const serviceChargePerPerson = serviceCharge / count;
      const discountPerPerson = discountAmount / count;

      newSplits = names.slice(0, count).map((name, index) => ({
        person_name: name,
        items: comanda.items!.map(item => ({
          menu_item_id: item.menu_item_id,
          name: item.menu_items?.name || 'Item',
          quantity: item.quantity / count,
          price: item.price,
          total: (item.price * item.quantity) / count
        })),
        subtotal: subtotal / count,
        service_charge: serviceChargePerPerson,
        discount: discountPerPerson,
        total: amountPerPerson
      }));
    } else if (type === 'by_item') {
      // Para divisão por item, inicializar com divisão igual e permitir ajustes
      newSplits = names.slice(0, count).map((name) => ({
        person_name: name,
        items: [],
        subtotal: 0,
        service_charge: 0,
        discount: 0,
        total: 0
      }));
    }

    setSplits(newSplits);
  };

  useEffect(() => {
    if (isOpen && comanda) {
      // Inicializar com o número de pessoas da comanda ou 2 como padrão
      const initialPersonCount = comanda.people_count || 2;
      setPersonCount(initialPersonCount);
      
      // Inicializar nomes das pessoas
      const initialNames = Array.from({ length: initialPersonCount }, (_, i) => `Pessoa ${i + 1}`);
      setPersonNames(initialNames);
      
      // Calcular divisão inicial
      calculateSplit('equal', initialPersonCount, initialNames);
    }
  }, [isOpen, comanda]);

  useEffect(() => {
    if (comanda) {
      calculateSplit(splitType, personCount, personNames);
    }
  }, [splitType, personCount, serviceChargePercentage, discountAmount, personNames, comanda]);

  const handlePersonCountChange = (newCount: number) => {
    setPersonCount(newCount);
    const newNames = [...personNames];
    
    if (newCount > personNames.length) {
      // Adicionar novos nomes
      for (let i = personNames.length; i < newCount; i++) {
        newNames.push(`Pessoa ${i + 1}`);
      }
    } else {
      // Remover nomes extras
      newNames.splice(newCount);
    }
    
    setPersonNames(newNames);
  };

  const handlePersonNameChange = (index: number, name: string) => {
    const newNames = [...personNames];
    newNames[index] = name;
    setPersonNames(newNames);
  };

  const assignItemToPerson = (itemIndex: number, personIndex: number, quantity: number) => {
    if (splitType !== 'by_item') return;

    const item = comanda.items![itemIndex];
    const newSplits = [...splits];
    
    // Remover item de todas as pessoas primeiro
    newSplits.forEach(split => {
      split.items = split.items.filter(i => i.menu_item_id !== item.menu_item_id);
    });

    // Adicionar item à pessoa selecionada
    if (quantity > 0) {
      const itemTotal = item.price * quantity;
      newSplits[personIndex].items.push({
        menu_item_id: item.menu_item_id,
        name: item.menu_items?.name || 'Item',
        quantity,
        price: item.price,
        total: itemTotal
      });
    }

    // Recalcular totais
    newSplits.forEach(split => {
      split.subtotal = split.items.reduce((sum, item) => sum + item.total, 0);
      split.service_charge = (split.subtotal * serviceChargePercentage) / 100;
      split.discount = split.subtotal > 0 ? (discountAmount * split.subtotal) / (newSplits.reduce((sum, s) => sum + s.subtotal, 0) || 1) : 0;
      split.total = split.subtotal + split.service_charge - split.discount;
    });

    setSplits(newSplits);
  };

  const handleConfirm = () => {
    const splitConfig: BillSplitConfig = {
      type: splitType,
      person_count: personCount,
      splits,
      service_charge_percentage: serviceChargePercentage,
      discount_amount: discountAmount
    };

    onConfirmSplit(splitConfig);
  };

  const totalOriginal = comanda.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const totalWithCharges = totalOriginal + (totalOriginal * serviceChargePercentage / 100) - discountAmount;
  const totalSplits = splits.reduce((sum, split) => sum + split.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Divisão de Conta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Configurações da Divisão */}
          <div className="lg:w-1/3 p-6 border-r bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Configurações</h3>
            
            {/* Tipo de Divisão */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Divisão
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="equal"
                    checked={splitType === 'equal'}
                    onChange={(e) => setSplitType(e.target.value as BillSplitType)}
                    className="mr-2"
                  />
                  <span>Dividir Igualmente</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="by_item"
                    checked={splitType === 'by_item'}
                    onChange={(e) => setSplitType(e.target.value as BillSplitType)}
                    className="mr-2"
                  />
                  <span>Dividir por Item</span>
                </label>
              </div>
            </div>

            {/* Número de Pessoas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Pessoas
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={personCount}
                onChange={(e) => handlePersonCountChange(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Taxa de Serviço */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Serviço (%)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={serviceChargePercentage}
                onChange={(e) => setServiceChargePercentage(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Desconto */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Nomes das Pessoas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomes das Pessoas
              </label>
              <div className="space-y-2">
                {personNames.slice(0, personCount).map((name, index) => (
                  <input
                    key={index}
                    type="text"
                    value={name}
                    onChange={(e) => handlePersonNameChange(index, e.target.value)}
                    placeholder={`Pessoa ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Resumo</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {totalOriginal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Serviço:</span>
                  <span>R$ {(totalOriginal * serviceChargePercentage / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>- R$ {discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>R$ {totalWithCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Soma das divisões:</span>
                  <span>R$ {totalSplits.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:w-2/3 flex flex-col">
            {splitType === 'by_item' && (
              /* Divisão por Item */
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold mb-4">Atribuir Itens às Pessoas</h3>
                <div className="space-y-4">
                  {comanda.items?.map((item, itemIndex) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{item.menu_items?.name}</h4>
                          <p className="text-sm text-gray-600">
                            R$ {item.price.toFixed(2)} × {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {personNames.slice(0, personCount).map((name, personIndex) => (
                          <div key={personIndex} className="flex items-center space-x-2">
                            <span className="text-sm font-medium min-w-0 flex-1 truncate">{name}:</span>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              step="0.5"
                              placeholder="0"
                              onChange={(e) => assignItemToPerson(itemIndex, personIndex, parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado da Divisão */}
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Resultado da Divisão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {splits.map((split, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{split.person_name}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          R$ {split.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {splitType === 'by_item' && split.items.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Itens:</h5>
                        <div className="space-y-1">
                          {split.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span>R$ {item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1 text-sm text-gray-600 border-t pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {split.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Serviço:</span>
                        <span>R$ {split.service_charge.toFixed(2)}</span>
                      </div>
                      {split.discount > 0 && (
                        <div className="flex justify-between">
                          <span>Desconto:</span>
                          <span>- R$ {split.discount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {Math.abs(totalWithCharges - totalSplits) > 0.01 && (
                    <span className="text-red-600">
                      ⚠️ Diferença de R$ {Math.abs(totalWithCharges - totalSplits).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={Math.abs(totalWithCharges - totalSplits) > 0.01}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Confirmar Divisão</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivisaoContaModal;