// Script para testar conectividade com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wznycskqsavpmejwpksp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conectividade com Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Teste 1: Verificar se consegue acessar a API
    console.log('\n📡 Teste 1: Verificando acesso à API...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar API:', error);
    } else {
      console.log('✅ API acessível:', data);
    }
    
    // Teste 2: Verificar sessão atual
    console.log('\n🔐 Teste 2: Verificando sessão atual...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
    } else {
      console.log('✅ Sessão:', session?.session ? 'Ativa' : 'Nenhuma sessão ativa');
    }
    
    // Teste 3: Tentar fazer login com credenciais de teste
    console.log('\n🔑 Teste 3: Tentando login de teste...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    if (loginError) {
      console.log('ℹ️ Login de teste falhou (esperado):', loginError.message);
    } else {
      console.log('✅ Login de teste bem-sucedido:', loginData);
    }
    
    // Teste 4: Verificar se há tokens armazenados no localStorage
    console.log('\n💾 Teste 4: Verificando tokens no localStorage...');
    if (typeof window !== 'undefined' && window.localStorage) {
      const authToken = localStorage.getItem('sb-wznycskqsavpmejwpksp-auth-token');
      console.log('Token armazenado:', authToken ? 'Presente' : 'Ausente');
      
      if (authToken) {
        try {
          const tokenData = JSON.parse(authToken);
          console.log('Dados do token:', {
            access_token: tokenData.access_token ? 'Presente' : 'Ausente',
            refresh_token: tokenData.refresh_token ? 'Presente' : 'Ausente',
            expires_at: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : 'N/A'
          });
        } catch (e) {
          console.error('❌ Erro ao parsear token:', e);
        }
      }
    } else {
      console.log('ℹ️ localStorage não disponível (ambiente Node.js)');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testConnection().then(() => {
  console.log('\n🏁 Teste de conectividade concluído.');
}).catch(error => {
  console.error('❌ Erro fatal no teste:', error);
});

export { testConnection };