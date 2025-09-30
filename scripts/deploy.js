#!/usr/bin/env node

/**
 * Script de Deploy Automatizado para Vercel
 * Inclui validações e otimizações
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n🚀 ${step}: ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

// Verificar se comando existe
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Executar comando com output
function runCommand(command, description) {
  try {
    log(`Executando: ${command}`, 'blue');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    logError(`Erro ao executar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Verificar arquivos necessários
function checkRequiredFiles() {
  logStep('STEP 1', 'Verificando arquivos necessários');
  
  const requiredFiles = [
    'package.json',
    'vercel.json',
    '.env.production',
    'src/config/performance.ts',
    'src/middleware/performanceMiddleware.ts'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`${file} encontrado`);
    } else {
      logError(`${file} não encontrado`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Verificar dependências
function checkDependencies() {
  logStep('STEP 2', 'Verificando dependências');
  
  if (!commandExists('node')) {
    logError('Node.js não está instalado');
    return false;
  }
  
  if (!commandExists('npm')) {
    logError('npm não está instalado');
    return false;
  }
  
  logSuccess('Node.js e npm encontrados');
  
  // Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    log('node_modules não encontrado, instalando dependências...', 'yellow');
    if (!runCommand('npm install', 'Instalando dependências')) {
      return false;
    }
  }
  
  logSuccess('Dependências verificadas');
  return true;
}

// Verificar otimizações
function checkOptimizations() {
  logStep('STEP 3', 'Verificando otimizações implementadas');
  
  const optimizationFiles = [
    'src/hooks/usePermissionsCache.ts',
    'src/hooks/useDebounce.ts',
    'src/hooks/useOptimizedCart.ts',
    'src/hooks/usePerformanceMonitor.ts',
    'src/components/permissions/UserPermissionManagerOptimized.tsx',
    'src/components/performance/PerformanceMonitor.tsx',
    'src/pages/Inventory/ItemModalOptimized.tsx'
  ];
  
  let optimizationsCount = 0;
  
  optimizationFiles.forEach(file => {
    if (fs.existsSync(file)) {
      optimizationsCount++;
      logSuccess(`${file} ✅`);
    } else {
      logWarning(`${file} não encontrado`);
    }
  });
  
  log(`\n📊 Otimizações encontradas: ${optimizationsCount}/${optimizationFiles.length}`, 'cyan');
  
  if (optimizationsCount >= optimizationFiles.length * 0.8) {
    logSuccess('Otimizações suficientes para deploy');
    return true;
  } else {
    logWarning('Algumas otimizações estão faltando, mas continuando...');
    return true;
  }
}

// Build do projeto
function buildProject() {
  logStep('STEP 4', 'Fazendo build do projeto');
  
  // Limpar dist anterior
  if (fs.existsSync('dist')) {
    log('Limpando build anterior...', 'yellow');
    runCommand('rm -rf dist', 'Limpando dist');
  }
  
  // Build
  if (!runCommand('npm run build', 'Build do projeto')) {
    return false;
  }
  
  // Verificar se build foi criado
  if (!fs.existsSync('dist')) {
    logError('Pasta dist não foi criada');
    return false;
  }
  
  // Verificar tamanho do build
  try {
    const stats = fs.statSync('dist');
    logSuccess(`Build criado com sucesso`);
    
    // Listar arquivos principais
    if (fs.existsSync('dist/index.html')) {
      logSuccess('index.html encontrado');
    }
    
    if (fs.existsSync('dist/assets')) {
      const assets = fs.readdirSync('dist/assets');
      log(`Assets gerados: ${assets.length} arquivos`, 'blue');
    }
    
  } catch (error) {
    logError('Erro ao verificar build');
    return false;
  }
  
  return true;
}

// Deploy na Vercel
function deployToVercel() {
  logStep('STEP 5', 'Deploy na Vercel');
  
  // Verificar se Vercel CLI está instalado
  if (!commandExists('vercel')) {
    logWarning('Vercel CLI não encontrado, instalando...');
    if (!runCommand('npm install -g vercel', 'Instalando Vercel CLI')) {
      logError('Falha ao instalar Vercel CLI');
      return false;
    }
  }
  
  logSuccess('Vercel CLI encontrado');
  
  // Deploy
  const deployCommand = process.argv.includes('--prod') ? 'vercel --prod' : 'vercel';
  
  log(`\nIniciando deploy: ${deployCommand}`, 'cyan');
  
  if (!runCommand(deployCommand, 'Deploy na Vercel')) {
    return false;
  }
  
  logSuccess('Deploy concluído com sucesso!');
  return true;
}

// Validação pós-deploy
function postDeployValidation() {
  logStep('STEP 6', 'Validação pós-deploy');
  
  log('✅ Checklist de validação:', 'green');
  log('  • Verificar se o site carrega em < 2 segundos');
  log('  • Testar login e permissões');
  log('  • Verificar cache no Network tab do DevTools');
  log('  • Testar busca com debounce');
  log('  • Verificar responsividade mobile');
  log('  • Confirmar que não há erros no console');
  
  log('\n📊 Para monitorar performance:', 'cyan');
  log('  • Abrir DevTools > Console');
  log('  • Procurar por logs: "🎯 Cache HIT" e "⚡ Query"');
  log('  • Usar o botão flutuante de performance (se habilitado)');
}

// Função principal
async function main() {
  log('🚀 DEPLOY AUTOMATIZADO - SISTEMA AABB OTIMIZADO', 'bright');
  log('================================================', 'cyan');
  
  try {
    // Verificações
    if (!checkRequiredFiles()) {
      logError('Arquivos necessários não encontrados');
      process.exit(1);
    }
    
    if (!checkDependencies()) {
      logError('Problemas com dependências');
      process.exit(1);
    }
    
    if (!checkOptimizations()) {
      logError('Problemas com otimizações');
      process.exit(1);
    }
    
    // Build
    if (!buildProject()) {
      logError('Falha no build');
      process.exit(1);
    }
    
    // Deploy
    if (!deployToVercel()) {
      logError('Falha no deploy');
      process.exit(1);
    }
    
    // Validação
    postDeployValidation();
    
    log('\n🎉 DEPLOY CONCLUÍDO COM SUCESSO!', 'green');
    log('Sistema AABB otimizado está agora em produção! 🚀', 'cyan');
    
  } catch (error) {
    logError(`Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  checkRequiredFiles,
  checkDependencies,
  checkOptimizations,
  buildProject,
  deployToVercel
};