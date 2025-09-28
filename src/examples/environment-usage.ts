/**
 * Exemplo de Uso do Sistema de Ambientes
 * Demonstra como inicializar e usar o sistema de configuração de ambientes
 */

import { environmentSystem, initializeEnvironment } from '../config';

/**
 * Exemplo básico de inicialização
 */
export async function basicUsageExample() {
  try {
    console.log('=== Exemplo Básico de Uso ===');
    
    // Inicializa o sistema
    const initResult = await initializeEnvironment();
    
    console.log('Resultado da inicialização:', {
      ambiente: initResult.environment,
      conectividade: initResult.connectivity ? 'OK' : 'FALHA',
      banco: initResult.config.databaseName
    });

    // Obtém configuração atual
    const config = await environmentSystem.getConfig();
    console.log('Configuração atual:', {
      nome: config.name,
      url: config.supabaseUrl,
      debug: config.debugMode
    });

  } catch (error) {
    console.error('Erro no exemplo básico:', error);
  }
}

/**
 * Exemplo de verificação de saúde do sistema
 */
export async function healthCheckExample() {
  try {
    console.log('=== Exemplo de Health Check ===');
    
    await initializeEnvironment();
    
    // Executa verificação completa
    const healthCheck = await environmentSystem.performHealthCheck();
    
    console.log('Status geral:', healthCheck.overall.status);
    console.log('Score:', `${healthCheck.overall.score}%`);
    
    console.log('Detalhes dos serviços:');
    console.log('- Database:', healthCheck.database.isConnected ? 'OK' : 'FALHA');
    console.log('- Auth:', healthCheck.auth.isConnected ? 'OK' : 'FALHA');
    console.log('- Storage:', healthCheck.storage.isConnected ? 'OK' : 'FALHA');
    console.log('- Realtime:', healthCheck.realtime.isConnected ? 'OK' : 'FALHA');

  } catch (error) {
    console.error('Erro no health check:', error);
  }
}

/**
 * Exemplo de informações detalhadas do sistema
 */
export async function systemInfoExample() {
  try {
    console.log('=== Informações do Sistema ===');
    
    await initializeEnvironment();
    
    const systemInfo = await environmentSystem.getSystemInfo();
    
    console.log('Informações completas:', {
      ambiente: systemInfo.environment,
      branch: systemInfo.branch,
      banco: systemInfo.database,
      inicializado: systemInfo.initialized,
      statusGeral: systemInfo.connectivity.overall.status
    });

  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
  }
}

/**
 * Exemplo de troca de ambiente (para testes)
 */
export async function environmentSwitchExample() {
  try {
    console.log('=== Exemplo de Troca de Ambiente ===');
    
    // Inicializa no ambiente padrão
    await initializeEnvironment();
    let config = await environmentSystem.getConfig();
    console.log('Ambiente inicial:', config.name);
    
    // Troca para produção
    environmentSystem.switchEnvironment('production');
    await initializeEnvironment();
    config = await environmentSystem.getConfig();
    console.log('Após troca para produção:', config.name);
    
    // Volta para desenvolvimento
    environmentSystem.switchEnvironment('development');
    await initializeEnvironment();
    config = await environmentSystem.getConfig();
    console.log('Após volta para desenvolvimento:', config.name);

  } catch (error) {
    console.error('Erro na troca de ambiente:', error);
  }
}

/**
 * Executa todos os exemplos
 */
export async function runAllExamples() {
  console.log('🚀 Executando exemplos do sistema de ambientes...\n');
  
  await basicUsageExample();
  console.log('\n');
  
  await healthCheckExample();
  console.log('\n');
  
  await systemInfoExample();
  console.log('\n');
  
  await environmentSwitchExample();
  
  console.log('\n✅ Todos os exemplos executados!');
}

// Executa exemplos se arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}