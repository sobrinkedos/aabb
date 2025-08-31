import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MenuItem } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}

type FormData = {
  name: string;
  description: string;
  price: number;
  category: 'drinks' | 'food' | 'snacks';
  preparationTime?: number;
  available: boolean;
};

const MenuItemModal: React.FC<MenuItemModalProps> = ({ isOpen, onClose, item }) => {
  const { addMenuItem, updateMenuItem } = useApp();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        preparationTime: item.preparationTime || 0,
        available: item.available
      });
    } else {
      reset({
        name: '',
        description: '',
        price: '' as any, // Deixar vazio para não mostrar 0
        category: 'food',
        preparationTime: '' as any, // Deixar vazio para não mostrar 0
        available: true
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    console.log('=== INÍCIO DO SUBMIT ===');
    console.log('Dados recebidos do formulário:', data);
    
    setIsSubmitting(true);
    try {
      const menuItemData = {
        ...data,
        description: data.description || '',
        preparationTime: data.preparationTime || undefined
      };
      
      console.log('Dados processados para envio:', menuItemData);

      if (item) {
        console.log('Modo: Edição de item existente');
        await updateMenuItem({ ...item, ...menuItemData });
      } else {
        console.log('Modo: Criação de novo item');
        await addMenuItem(menuItemData);
      }
      
      console.log('Item salvo com sucesso!');
      
      // Limpar o formulário apenas se for um novo item
      if (!item) {
        reset({
          name: '',
          description: '',
          price: '' as any,
          category: 'food',
          preparationTime: '' as any,
          available: true
        });
      }
      onClose();
    } catch (error) {
      console.error("=== ERRO DETALHADO ===");
      console.error("Tipo do erro:", typeof error);
      console.error("Erro completo:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'N/A');
      
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("Mensagem do erro:", (error as any).message);
      }
      
      alert(`Erro ao salvar o prato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
      console.log('=== FIM DO SUBMIT ===');
    }
  };

  const categories = [
    { value: 'food', label: 'Pratos Principais' },
    { value: 'snacks', label: 'Petiscos' },
    { value: 'drinks', label: 'Bebidas' }
  ];



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
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {item ? 'Editar Prato' : 'Novo Prato'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {item ? 'Atualize as informações do prato' : 'Adicione um novo prato ao cardápio'}
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
              {/* Nome do Prato */}
              <InputField label="Nome do Prato" error={errors.name}>
                <input 
                  {...register('name', { required: 'Nome é obrigatório' })} 
                  className="form-input" 
                  placeholder="Digite o nome do prato"
                  disabled={isSubmitting} 
                />
              </InputField>

              {/* Descrição */}
              <InputField label="Descrição" error={errors.description}>
                <textarea 
                  {...register('description')} 
                  className="form-input min-h-[80px] resize-none" 
                  placeholder="Descreva o prato..."
                  disabled={isSubmitting} 
                />
              </InputField>

              {/* Categoria e Preço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Categoria" error={errors.category}>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: 'Categoria é obrigatória' }}
                    render={({ field }) => (
                      <select 
                        {...field} 
                        className="form-select" 
                        disabled={isSubmitting}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </InputField>

                <InputField label="Preço (R$)" error={errors.price}>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('price', { 
                      required: 'Preço é obrigatório', 
                      valueAsNumber: true, 
                      min: { value: 0.01, message: 'Valor deve ser maior que 0' }
                    })} 
                    className="form-input" 
                    placeholder="Digite o preço"
                    disabled={isSubmitting} 
                  />
                </InputField>
              </div>

              {/* Tempo de Preparo */}
              <InputField label="Tempo de Preparo (min)" error={errors.preparationTime}>
                <input 
                  type="number" 
                  {...register('preparationTime', { 
                    setValueAs: (value) => value === '' || value === null ? undefined : Number(value),
                    min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                  })} 
                  className="form-input" 
                  placeholder="Digite o tempo em minutos"
                  disabled={isSubmitting} 
                />
              </InputField>

              {/* Disponível */}
              <div className="flex items-center space-x-3">
                <Controller
                  name="available"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      checked={field.value}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      disabled={isSubmitting}
                    />
                  )}
                />
                <label className="text-sm font-medium text-gray-700">
                  Prato disponível para pedidos
                </label>
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
                    <span>{item ? 'Salvar Alterações' : 'Adicionar Prato'}</span>
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

export default MenuItemModal;