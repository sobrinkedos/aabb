/**
 * Script de Validação da Configuração do Supabase
 * Verifica se as credenciais estão configuradas corretamente
 */

import { environmentSystem } from '../config';

async function validateSupabaseConfig() {
  console.log('🔍 Validando configuração do Supabase...\n');

  try {
    // 1. Obter configuração atual
    console.log('📋 Obtendo configuração atual...');
    const config = await environmentSystem.getConfig();
    
    console.log(`✅ Ambiente detectado: ${config.name}`);
    console.log(`✅ Banco de dados: ${config.databaseName}`);
    console.log(`✅ URL: ${config.supabaseUrl}`);
    console.log('');

    // 2. Validar URL
    console.log('🌐 Validando URL do Supabase...');
    if (!config.supabaseUrl || config.supabaseUrl.includes('mock') || config.supabaseUrl.includes('exemplo')) {
      console.error('❌ URL do Supabase não configurada ou usando valor de exemplo');
      console.log('💡 Configure VITE_SUPABASE_URL no arquivo .env.local');
      return false;
    }
    
    if (!config.supabaseUrl.includes('.supabase.co')) {
      console.error('❌ URL do Supabase parece inválida (deve conter .supabase.co)');
      return false;
    }
    
    console.log('✅ URL do Supabase válida');

    // 3. Validar chave anônima
    console.log('🔑 Validando chave anônima...');
    if (!config.supabaseAnonKey || 
        config.supabaseAnonKey.includes('exemplo') || 
        config.supabaseAnonKey.includes('mock') ||
        config.supabaseAnonKey.length < 100) {
      console.error('❌ Chave anônima não configurada ou inválida');
      console.log('💡 Configure VITE_SUPABASE_ANON_KEY no arquivo .env.local');
      return false;
    }
    
    console.log('✅ Chave anônima configurada');

    // 4. Validar chave de serviço
    console.log('🛡️ Validando chave de serviço...');
    if (!config.supabaseServiceRoleKey || 
        config.supabaseServiceRoleKey.includes('exemplo') || 
        config.supabaseServiceRoleKey.includes('mock') ||
        config.supabaseServiceRoleKey.length < 100) {
      console.warn('⚠️ Chave de serviço não configurada ou inválida');
      console.log('💡 Configure VITE_SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local');
      console.log('ℹ️ A chave de serviço é opcional para funcionalidades básicas');
    } else {
      console.log('✅ Chave de serviço configurada');
    }

    // 5. Testar conectividade
    console.log('🔗 Testando conectividade...');
    const healthCheck = await environmentSystem.performHealthCheck();
    
    if (healthCheck.overall.status === 'healthy') {
      console.log(`✅ Conectividade excelente (${healthCheck.overall.score}%)`);
    } else if (healthCheck.overall.status === 'degraded') {
      console.log(`⚠️ Conectividade parcial (${healthCheck.overall.score}%)`);
    } else {
      console.error(`❌ Falha na conectividade (${healthCheck.overall.score}%)`);
    }

    // 6. Detalhes dos serviços
    console.log('\n📊 Status dos serviços:');
    console.log(`  Database: ${healthCheck.database.isConnected ? '✅' : '❌'} ${healthCheck.database.isConnected ? `(${healthCheck.database.responseTime}ms)` : healthCheck.database.error}`);
    console.log(`  Auth: ${healthCheck.auth.isConnected ? '✅' : '❌'} ${healthCheck.auth.isConnected ? `(${healthCheck.auth.responseTime}ms)` : healthCheck.auth.error}`);
    console.log(`  Storage: ${healthCheck.storage.isConnected ? '✅' : '❌'} ${healthCheck.storage.isConnected ? `(${healthCheck.storage.responseTime}ms)` : healthCheck.storage.error}`);
    console.log(`  Realtime: ${healthCheck.realtime.isConnected ? '✅' : '❌'} ${healthCheck.realtime.isConnected ? `(${healthCheck.realtime.responseTime}ms)` : healthCheck.realtime.error}`);

    // 7. Resultado final
    console.log('\n🎯 Resultado da validação:');
    
    if (healthCheck.overall.status === 'healthy') {
      console.log('🎉 Configuração do Supabase está perfeita!');
      console.log('✅ Sistema pronto para uso em produção');
      return true;
    } else if (healthCheck.overall.status === 'degraded') {
      console.log('⚠️ Configuração parcialmente funcional');
      console.log('💡 Alguns serviços podem não estar disponíveis');
      return true;
    } else {
      console.log('❌ Configuração com problemas');
      console.log('🔧 Verifique as credenciais e conectividade');
      return false;
    }

  } catch (error) {
    console.error('💥 Erro na validação:', error);
    console.log('\n🆘 Possíveis soluções:');
    console.log('1. Verifique se o arquivo .env.local existe');
    console.log('2. Confirme se as credenciais estão corretas');
    console.log('3. Teste a conectividade de rede');
    console.log('4. Verifique se o projeto Supabase está ativo');
    return false;
  }
}

// Função para mostrar instruções de configuração
function showConfigurationInstructions() {
  console.log('\n📚 Instruções de Configuração:');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá em Settings → API');
  console.log('4. Copie as credenciais para .env.local:');
  console.log('');
  console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_anonima');
  console.log('VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role');
  console.log('');
  console.log('5. Recarregue a aplicação');
}

// Executa validação se arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSupabaseConfig()
    .then(success => {
      if (!success) {
        showConfigurationInstructions();
      }
      console.log('\n' + '='.repeat(50));
      console.log(success ? '✅ Validação concluída com sucesso!' : '❌ Validação falhou - configure as credenciais');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Erro fatal na validação:', error);
      showConfigurationInstructions();
      process.exit(1);
    });
}

export { validateSupabaseConfig };