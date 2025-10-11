import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../../types';
import { useApp } from '../../contexts/AppContext';


import SimplePricingComponent from '../../components/Inventory/SimplePricingComponent';

interface ItemModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

type FormData = Omit<InventoryItem, 'id' | 'lastUpdated' | 'category'>;



const ItemModalEnhanced: React.FC<ItemModalEnhancedProps> = ({ isOpen, onClose, item }) => {
  const { addInventoryItem, updateInventoryItem, inventoryCategories } = useApp();
  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  // Estados para controle de edição
  const [allowStockEdit, setAllowStockEdit] = useState(false);
  const [allowCostEdit, setAllowCostEdit] = useState(false);
  const [stockEditReason, setStockEditReason] = useState('');
  const [costEditReason, setCostEditReason] = useState('');
  
  // Estados para precificação
  const [pricingData, setPricingData] = useState({
    salePrice: item?.salePrice,
    marginPercentage: item?.marginPercentage || 50,
    pricingMethod: item?.pricingMethod || 'margin' as 'margin' | 'fixed_price'
  });
  
  // Valores originais para comparação
  const [originalValues, setOriginalValues] = useState({
    currentStock: item?.currentStock || 0,
    cost: item?.cost || 0
  });
  
  // Ref para capturar valores atuais de precificação
  const currentPricingRef = React.useRef(pricingData);
  
  // Sincronizar ref com estado
  React.useEffect(() => {
    currentPricingRef.current = pricingData;
  }, [pricingData]);
  
  // Observar mudanças no custo para recalcular preços
  const watchedCost = watch('cost') ?? item?.cost ?? 0;
  
  // Recalcular preços quando custo mudar
  React.useEffect(() => {
    const costValue = Number(watchedCost) || 0;
    if (allowCostEdit && costValue >= 0) {
      const newCost = costValue;
      
      if (pricingData.pricingMethod === 'margin') {
        const newPrice = newCost * (1 + (pricingData.marginPercentage || 50) / 100);
        const newData = {
          ...currentPricingRef.current,
          salePrice: newPrice
        };
        setPricingData(newData);
        currentPricingRef.current = newData;
      } else if (pricingData.pricingMethod === 'fixed_price' && pricingData.salePrice) {
        const newMargin = newCost > 0 ? ((pricingData.salePrice || 0) - newCost) / newCost * 100 : 0;
        const newData = {
          ...currentPricingRef.current,
          marginPercentage: newMargin
        };
        setPricingData(newData);
        currentPricingRef.current = newData;
      }
    }
  }, [watchedCost, pricingData.pricingMethod, allowCostEdit]);



  useEffect(() => {
    if (isOpen) {
      
      if (item) {
        // Resetar form com dados do item
        reset({
          name: item.name,
          categoryId: item.categoryId,
          currentStock: item.currentStock,
          minStock: item.minStock,
          unit: item.unit,
          cost: item.cost,
          supplier: item.supplier,
          availableForSale: item.availableForSale,
          image_url: item.image_url,
          salePrice: item.salePrice,
          marginPercentage: item.marginPercentage,
          pricingMethod: item.pricingMethod
        });
        
        // Definir valores originais
        setOriginalValues({
          currentStock: item.currentStock,
          cost: item.cost || 0
        });
        
        // Resetar estados de edição
        setAllowStockEdit(false);
        setAllowCostEdit(false);
        setStockEditReason('');
        setCostEditReason('');
        
        // Configurar precificação
        setPricingData({
          salePrice: item.salePrice,
          marginPercentage: item.marginPercentage || 50,
          pricingMethod: item.pricingMethod || 'margin'
        });
      } else {
        // Novo item
        reset({
          name: '',
          categoryId: '',
          currentStock: 0,
          minStock: 0,
          unit: 'unidades',
          cost: 0,
          supplier: '',
          availableForSale: false,
          image_url: '',
          salePrice: 0,
          marginPercentage: 50,
          pricingMethod: 'margin'
        });
        
        setOriginalValues({ currentStock: 0, cost: 0 });
        setAllowStockEdit(true);
        setAllowCostEdit(true);
        setPricingData({
          salePrice: 0,
          marginPercentage: 50,
          pricingMethod: 'margin'
        });
      }
    }
  }, [isOpen, item, reset]);

  const handleStockEditToggle = () => {
    if (!allowStockEdit) {
      setAllowStockEdit(true);
      setStockEditReason('Correção de valor inicial incorreto');
    } else {
      setAllowStockEdit(false);
      setStockEditReason('');
      // Restaurar valor original
      setValue('currentStock', originalValues.currentStock);
    }
  };

  const handleCostEditToggle = () => {
    if (!allowCostEdit) {
      setAllowCostEdit(true);
      setCostEditReason('Correção de preço de custo incorreto');
    } else {
      setAllowCostEdit(false);
      setCostEditReason('');
      // Restaurar valor original
      setValue('cost', originalValues.cost);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Capturar dados de precificação atuais
      const currentPricing = currentPricingRef.current;
      
      const itemDataWithPricing = {
        ...data,
        salePrice: currentPricing.salePrice,
        marginPercentage: currentPricing.marginPercentage,
        pricingMethod: currentPricing.pricingMethod
      };

      if (item) {
        // Verificar se houve mudanças significativas
        const stockChanged = data.currentStock !== originalValues.currentStock;
        const costChanged = data.cost !== originalValues.cost;
        
        // Preparar notas para movimentação
        let movementNotes = [];
        
        if (stockChanged && allowStockEdit) {
          movementNotes.push(`CORREÇÃO - Estoque: ${originalValues.currentStock} → ${data.currentStock} (${stockEditReason})`);
        }
        
        if (costChanged && allowCostEdit) {
          movementNotes.push(`CORREÇÃO - Custo: R$ ${originalValues.cost.toFixed(2)} → R$ ${data.cost?.toFixed(2) || '0.00'} (${costEditReason})`);
        }
        
        // Se não permitiu edição mas valores mudaram, restaurar originais
        if (stockChanged && !allowStockEdit) {
          itemDataWithPricing.currentStock = originalValues.currentStock;
        }
        
        if (costChanged && !allowCostEdit) {
          itemDataWithPricing.cost = originalValues.cost;
        }
        
        // Marcar como correção se houve alteração autorizada
        const isCorrection = (stockChanged && allowStockEdit) || (costChanged && allowCostEdit);
        
        // Criar objeto com propriedades extras para correção
        const itemToUpdate = { 
          ...itemDataWithPricing, 
          id: item.id, 
          lastUpdated: new Date()
        } as InventoryItem & { isCorrection?: boolean; correctionNotes?: string };
        
        // Adicionar propriedades de correção se necessário
        if (isCorrection) {
          itemToUpdate.isCorrection = true;
          itemToUpdate.correctionNotes = movementNotes.length > 0 ? movementNotes.join(' | ') : undefined;
        }
        
        await updateInventoryItem(itemToUpdate);
      } else {
        await addInventoryItem(itemDataWithPricing);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {item ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Nome do Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome do produto"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {inventoryCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Estoque Atual com Controle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Estoque Atual *
                </label>
                {item && (
                  <button
                    type="button"
                    onClick={handleStockEditToggle}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                      allowStockEdit 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {allowStockEdit ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {allowStockEdit ? 'Bloquear Edição' : 'Permitir Edição'}
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  {...register('currentStock', { 
                    required: 'Estoque atual é obrigatório',
                    min: { value: 0, message: 'Estoque não pode ser negativo' }
                  })}
                  type="number"
                  step="0.01"
                  disabled={!!(item && !allowStockEdit)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    item && !allowStockEdit 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {item && !allowStockEdit && (
                  <div className="absolute right-3 top-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              
              {allowStockEdit && item && (
                <div className="mt-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          Modo Correção Ativado
                        </h4>
                        <p className="text-xs text-yellow-700 mt-1">
                          O valor inserido será o estoque final, não um incremento. 
                          Uma movimentação de correção será registrada no histórico.
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Motivo da correção:
                  </label>
                  <input
                    type="text"
                    value={stockEditReason}
                    onChange={(e) => setStockEditReason(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: Valor inicial registrado incorretamente"
                  />
                </div>
              )}
              
              {errors.currentStock && (
                <p className="mt-1 text-sm text-red-600">{errors.currentStock.message}</p>
              )}
            </div>

            {/* Estoque Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque Mínimo
              </label>
              <input
                {...register('minStock', { 
                  min: { value: 0, message: 'Estoque mínimo não pode ser negativo' }
                })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.minStock && (
                <p className="mt-1 text-sm text-red-600">{errors.minStock.message}</p>
              )}
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade *
              </label>
              <Controller
                name="unit"
                control={control}
                rules={{ required: 'Unidade é obrigatória' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="kg">Quilogramas</option>
                    <option value="litros">Litros</option>
                    <option value="garrafas">Garrafas</option>
                  </select>
                )}
              />
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>

            {/* Preço de Custo com Controle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Preço de Custo
                </label>
                {item && (
                  <button
                    type="button"
                    onClick={handleCostEditToggle}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                      allowCostEdit 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {allowCostEdit ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {allowCostEdit ? 'Bloquear Edição' : 'Permitir Edição'}
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  {...register('cost', { 
                    min: { value: 0, message: 'Custo não pode ser negativo' }
                  })}
                  type="number"
                  step="0.01"
                  disabled={!!(item && !allowCostEdit)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    item && !allowCostEdit 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {item && !allowCostEdit && (
                  <div className="absolute right-3 top-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              
              {allowCostEdit && item && (
                <div className="mt-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          Modo Correção de Custo Ativado
                        </h4>
                        <p className="text-xs text-yellow-700 mt-1">
                          O valor inserido será o novo custo do produto. 
                          A alteração será registrada no histórico.
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Motivo da correção:
                  </label>
                  <input
                    type="text"
                    value={costEditReason}
                    onChange={(e) => setCostEditReason(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: Preço de custo registrado incorretamente"
                  />
                </div>
              )}
              
              {errors.cost && (
                <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
              )}
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor
              </label>
              <input
                {...register('supplier')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do fornecedor"
              />
            </div>

            {/* Disponível para Venda */}
            <div className="flex items-center">
              <Controller
                name="availableForSale"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <input
                    type="checkbox"
                    {...field}
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                )}
              />
              <label className="ml-2 block text-sm text-gray-900">
                Disponível para venda
              </label>
            </div>

            {/* Precificação */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Precificação</h3>
              <SimplePricingComponent
                cost={Number(watchedCost) || 0}
                onPricingChange={(pricing) => {
                  setPricingData({
                    salePrice: pricing.salePrice || 0,
                    marginPercentage: pricing.marginPercentage || 50,
                    pricingMethod: pricing.pricingMethod
                  });
                }}
              />
            </div>

            {/* Aviso sobre correções vs incrementos */}
            {item && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">
                      Correções vs Incrementos
                    </h4>
                    <div className="text-sm text-blue-700 mt-1 space-y-1">
                      <p>
                        <strong>Correções:</strong> Use os botões "Permitir Edição" acima para corrigir 
                        valores iniciais incorretos. O valor inserido será o estoque/custo final.
                      </p>
                      <p>
                        <strong>Incrementos:</strong> Para adicionar quantidades ao estoque (compras, 
                        recebimentos), utilize a <strong>Atualização Massiva</strong>, que registrará 
                        o incremento corretamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : (item ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ItemModalEnhanced;