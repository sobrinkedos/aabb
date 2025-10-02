import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';
import { InventoryItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { CategoryButton } from '../../components/Products';
import { supabase } from '../../lib/supabase';
import SimplePricingComponent from '../../components/Inventory/SimplePricingComponent';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

type FormData = Omit<InventoryItem, 'id' | 'lastUpdated' | 'category'>;

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, item }) => {
  const { addInventoryItem, updateInventoryItem, inventoryCategories } = useApp();
  const { register, handleSubmit, control, reset, formState: { errors }, watch } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Estados para precificação
  const [pricingData, setPricingData] = useState({
    salePrice: item?.salePrice,
    marginPercentage: item?.marginPercentage || 50,
    pricingMethod: item?.pricingMethod || 'margin' as 'margin' | 'fixed_price'
  });
  
  // Ref para capturar valores atuais de precificação
  const currentPricingRef = React.useRef(pricingData);
  
  // Sincronizar ref com estado
  React.useEffect(() => {
    currentPricingRef.current = pricingData;
    console.log('🔄 Ref de precificação atualizada:', pricingData);
  }, [pricingData]);
  
  // Observar mudanças no custo para recalcular preços
  const watchedCost = watch('cost', item?.cost || 0);

  const loadCategories = async () => {
    try {
      console.log('🔍 Carregando categorias do inventory_categories...');
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.log('✅ Categorias carregadas:', data?.length || 0);
      setCategories(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      
      // Fallback: tentar product_categories se inventory_categories falhar
      try {
        console.log('🔄 Tentando fallback para product_categories...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (fallbackError) throw fallbackError;
        console.log('✅ Categorias do fallback carregadas:', fallbackData?.length || 0);
        setCategories(fallbackData || []);
      } catch (fallbackError) {
        console.error('❌ Erro no fallback também:', fallbackError);
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        categoryId: item.categoryId,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unit: item.unit,
        cost: item.cost,
        supplier: item.supplier,
        availableForSale: item.availableForSale,
        image_url: item.image_url
      });
      
      // Atualizar dados de precificação para item existente
      const itemPricingData = {
        salePrice: item.salePrice,
        marginPercentage: item.marginPercentage || 50,
        pricingMethod: item.pricingMethod || 'margin' as 'margin' | 'fixed_price'
      };
      setPricingData(itemPricingData);
      currentPricingRef.current = itemPricingData;
      console.log('📝 Carregando dados de precificação do item:', itemPricingData);
    } else {
      reset({
        name: '',
        categoryId: '',
        currentStock: undefined,
        minStock: undefined,
        unit: 'unidades',
        cost: undefined,
        supplier: '',
        availableForSale: false,
        image_url: ''
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Capturar valores atuais de precificação
      const currentPricing = currentPricingRef.current;
      
      console.log('💾 Salvando item com dados:', data);
      console.log('💰 Dados de precificação:', currentPricing);
      console.log('🔄 Modo:', item ? 'EDITANDO' : 'CRIANDO NOVO');
      
      const itemDataWithPricing = {
        ...data,
        salePrice: currentPricing.salePrice,
        marginPercentage: currentPricing.marginPercentage,
        pricingMethod: currentPricing.pricingMethod
      };
      
      console.log('📦 Dados finais para salvar:', itemDataWithPricing);
      
      if (item) {
        console.log('✏️ EDITANDO item existente:', item.id);
        console.log('📊 Margem anterior:', item.marginPercentage);
        console.log('📊 Margem nova:', currentPricing.marginPercentage);
        await updateInventoryItem({ ...item, ...itemDataWithPricing });
      } else {
        console.log('➕ CRIANDO novo item');
        await addInventoryItem(itemDataWithPricing);
      }
      onClose();
    } catch (error) {
      console.error("Falha ao salvar o item:", error);
      // Aqui você pode adicionar um feedback de erro para o usuário, como um toast.
    } finally {
      setIsSubmitting(false);
    }
  };

  const units: InventoryItem['unit'][] = ['unidades', 'kg', 'litros', 'garrafas'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-green-500 rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-white">✅ DEPLOY ATUALIZADO: {item ? 'Editar Item' : 'Novo Item no Estoque'}</h2>
                <p className="text-sm text-white mt-1">
                  🚀 VERSÃO FINAL COM PRECIFICAÇÃO FUNCIONANDO - {new Date().toLocaleTimeString()} - {item ? 'Atualize as informações do item' : 'Adicione um novo item ao inventário'}
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors duration-200"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* SISTEMA DE PRECIFICAÇÃO FUNCIONAL */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '20px',
                margin: '15px 0'
              }}>
                <h3 style={{ 
                  color: '#1e40af', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💰 Sistema de Precificação - VERSÃO ATUALIZADA ✅
                </h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Método de Precificação:
                  </label>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="radio" 
                        name="pricingMethod" 
                        value="margin"
                        defaultChecked
                        onChange={() => {
                          console.log('Método selecionado: Margem');
                          const newData = { ...currentPricingRef.current, pricingMethod: 'margin' as 'margin' | 'fixed_price' };
                          setPricingData(newData);
                          currentPricingRef.current = newData;
                        }}
                      />
                      📈 Por Margem de Lucro
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="radio" 
                        name="pricingMethod" 
                        value="fixed_price"
                        onChange={() => {
                          console.log('Método selecionado: Preço Fixo');
                          const newData = { ...currentPricingRef.current, pricingMethod: 'fixed_price' as 'margin' | 'fixed_price' };
                          setPricingData(newData);
                          currentPricingRef.current = newData;
                        }}
                      />
                      💵 Preço Fixo
                    </label>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      Custo Base:
                    </label>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontWeight: 'bold'
                    }}>
                      R$ {(watchedCost || 0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      Margem de Lucro (%):
                    </label>
                    {pricingData.pricingMethod === 'margin' ? (
                      <input 
                        type="number"
                        key={`margin-${item?.id || 'new'}-${pricingData.marginPercentage}`}
                        value={pricingData.marginPercentage || 50}
                        min="0"
                        step="1"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '16px'
                        }}
                        onChange={(e) => {
                          const margin = Number(e.target.value);
                          const cost = watchedCost || 0;
                          const price = cost * (1 + margin / 100);
                          console.log(`💰 EDITANDO MARGEM - Margem: ${margin}%, Custo: R$ ${cost}, Preço: R$ ${price.toFixed(2)}`);
                          
                          const newData = {
                            ...currentPricingRef.current,
                            marginPercentage: margin,
                            salePrice: price,
                            pricingMethod: 'margin' as 'margin' | 'fixed_price'
                          };
                          
                          setPricingData(newData);
                          currentPricingRef.current = newData;
                          console.log('📊 EDITANDO MARGEM - Dados atualizados:', newData);
                        }}
                      />
                    ) : (
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        color: '#6b7280'
                      }}>
                        {(pricingData.marginPercentage || 0).toFixed(1)}%
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      Preço de Venda:
                    </label>
                    {pricingData.pricingMethod === 'fixed_price' ? (
                      <input 
                        type="number"
                        key={`price-${item?.id || 'new'}-${pricingData.salePrice}`}
                        value={pricingData.salePrice || 0}
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #16a34a',
                          borderRadius: '6px',
                          fontSize: '16px',
                          backgroundColor: '#dcfce7',
                          fontWeight: 'bold',
                          color: '#15803d'
                        }}
                        onChange={(e) => {
                          const price = Number(e.target.value);
                          const cost = watchedCost || 0;
                          const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
                          console.log(`💰 EDITANDO PREÇO FIXO - Preço: R$ ${price}, Custo: R$ ${cost}, Margem: ${margin.toFixed(1)}%`);
                          
                          const newData = {
                            ...currentPricingRef.current,
                            salePrice: price,
                            marginPercentage: margin,
                            pricingMethod: 'fixed_price' as 'margin' | 'fixed_price'
                          };
                          
                          setPricingData(newData);
                          currentPricingRef.current = newData;
                          console.log('📊 EDITANDO PREÇO FIXO - Dados atualizados:', newData);
                        }}
                      />
                    ) : (
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #16a34a',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        color: '#15803d'
                      }}>
                        R$ {(pricingData.salePrice || ((watchedCost || 0) * (1 + (pricingData.marginPercentage || 50) / 100))).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nome do Item - Largura completa */}
              <InputField label="Nome do Item" error={errors.name}>
                <input 
                  {...register('name', { required: 'Nome é obrigatório' })} 
                  className="form-input" 
                  placeholder="Digite o nome do item"
                  disabled={isSubmitting} 
                />
              </InputField>

              {/* Categoria - Largura completa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">Categoria</label>
                  <CategoryButton 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                  />
                </div>
                <Controller
                  name="categoryId"
                  control={control}
                  rules={{ required: 'Categoria é obrigatória' }}
                  render={({ field }) => (
                    <select 
                      {...field} 
                      className="form-select" 
                      disabled={isSubmitting || loadingCategories}
                    >
                      <option value="">
                        {loadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'}
                      </option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-red-500 text-sm flex items-center space-x-1">
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    </span>
                    <span>{errors.categoryId.message}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={loadCategories}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  disabled={loadingCategories}
                >
                  <Settings size={12} />
                  <span>Atualizar categorias</span>
                </button>
              </div>

              {/* Estoques - Grid 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Estoque Atual" error={errors.currentStock}>
                  <input 
                    type="number" 
                    {...register('currentStock', { 
                      required: 'Estoque atual é obrigatório', 
                      valueAsNumber: true, 
                      min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                    })} 
                    className="form-input" 
                    placeholder="0"
                    disabled={isSubmitting} 
                  />
                </InputField>
                <InputField label="Estoque Mínimo" error={errors.minStock}>
                  <input 
                    type="number" 
                    {...register('minStock', { 
                      required: 'Estoque mínimo é obrigatório', 
                      valueAsNumber: true, 
                      min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                    })} 
                    className="form-input" 
                    placeholder="0"
                    disabled={isSubmitting} 
                  />
                </InputField>
              </div>

              {/* Unidade e Custo - Grid 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Unidade" error={errors.unit}>
                  <Controller
                    name="unit"
                    control={control}
                    rules={{ required: 'Unidade é obrigatória' }}
                    render={({ field }) => (
                      <select 
                        {...field} 
                        className="form-select" 
                        disabled={isSubmitting}
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    )}
                  />
                </InputField>
                <InputField label="Custo por Unidade (R$)" error={errors.cost}>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('cost', { 
                      required: 'Custo é obrigatório', 
                      valueAsNumber: true, 
                      min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                    })} 
                    className="form-input" 
                    placeholder="0,00"
                    disabled={isSubmitting} 
                  />
                </InputField>
              </div>

              {/* Fornecedor - Largura completa */}
              <InputField label="Fornecedor (Opcional)" error={errors.supplier}>
                <input 
                  {...register('supplier')} 
                  className="form-input" 
                  placeholder="Nome do fornecedor"
                  disabled={isSubmitting} 
                />
              </InputField>

              {/* URL da Imagem - Largura completa */}
              <InputField label="URL da Imagem (Opcional)" error={errors.image_url}>
                <input 
                  {...register('image_url')} 
                  className="form-input" 
                  placeholder="https://exemplo.com/imagem.jpg"
                  disabled={isSubmitting} 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole aqui o link de uma imagem para representar este item do estoque
                </p>
              </InputField>

              {/* Disponível para Venda */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Controller
                  name="availableForSale"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                  )}
                />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    Disponível para Venda
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Marque esta opção para que o produto apareça automaticamente no balcão e comandas quando houver estoque
                  </p>
                </div>
              </div>



              {/* Botões de ação */}
              <div className="pt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="btn-secondary" 
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex items-center justify-center space-x-2" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{item ? 'Salvar Alterações' : 'Adicionar Item'}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const InputField = ({ label, children, error }: { label: string, children: React.ReactNode, error?: any }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    {children}
    {error && (
      <p className="text-red-500 text-sm flex items-center space-x-1">
        <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        </span>
        <span>{error.message}</span>
      </p>
    )}
  </div>
);

export default ItemModal;
