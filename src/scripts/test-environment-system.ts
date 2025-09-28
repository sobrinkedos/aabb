/**
 * Script de Teste do Sistema de Ambientes
 * Valida se todos os componentes estão funcionando corretamente
 */

import { environmentSystem, EnvironmentManager, ConnectivityValidator } from '../config';

async function testEnvironmentDetection() {
  console.log('🧪 Testando detecção de ambiente...');
  
  try {
    const manager = EnvironmentManager.getInstance();
    const environment = await manager.detectEnvironment();
    console.log(`✅ Ambiente detectado: ${environment}`);
    
    const envInfo = await manager.getEnvironmentInfo();
    console.log('📊 Informações do ambiente:', envInfo);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na detecção de ambiente:', error);
    return false;
  }
}

async function testConfigurationLoading() {
  console.log('🧪 Testando carregamento de configuração...');
  
  try {
    const config = await environmentSystem.getConfig();
    console.log('✅ Configuração carregada:', {
      nome: config.name,
      banco: config.databaseName,
      debug: config.debugMode,
      hasUrl: !!config.supabaseUrl,
      hasKey: !!config.supabaseAnonKey
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro no carregamento de configuração:', error);
    return false;
  }
}

async function testConnectivityValidation() {
  console.log('🧪 Testando validação de conectividade...');
  
  try {
    const config = await environmentSystem.getConfig();
    const validator = new ConnectivityValidator(config);
    
    console.log('🔍 Testando conectividade básica...');
    const basicResult = await validator.validateConnection();
    console.log(`${basicResult.isConnected ? '✅' : '❌'} Conectividade básica: ${basicResult.isConnected ? 'OK' : basicResult.error}`);
    
    if (basicResult.isConnected) {
      console.log('🔍 Executando health check completo...');
      const healthResult = await validator.performHealthCheck();
      console.log(`✅ Health check: ${healthResult.overall.status} (${healthResult.overall.score}%)`);
    }
    
    return basicResult.isConnected;
  } catch (error) {
    console.error('❌ Erro na validação de conectividade:', error);
    return false;
  }
}

async function testEnvironmentSwitching() {
  console.log('🧪 Testando troca de ambiente...');
  
  try {
    // Obtém ambiente atual
    let config = await environmentSystem.getConfig();
    const originalEnv = config.name;
    console.log(`📍 Ambiente original: ${originalEnv}`);
    
    // Troca para o outro ambiente
    const targetEnv = originalEnv === 'development' ? 'production' : 'development';
    environmentSystem.switchEnvironment(targetEnv);
    
    config = await environmentSystem.getConfig();
    console.log(`📍 Após troca: ${config.name}`);
    
    if (config.name === targetEnv) {
      console.log('✅ Troca de ambiente funcionando');
      
      // Volta para o ambiente original
      environmentSystem.switchEnvironment(originalEnv);
      return true;
    } else {
      console.error('❌ Troca de ambiente falhou');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na troca de ambiente:', error);
    return false;
  }
}

async function testSystemInitialization() {
  console.log('🧪 Testando inicialização completa do sistema...');
  
  try {
    const initResult = await environmentSystem.initialize();
    console.log('✅ Sistema inicializado:', {
      ambiente: initResult.environment,
      conectividade: initResult.connectivity,
      banco: initResult.config.databaseName
    });
    
    const systemInfo = await environmentSystem.getSystemInfo();
    console.log('✅ Informações do sistema obtidas:', {
      ambiente: systemInfo.environment,
      branch: systemInfo.branch,
      inicializado: systemInfo.initialized
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro na inicialização do sistema:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do sistema de ambientes...\n');
  
  const tests = [
    { name: 'Detecção de Ambiente', fn: testEnvironmentDetection },
    { name: 'Carregamento de Configuração', fn: testConfigurationLoading },
    { name: 'Validação de Conectividade', fn: testConnectivityValidation },
    { name: 'Troca de Ambiente', fn: testEnvironmentSwitching },
    { name: 'Inicialização do Sistema', fn: testSystemInitialization }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
    console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSOU' : 'FALHOU'}`);
  }
  
  console.log('\n📊 Resumo dos Testes:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log('='.repeat(50));
  console.log(`📈 Resultado: ${passed}/${total} testes passaram`);
  
  if (passed === total) {
    console.log('🎉 Todos os testes passaram! Sistema funcionando corretamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique a configuração.');
  }
  
  return passed === total;
}

// Executa testes se arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erro fatal nos testes:', error);
      process.exit(1);
    });
}

export { runAllTests };