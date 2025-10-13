import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const CreateUserStela: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createStelaUser = async () => {
    setIsCreating(true);
    setMessage('');
    setError('');

    try {
      console.log('🔧 Criando usuário stela@gmail.com...');

      // Registrar usuário usando signUp
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'stela@gmail.com',
        password: 'stela123456',
        options: {
          data: {
            name: 'Stela Silva',
            role: 'employee'
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('Usuário não foi criado');
      }

      console.log('✅ Usuário criado no Auth:', data.user.id);

      // Aguardar um pouco para o usuário ser processado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name: 'Stela Silva',
          role: 'employee',
          avatar_url: 'https://api.dicebear.com/8.x/initials/svg?seed=Stela Silva',
          updated_at: new Date().toISOString()
        }]);

      if (profileError) {
        console.warn('⚠️ Erro