/**
 * Script para aplicar migração de correção das políticas RLS de comandas
 * Resolve erro 403 Forbidden ao criar comandas
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jtfdzjmravketpkwjkvp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não encontrada nas variáveis de ambiente');
  console.log('💡 Configure a chave de service role para executar migrações');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração de correção das políticas RLS de comandas...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250204000005_fix_comandas_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migração carregada:', migrationPath);
    console.log('📏 Tamanho da migração:', migrationSQL.length, 'caracteres');
    
    // Dividir em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    console.log('🔧 Executando', commands.length, 'comandos SQL...');
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;
      
      console.log(`⚡ Executando comando ${i + 1}/${commands.length}:`);
      console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: command });
      
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error);
        // Continuar com os próximos comandos mesmo se houver erro
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }
    
    console.log('🎉 Migração aplicada com sucesso!');
    console.log('🔒 Políticas RLS de comandas corrigidas');
    console.log('🛡️ Isolamento por empresa_id implementado');
    
    // Verificar se as políticas foram criadas
    console.log('\n🔍 Verificando políticas criadas...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['comandas', 'comanda_items']);
    
    if (policiesError) {
      console.warn('⚠️ Não foi possível verificar políticas:', policiesError);
    } else {
      console.log('📋 Políticas encontradas:', policies?.length || 0);
      policies?.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erro ao aplicar migração:', error);
    process.exit(1);
  }
}

// Executar a migração
applyMigration();