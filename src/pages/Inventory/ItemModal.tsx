import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { InventoryItem } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

type FormData = Omit<InventoryItem, 'id' | 'lastUpdated'>;

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, item }) => {
  const { addInventoryItem, updateInventoryItem } = useApp();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      reset(item);
    } else {
      reset({
        name: '',
        category: '',
        currentStock: 0,
        minStock: 0,
        unit: 'unidades',
        cost: 0,
        supplier: ''
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (item) {
        await updateInventoryItem({ ...item, ...data });
      } else {
        await addInventoryItem(data);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">{item ? 'Editar Item' : 'Novo Item no Estoque'}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <InputField label="Nome do Item" error={errors.name}>
                <input {...register('name', { required: 'Nome é obrigatório' })} className="form-input" disabled={isSubmitting} />
              </InputField>
              <InputField label="Categoria" error={errors.category}>
                <input {...register('category', { required: 'Categoria é obrigatória' })} className="form-input" disabled={isSubmitting} />
              </InputField>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Estoque Atual" error={errors.currentStock}>
                  <input type="number" {...register('currentStock', { required: true, valueAsNumber: true, min: 0 })} className="form-input" disabled={isSubmitting} />
                </InputField>
                <InputField label="Estoque Mínimo" error={errors.minStock}>
                  <input type="number" {...register('minStock', { required: true, valueAsNumber: true, min: 0 })} className="form-input" disabled={isSubmitting} />
                </InputField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Unidade" error={errors.unit}>
                  <Controller
                    name="unit"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <select {...field} className="form-input" disabled={isSubmitting}>
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    )}
                  />
                </InputField>
                <InputField label="Custo por Unidade" error={errors.cost}>
                  <input type="number" step="0.01" {...register('cost', { required: true, valueAsNumber: true, min: 0 })} className="form-input" disabled={isSubmitting} />
                </InputField>
              </div>
              <InputField label="Fornecedor" error={errors.supplier}>
                <input {...register('supplier')} className="form-input" disabled={isSubmitting} />
              </InputField>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : (item ? 'Salvar Alterações' : 'Adicionar Item')}
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
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
  </div>
);

export default ItemModal;
