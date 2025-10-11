/**
 * Versão Otimizada do ItemModal
 * 
 * Melhorias implementadas:
 * - Cache de categorias
 * - Queries otimizadas
 * - Componentes memoizados
 * - Debounce em campos de entrada
 * - Lazy loading de dados
 * 
 * @version 2.0.0 - Otimizada para Performance
 */

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, TrendingUpIcon } from 'lucide-react';
import { InventoryItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { CategoryButton } from '../../components/Products';
import { executeOptimizedQuery } from '../../middleware/performanceMiddleware';
import { useDebounce } from '../../hooks/useDebounce';
import SimplePricingComponent from '../../components/Inventory/SimplePricingComponent';

// ============================================================================
// INTERFACES
// ============================================================================

interface ItemModalOptimizedProps {
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

// ============================================================================
// COMPONENTES MEMOIZADOS
// ============================================================================

const CategorySelector = memo(({ 
  categories, 
  selectedCategoryId, 
  onCategorySelect,
  loading 
}: {
  categories: Category[];
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map((category) => (
        <CategoryButton
          key={category.id}
          category={category}
          isSelected={selectedCategoryId === category.id}
          onClick={() => onCategorySelect(category.id)}
        />
      ))}
    </div>
  );
});

const PricingSection = memo(({ 
  pricingData, 
  onPricingChange, 
  watchedCost 
}: {
  pricingData: any;
  onPricingChange: (data: any) => void;
  watchedCost: number;
}) => (
  <div className="pricing-section">
    <SimplePricingComponent
      initialData={pricingData}
      cost={watchedCost}
      onChange={onPricingChange}
    />
  </div>
));

const FormField = memo(({ 
  label, 
  name, 
  register, 
  error, 
  type = 'text',
  placeholder,
  ...props 
}: any) => (
  <div className="form-field">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      {...register(name)}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">{error.message}</p>
    )}
  </div>
));

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ItemModalOptimized: React.FC<ItemModalOptimizedProps> = ({ 
  isOpen, 
  onClose, 
  item 
}) => {
  const { addInventoryItem, updateInventoryItem } = useApp();
  const { register, handleSubmit, control, reset, formState: { errors }, watch } = useForm<FormData>();
  
  // Estados otimizados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  
  // Estados para precificação com debounce
  const [pricingData, setPricingData] = useState({
    salePrice: item?.salePrice,
    marginPercentage: item?.marginPercentage || 50,
    pricingMethod: item?.pricingMethod || 'margin' as 'margin' | 'fixed_price'
  });
  
  // Debounce para campos de entrada
  const watchedCost = watch('cost', item?.cost || 0);
  const debouncedCost = useDebounce(watchedCost, 500);
  
  // Ref para capturar valores atuais de precificação
  const currentPricingRef = React.useRef(pricingData);
  
  // ============================================================================
  // MEMOIZAÇÕES PARA PERFORMANCE
  // ============================================================================
  
  // Categorias filtradas e ordenadas
  const sortedCategories = useMemo(() => {
    return categories
      .filter(cat => cat.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);
  
  // Dados iniciais do formulário
  const initialFormData = useMemo(() => {
    if (!item) return {};
    
    return {
      name: item.name,
      categoryId: item.categoryId,
      currentStock: item.currentStock,
      minStock: item.minStock,
      unit: item.unit,
      cost: item.cost,
      supplier: item.supplier,
      availableForSale: item.availableForSale,
      image_url: item.image_url
    };
  }, [item]);
  
  // Estatísticas de performance
  const performanceStats = useMemo(() => {
    return {
      isEditing: !!item,
      categoriesLoaded: categories.length > 0,
      formValid: Object.keys(errors).length === 0,
      hasChanges: JSON.stringify(initialFormData) !== JSON.stringify(watch())
    };
  }, [item, categories.length, errors, initialFormData, watch]);
  
  // ============================================================================
  // FUNÇÕES OTIMIZADAS
  // ============================================================================
  
  // Carregar categorias com cache
  const loadCategories = useCallback(async () => {
    if (categories.length > 0) {
      console.log('🎯 Categorias já carregadas, usando cache local');
      return;
    }
    
    setLoadingCategories(true);
    try {
      console.log('🔍 Carregando categorias (otimizado)...');
      
      // Tentar inventory_categories primeiro
      const { data, error, fromCache } = await executeOptimizedQuery<Category[]>(
        'inventory_categories',
        supabase
          .from('inventory_categories')
          .select('id, name, description, color, is_active')
          .eq('is_active', true)
          .order('name'),
        {
          useCache: true,
          ttl: 10 * 60 * 1000, // 10 minutos
          description: 'inventory_categories_active'
        }
      );

      if (error) {
        console.warn('⚠️ Erro ao carregar inventory_categories, tentando fallback...');
        
        // Fallback para product_categories
        const { data: fallbackData, fromCache: fallbackFromCache } = await executeOptimizedQuery<Category[]>(
          'product_categories',
          supabase
            .from('product_categories')
            .select('id, name, description, color, is_active')
            .eq('is_active', true)
            .order('name'),
          {
            useCache: true,
            ttl: 10 * 60 * 1000,
            description: 'product_categories_fallback'
          }
        );
        
        if (fallbackFromCache) {
          console.log('🎯 Categorias do fallback carregadas do cache!');
        }
        
        setCategories(fallbackData || []);
      } else {
        if (fromCache) {
          console.log('🎯 Categorias carregadas do cache!');
        }
        setCategories(data || []);
      }
      
      console.log(`✅ ${data?.length || 0} categorias carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, [categories.length]);
  
  // Sincronizar ref com estado
  const updatePricingRef = useCallback(() => {
    currentPricingRef.current = pricingData;
    console.log('🔄 Ref de precificação atualizada:', pricingData);
  }, [pricingData]);
  
  // Selecionar categoria
  const selectCategory = useCallback((categoryId: string) => {
    reset(prev => ({ ...prev, categoryId }));
  }, [reset]);
  
  // Atualizar dados de precificação
  const updatePricingData = useCallback((newPricingData: any) => {
    setPricingData(newPricingData);
  }, []);
  
  // Submeter formulário
  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true);
    try {
      console.log('💾 Salvando item (otimizado)...');
      
      const itemData = {
        ...data,
        ...currentPricingRef.current
      };

      if (item) {
        await updateInventoryItem({ ...itemData, id: item.id, lastUpdated: new Date() });
        console.log('✅ Item atualizado com sucesso');
      } else {
        await addInventoryItem(itemData);
        console.log('✅ Item criado com sucesso');
      }

      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar item:', error);
      alert('Erro ao salvar item. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [item, updateInventoryItem, addInventoryItem, onClose]);
  
  // ============================================================================
  // EFEITOS OTIMIZADOS
  // ============================================================================
  
  // Carregar categorias apenas quando modal abre
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);
  
  // Reset do formulário quando item muda
  useEffect(() => {
    if (item) {
      reset(initialFormData);
      setPricingData({
        salePrice: item.salePrice,
        marginPercentage: item.marginPercentage || 50,
        pricingMethod: item.pricingMethod || 'margin'
      });
    } else {
      reset({});
      setPricingData({
        salePrice: undefined,
        marginPercentage: 50,
        pricingMethod: 'margin'
      });
    }
  }, [item, reset, initialFormData]);
  
  // Atualizar ref quando pricing data muda
  useEffect(() => {
    updatePricingRef();
  }, [updatePricingRef]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {item ? 'Editar Item' : 'Novo Item'}
                </h2>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  ⚡ Otimizado
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPerformanceStats(!showPerformanceStats)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Estatísticas de Performance"
                >
                  <TrendingUpIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Estatísticas de Performance */}
            {showPerformanceStats && (
              <div className="p-4 bg-blue-50 border-b">
                <h3 className="text-sm font-medium text-blue-900 mb-2">📊 Performance Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-blue-600">Modo:</span>
                    <span className="ml-1 font-medium">
                      {performanceStats.isEditing ? 'Edição' : 'Criação'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Categorias:</span>
                    <span className="ml-1 font-medium">
                      {performanceStats.categoriesLoaded ? `${categories.length} carregadas` : 'Carregando...'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Formulário:</span>
                    <span className="ml-1 font-medium">
                      {performanceStats.formValid ? 'Válido' : 'Com erros'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Alterações:</span>
                    <span className="ml-1 font-medium">
                      {performanceStats.hasChanges ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Campos básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Nome do Item"
                  name="name"
                  register={register}
                  error={errors.name}
                  placeholder="Ex: Cerveja Heineken"
                />
                
                <FormField
                  label="Unidade"
                  name="unit"
                  register={register}
                  error={errors.unit}
                  placeholder="Ex: unidade, kg, litro"
                />
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
                    <CategorySelector
                      categories={sortedCategories}
                      selectedCategoryId={field.value}
                      onCategorySelect={(categoryId) => {
                        field.onChange(categoryId);
                        selectCategory(categoryId);
                      }}
                      loading={loadingCategories}
                    />
                  )}
                />
              </div>

              {/* Estoque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Estoque Atual"
                  name="currentStock"
                  type="number"
                  register={register}
                  error={errors.currentStock}
                  placeholder="0"
                />
                
                <FormField
                  label="Estoque Mínimo"
                  name="minStock"
                  type="number"
                  register={register}
                  error={errors.minStock}
                  placeholder="0"
                />
              </div>

              {/* Custo e Fornecedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Custo (R$)"
                  name="cost"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.cost}
                  placeholder="0.00"
                />
                
                <FormField
                  label="Fornecedor"
                  name="supplier"
                  register={register}
                  error={errors.supplier}
                  placeholder="Nome do fornecedor"
                />
              </div>

              {/* Precificação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precificação
                </label>
                <PricingSection
                  pricingData={pricingData}
                  onPricingChange={updatePricingData}
                  watchedCost={debouncedCost}
                />
              </div>

              {/* Disponível para venda */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('availableForSale')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Disponível para venda
                </label>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{item ? 'Atualizar' : 'Criar'} Item</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(ItemModalOptimized);