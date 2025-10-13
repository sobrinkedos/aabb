/**
 * Script de Teste do Sistema de Autenticação Mock
 * Valida se o sistema mock está funcionando corretamente
 */

import { mockAuth } from '../services/mockAuth';

async function testMockAuth() {
  console.log('🧪 Testando sistema de autenticação mock...\n');

  // Teste 1: Listar usuários disponíveis
  console.log('📋 Usuários disponíveis:');
  const users = mockAuth.getAvailableUsers();
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
  });
  console.log('');

  // Teste 2: Login com credenciais válidas
  console.log('🔐 Testando login válido...');
  const loginResult = await mockAuth.signInWithPassword('admin@aabb.com', 'admin123');
  
  if (loginResult.error) {
    console.error('❌ Erro no login:', loginResult.error.message);
    return false;
  }

  if (loginResult.user) {
    console.log('✅ Login bem-sucedido:', loginResult.user.name);
  }

  // Teste 3: Verificar sessão
  console.log('📱 Verificando sessão...');
  const session = mockAuth.getSession();
  if (session.data.session) {
    console.log('✅ Sessão ativa:', session.data.session.user.name);
  } else {
    console.error('❌ Sessão não encontrada');
    return false;
  }

  // Teste 4: Logout
  console.log('🚪 Testando logout...');
  await mockAuth.signOut();
  
  const sessionAfterLogout = mockAuth.getSession();
  if (!sessionAfterLogout.data.session) {
    console.log('✅ Logout bem-sucedido');
  } else {
    console.error('❌ Logout falhou');
    return false;
  }

  // Teste 5: Login com credenciais inválidas
  console.log('🔒 Testando login inválido...');
  const invalidLogin = await mockAuth.signInWithPassword('invalid@test.com', 'wrong');
  
  if (invalidLogin.error) {
    console.log('✅ Login inválido rejeitado corretamente:', invalidLogin.error.message);
  } else {
    console.error('❌ Login inválido foi aceito incorretamente');
    return false;
  }

  console.log('\n🎉 Todos os testes do sistema mock passaram!');
  return true;
}

// Executa testes se arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testMockAuth()
    .then(success => {
      console.log(success ? '\n✅ Sistema mock funcionando perfeitamente!' : '\n❌ Problemas encontrados no sistema mock');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Erro fatal nos testes:', error);
      process.exit(1);
    });
}

export { testMockAuth };