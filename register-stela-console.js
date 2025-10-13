// Script para executar no console do navegador para criar o usuário stela@gmail.com
// 1. Abra o navegador na página de registro (localhost:5174/register)
// 2. Abra o console do desenvolvedor (F12)
// 3. Cole e execute este código

console.log('🔧 Iniciando criação do usuário stela@gmail.com...');

// Função para criar o usuário usando a API da aplicação
async function createStelaUser() {
  try {
    // Importar o contexto de autenticação
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = 'https://wznycskqsavpmejwpksp.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('📝 Registrando usuário...');
    
    // Registrar usuário
    const { data, error } = await supabase.auth.signUp({
      email: 'stela@gmail.com',
      password: 'stela123456',
      options: {
        data: {
          name: 'Stela Silva',
          role: 'employee'
        }
      }
    });

    if (error) {
      console.error('❌ Erro ao registrar:', error);
      return;
    }

    console.log('✅ Usuário registrado:', data.user?.id);

    if (data.user) {
      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name: 'Stela Silva',
          email: 'stela@gmail.com',
          role: 'employee',
          avatar_url: 'https://api.dicebear.com/8.x/initials/svg?seed=Stela Silva'
        }]);

      if (profileError) {
        console.warn('⚠️ Erro ao criar perfil:', profileError);
      } else {
        console.log('✅ Perfil criado');
      }

      // Criar vínculo com empresa
      const { error: empresaError } = await supabase
        .from('usuarios_empresa')
        .insert([{
          user_id: data.user.id,
          empresa_id: '00000000-0000-0000-0000-000000000001',
          nome_completo: 'Stela Silva',
          email: 'stela@gmail.com',
          cargo: 'Funcionária',
          tipo_usuario: 'funcionario',
          status: 'ativo',
          ativo: true,
          tem_acesso_sistema: true,
          papel: 'USER'
        }]);

      if (empresaError) {
        console.warn('⚠️ Erro ao criar vínculo com empresa:', empresaError);
      } else {
        console.log('✅ Vínculo com empresa criado');
      }
    }

    console.log('🎉 Usuário stela@gmail.com criado com sucesso!');
    console.log('📧 Email: stela@gmail.com');
    console.log('🔑 Senha: stela123456');
    console.log('🏢 Empresa: AABB Garanhuns');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar a função
createStelaUser();