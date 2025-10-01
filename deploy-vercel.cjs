#!/usr/bin/env node

/**
 * Script de Deploy para Vercel - AABB System
 * 
 * Este script automatiza o processo de deploy na Vercel,
 * configurando as variáveis de ambiente de produção.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy na Vercel...\n');

// Configurações de produção
const PRODUCTION_ENV = {
  VITE_ENVIRONMENT: 'production',
  VITE_GIT_BRANCH: 'main',
  VITE_SUPABASE_URL: 'https://jtfdzjmravketpkwjkvp.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM1NjIsImV4cCI6MjA3MzkzOTU2Mn0.AOFSlSLFVw-pU1-lpUzxJ2fov3kR95eBlz_92mtSMgs',
  VITE_SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM1NjIsImV4cCI6MjA3MzkzOTU2Mn0.AOFSlSLFVw-pU1-lpUzxJ2fov3kR95eBlz_92mtSMgs',
  VITE_DATABASE_NAME: 'jtfdzjmravketpkwjkvp',
  VITE_DEBUG_MODE: 'false',
  VITE_LOG_LEVEL: 'error',
  VITE_ENABLE_MOCK_DATA: 'false',
  VITE_SUPER_USER_EMAIL: 'riltons@gmail.com',
  VITE_FORCE_REAL_SUPABASE: 'true'
};

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} concluído!\n`);
  } catch (error) {
    console.error(`❌ Erro em: ${description}`);
    console.error(error.message);
    process.exit(1);
  }
}

function setVercelEnvVars() {
  console.log('🔧 Configurando variáveis de ambiente na Vercel...\n');
  
  Object.entries(PRODUCTION_ENV).forEach(([key, value]) => {
    const command = `vercel env add ${key} production`;
    console.log(`Setting ${key}...`);
    
    try {
      // Nota: Este comando requer interação manual para inserir o valor
      console.log(`Execute manualmente: ${command}`);
      console.log(`Valor: ${value}\n`);
    } catch (error) {
      console.warn(`⚠️ Erro ao configurar ${key}:`, error.message);
    }
  });
}

function main() {
  try {
    // 1. Verificar se estamos na branch main
    console.log('🔍 Verificando branch atual...');
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    if (currentBranch !== 'main') {
      console.log(`⚠️ Branch atual: ${currentBranch}`);
      console.log('🔄 Mudando para branch main...');
      runCommand('git checkout main', 'Mudança para branch main');
    }
    
    // 2. Atualizar repositório
    runCommand('git pull origin main', 'Atualização do repositório');
    
    // 3. Instalar dependências
    runCommand('npm install', 'Instalação de dependências');
    
    // 4. Build local para verificar se está tudo OK
    runCommand('npm run build', 'Build de verificação');
    
    // 5. Verificar se Vercel CLI está instalado
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Instalando Vercel CLI...');
      runCommand('npm install -g vercel', 'Instalação do Vercel CLI');
    }
    
    // 6. Login na Vercel (se necessário)
    console.log('🔐 Verificando login na Vercel...');
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      console.log('✅ Já logado na Vercel!\n');
    } catch (error) {
      console.log('🔑 Fazendo login na Vercel...');
      runCommand('vercel login', 'Login na Vercel');
    }
    
    // 7. Configurar variáveis de ambiente
    console.log('📋 IMPORTANTE: Configure as seguintes variáveis de ambiente na Vercel:\n');
    Object.entries(PRODUCTION_ENV).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    
    console.log('\n🌐 Você pode configurar via:');
    console.log('1. Dashboard da Vercel (https://vercel.com/dashboard)');
    console.log('2. CLI: vercel env add [NOME_VARIAVEL] production');
    console.log('\n⏳ Pressione Enter após configurar as variáveis...');
    
    // Aguardar confirmação do usuário
    require('child_process').execSync('pause', { stdio: 'inherit' });
    
    // 8. Deploy na Vercel
    runCommand('vercel --prod', 'Deploy na Vercel');
    
    console.log('🎉 Deploy concluído com sucesso!');
    console.log('🌍 Seu app está rodando em produção com o banco aabb-produção');
    
  } catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
    process.exit(1);
  }
}

// Executar script
main();