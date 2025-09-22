// Script para criar o usuário stela@gmail.com
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wznycskqsavpmejwpksp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';

// Você precisa definir a service role key como variável de ambiente
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createUserStela() {
  console.log('🔧 Criando usuário stela@gmail.com...');

  try {
    // Criar usuário no Supabase Auth usando Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'stela@gmail.com',
      password: 'stela123456', // Senha padrão
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: 'Stela Silva'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      return;
    }

    console.log('✅ Usuário criado no Auth:', authUser.user.id);

    // Criar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authUser.user.id,
        name: 'Stela Silva',
        email: 'stela@gmail.com',
        role: 'employee',
        avatar_url: 'https://api.dicebear.com/8.x/initials/svg?seed=Stela Silva',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
    } else {
      console.log('✅ Perfil criado com sucesso');
    }

    // Criar vínculo com empresa (usando a empresa padrão AABB Garanhuns)
    const { error: empresaError } = await supabaseAdmin
      .from('usuarios_empresa')
      .insert([{
        user_id: authUser.user.id,
        empresa_id: '00000000-0000-0000-0000-000000000001', // AABB Garanhuns
        nome_completo: 'Stela Silva',
        email: 'stela@gmail.com',
        cargo: 'Funcionária',
        tipo_usuario: 'funcionario',
        status: 'ativo',
        ativo: true,
        tem_acesso_sistema: true,
        papel: 'USER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (empresaError) {
      console.error('❌ Erro ao criar vínculo com empresa:', empresaError);
    } else {
      console.log('✅ Vínculo com empresa criado com sucesso');
    }

    console.log('🎉 Usuário stela@gmail.com criado com sucesso!');
    console.log('📧 Email: stela@gmail.com');
    console.log('🔑 Senha: stela123456');
    console.log('🏢 Empresa: AABB Garanhuns');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar apenas se a service role key estiver definida
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  createUserStela();
} else {
  console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY não definida.');
  console.log('💡 Para executar este script, defina a variável de ambiente com sua service role key.');
}