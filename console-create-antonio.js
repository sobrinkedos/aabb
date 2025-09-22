// Script para executar no console do navegador para criar Antonio no Auth
// 1. Abra o console do desenvolvedor (F12) na página de login
// 2. Cole e execute este código

console.log('🔐 Criando usuário Antonio no Supabase Auth...');

// Configuração do Supabase (usando as mesmas credenciais da aplicação)
const supabaseUrl = 'https://wznycskqsavpmejwpksp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';

// Criar cliente Supabase
const { createClient } = window.supabase || await import('https://unpkg.com/@supabase/supabase-js@2');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAntonioUser() {
  try {
    console.log('📝 Registrando usuário Antonio...');
    
    // Criar usuário no Auth
    const { data, error } = await supabase.auth.signUp({
      email: 'antonio@teste.com',
      password: 'X5rm2AV9',
      options: {
        data: {
          name: 'Antonio',
          role: 'funcionario',
          cargo: 'Garçom',
          temporary_password: true
        }
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return;
    }

    if (!data.user) {
      console.error('❌ Usuário não foi criado');
      return;
    }

    const userId = data.user.id;
    console.log('✅ Usuário criado no Auth:', userId);

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Criar perfil
    console.log('👤 Criando perfil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        name: 'Antonio',
        role: 'employee',
        avatar_url: 'https://api.dicebear.com/8.x/initials/svg?seed=Antonio',
        updated_at: new Date().toISOString()
      }]);

    if (profileError) {
      console.warn('⚠️ Erro ao criar perfil:', profileError);
    } else {
      console.log('✅ Perfil criado');
    }

    // Atualizar usuarios_empresa
    console.log('🏢 Atualizando usuarios_empresa...');
    const { error: updateError1 } = await supabase
      .from('usuarios_empresa')
      .update({ 
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', '8c02451f-17b9-43ea-a824-751b6028a182');

    if (updateError1) {
      console.warn('⚠️ Erro ao atualizar usuarios_empresa:', updateError1);
    } else {
      console.log('✅ usuarios_empresa atualizado');
    }

    // Atualizar bar_employees
    console.log('👔 Atualizando bar_employees...');
    const { error: updateError2 } = await supabase
      .from('bar_employees')
      .update({ 
        employee_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', '73f5d604-6cd1-4b79-9606-130558d0fe26');

    if (updateError2) {
      console.warn('⚠️ Erro ao atualizar bar_employees:', updateError2);
    } else {
      console.log('✅ bar_employees atualizado');
    }

    console.log('🎉 SUCESSO! Antonio pode agora fazer login com:');
    console.log('📧 Email: antonio@teste.com');
    console.log('🔑 Senha: X5rm2AV9');
    console.log('⚠️ Deve alterar senha no primeiro login');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a função
createAntonioUser();