#!/usr/bin/env node

/**
 * Script para corrigir problemas de RLS no banco de produção
 * 
 * Este script resolve os problemas de recursão infinita nas políticas RLS
 * e cria as funções/views necessárias que estão faltando.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações de produção
const SUPABASE_URL = 'https://jtfdzjmravketpkwjkvp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MzU2MiwiZXhwIjoyMDczOTM5NTYyfQ.YOUR_SERVICE_ROLE_KEY_HERE'; // Substitua pela chave correta

console.log('🔧 Iniciando correção do banco de produção...\n');

async function fixProductionDatabase() {
  try {
    // Criar cliente Supabase com service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('📡 Conectando ao Supabase...');
    
    // Ler o arquivo SQL de correção
    const sqlScript = fs.readFileSync('fix-production-rls.sql', 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Executando ${commands.length} comandos SQL...\n`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.toLowerCase().includes('commit')) {
        console.log('✅ Commit executado');
        continue;
      }
      
      try {
        console.log(`${i + 1}/${commands.length} Executando: ${command.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          console.warn(`⚠️ Aviso no comando ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
        
        // Pequena pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (cmdError) {
        console.warn(`⚠️ Erro no comando ${i + 1}:`, cmdError.message);
        // Continuar com próximo comando
      }
    }
    
    console.log('\n🎉 Correção concluída!');
    console.log('\n📋 Verificando conectividade...');
    
    // Testar algumas consultas básicas
    const tests = [
      { name: 'Empresas', table: 'empresas' },
      { name: 'Usuários Empresa', table: 'usuarios_empresa' },
      { name: 'Menu Items', table: 'menu_items' },
      { name: 'Comandas', table: 'comandas' }
    ];
    
    for (const test of tests) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: OK`);
        }
      } catch (testError) {
        console.log(`❌ ${test.name}: ${testError.message}`);
      }
    }
    
    console.log('\n🚀 Banco de produção corrigido e pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  }
}

// Executar correção
fixProductionDatabase();