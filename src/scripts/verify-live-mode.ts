/**
 * Script de Verificação do Modo Live
 * Confirma se o sistema está funcionando com Supabase real
 */

import { environmentSystem } from '../config';
import { isSupabaseConfigured } from '../lib/supabase';

async function verifyLiveMode() {
  console.log('🔍 Verificando ativação do modo live...\n');

  try {
    // 1. Verificar configuração do ambiente
    console.log('📋 Verificando configuração do ambiente...');
    const config = await environmentSystem.getConfig();
    
    console.log(`✅ Ambiente: ${config.name}`);
    console.log(`✅ URL: ${config.supabaseUrl}`);
    console.log(`✅ Database: ${config.databaseName}`);
    console.log(`✅ Debug Mode: ${config.debugMode}`);
    console.log('');

    // 2. Verificar se está usando credenciais reais
    console.log('🔐 Verificando credenciais...');
    const isConfigured = await isSupabaseConfigured();
    
    if (isConfigured) {
      console.log('✅ Credenciais reais do Supabase configuradas');
      console.log('✅ Sistema em modo LIVE');
    } else {
      console.log('❌ Sistema ainda em modo mock');
      console.log('💡 Recarregue a página para aplicar as configurações');
      return false;
    }

    // 3. Testar conectividade
    console.log('\n🌐 Testando conectividade...');
    const healthCheck = await environmentSystem.performHealthCheck();
    
    console.log(`📊 Score geral: ${healthCheck.overall.score}%`);
    console.log(`📊 Status: ${healthCheck.overall.status}`);
    
    // 4. Verificar serviços individuais
    console.log('\n🔧 Status dos serviços:');
    const services = [
      { name: 'Database', status: healthCheck.database },
      { name: 'Auth', status: healthCheck.auth },
      { name: 'Storage', status: healthCheck.storage },
      { name: 'Realtime', status: healthCheck.realtime }
    ];

    services.forEach(service => {
      const icon = service.status.isConnected ? '✅' : '❌';
      const time = service.status.isConnected ? `(${service.status.responseTime}ms)` : '';
      const error = service.status.isConnected ? '' : ` - ${service.status.error}`;
      console.log(`${icon} ${service.name}: ${service.status.isConnected ? 'OK' : 'FALHA'} ${time}${error}`);
    });

    // 5. Resultado final
    console.log('\n🎯 Resultado da verificação:');
    
    if (config.name === 'production' && isConfigured && healthCheck.overall.status === 'healthy') {
      console.log('🎉 MODO LIVE TOTALMENTE ATIVO!');
      console.log('✅ Sistema funcionando com Supabase real');
      console.log('✅ Conectividade perfeita');
      console.log('✅ Pronto para uso em produção');
      return true;
    } else if (config.name === 'production' && isConfigured) {
      console.log('⚠️ MODO LIVE PARCIALMENTE ATIVO');
      console.log('✅ Credenciais configuradas');
      console.log('⚠️ Alguns serviços podem estar indisponíveis');
      console.log('💡 Verifique a conectividade e configuração do banco');
      return true;
    } else {
      console.log('❌ MODO LIVE NÃO ATIVO');
      console.log('💡 Recarregue a página para aplicar as configurações');
      return false;
    }

  } catch (error) {
    console.error('💥 Erro na verificação:', error);
    console.log('\n🆘 Possíveis soluções:');
    console.log('1. Recarregue a página completamente (Ctrl+F5)');
    console.log('2. Verifique se as credenciais estão corretas');
    console.log('3. Confirme se o projeto Supabase está ativo');
    console.log('4. Teste a conectividade de rede');
    return false;
  }
}

// Função para mostrar próximos passos
function showNextSteps() {
  console.log('\n📚 Próximos Passos:');
  console.log('1. 🔄 Recarregue a aplicação (Ctrl+F5)');
  console.log('2. 🔍 Acesse /environment para status detalhado');
  console.log('3. 👤 Crie seu primeiro usuário via registro');
  console.log('4. 🗄️ Configure tabelas no Supabase se necessário');
  console.log('5. 🎯 Teste todas as funcionalidades');
}

// Executa verificação se arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyLiveMode()
    .then(success => {
      if (success) {
        console.log('\n🎊 Parabéns! Modo live ativo com sucesso!');
      } else {
        showNextSteps();
      }
      console.log('\n' + '='.repeat(50));
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Erro fatal na verificação:', error);
      showNextSteps();
      process.exit(1);
    });
}

export { verifyLiveMode };