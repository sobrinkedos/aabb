import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Member } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

type FormData = Omit<Member, 'id' | 'joinDate'>;

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, member }) => {
  const { addMember, updateMember } = useApp();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      reset(member);
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${name || 'user'}`,
        status: 'active',
        membershipType: 'individual',
      });
    }
  }, [member, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (member) {
        await updateMember({ ...member, ...data });
      } else {
        await addMember(data);
      }
      onClose();
    } catch (error) {
      console.error("Falha ao salvar o membro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses: Member['status'][] = ['active', 'inactive', 'pending'];
  const types: Member['membershipType'][] = ['individual', 'family', 'vip'];

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
              <h2 className="text-2xl font-bold text-gray-800">{member ? 'Editar Membro' : 'Novo Membro'}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <InputField label="Nome Completo" error={errors.name}>
                <input {...register('name', { required: 'Nome é obrigatório' })} className="form-input" disabled={isSubmitting} />
              </InputField>
              <InputField label="Email" error={errors.email}>
                <input type="email" {...register('email', { required: 'Email é obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })} className="form-input" disabled={isSubmitting} />
              </InputField>
              <InputField label="Telefone" error={errors.phone}>
                <input {...register('phone', { required: 'Telefone é obrigatório' })} className="form-input" disabled={isSubmitting} />
              </InputField>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Status" error={errors.status}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-input" disabled={isSubmitting}>
                        {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    )}
                  />
                </InputField>
                <InputField label="Tipo de Plano" error={errors.membershipType}>
                  <Controller
                    name="membershipType"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-input" disabled={isSubmitting}>
                        {types.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                      </select>
                    )}
                  />
                </InputField>
              </div>
              <InputField label="URL do Avatar" error={errors.avatar}>
                <input {...register('avatar')} className="form-input" disabled={isSubmitting} />
              </InputField>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : (member ? 'Salvar Alterações' : 'Adicionar Membro')}
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

export default MemberModal;
