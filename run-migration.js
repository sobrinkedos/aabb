#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Iniciando migração do sistema de caixa...');
  
  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250908000001_cash_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Lendo arquivo de migração:', migrationPath);
    console.log('📝 Conteúdo da migração carregado (', migrationSQL.length, 'caracteres)');
    console.log('');
    console.log('⚠️  ATENÇÃO: Esta migração precisa ser executada manualmente no Supabase Dashboard.');
    console.log('');
    console.log('🔗 Passos para aplicar a migração:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql');
    console.log('2. Cole o conteúdo do arquivo de migração no SQL Editor');
    console.log('3. Execute o SQL');
    console.log('');
    console.log('📋 Arquivo de migração:', migrationPath);
    console.log('');
    console.log('✅ Após executar a migração, as seguintes tabelas serão criadas:');
    console.log('  - cash_sessions (Sessões de caixa)');
    console.log('  - cash_transactions (Transações do caixa)');
    console.log('  - payment_reconciliation (Reconciliação de pagamentos)');
    console.log('  - cash_audit_log (Log de auditoria)');
    console.log('');
    console.log('🔧 Recursos que serão implementados:');
    console.log('  - Triggers automáticos');
    console.log('  - Row Level Security (RLS)');
    console.log('  - Índices para performance');
    console.log('  - Views para relatórios');
    console.log('');
    console.log('🎯 Após aplicar a migração:');
    console.log('  1. Trocar useCashManagementFallback por useCashManagement nos componentes');
    console.log('  2. Testar funcionalidades de abertura/fechamento de caixa');
    console.log('  3. Verificar integração com comandas do bar');
    console.log('');
    console.log('💡 Dica: Copie o conteúdo do arquivo SQL diretamente para aplicar mais rapidamente.');
    
    // Tentativa de verificar se as tabelas já existem
    console.log('🔍 Verificando se as tabelas já existem...');
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['cash_sessions', 'cash_transactions', 'payment_reconciliation', 'cash_audit_log']);
    
    if (error) {
      console.log('⚠️  Não foi possível verificar tabelas existentes:', error.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ Algumas tabelas do sistema de caixa já existem:');
      tables.forEach(table => console.log(`  - ${table.table_name}`));
      console.log('');
      console.log('💡 Se as tabelas já existem, a migração pode não ser necessária.');
    } else {
      console.log('📝 Nenhuma tabela do sistema de caixa encontrada. Migração necessária.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.log('');
    console.log('📋 Mesmo com erro, você ainda pode aplicar a migração manualmente.');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql');
  }
}

runMigration();