#!/usr/bin/env node

/**
 * Script para aplicar correção das políticas RLS do cash_audit_log
 * 
 * Corrige o erro: "new row violates row-level security policy for table cash_audit_log"
 */

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

async function applyRlsFix() {
  console.log('🔧 Aplicando correção das políticas RLS...');
  console.log('');

  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250908000002_fix_audit_log_rls.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migração não encontrado:', migrationPath);
      return;
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Aplicando migração...');
    console.log('🔗 SQL a ser executado:');
    console.log('```sql');
    console.log(migrationSql);
    console.log('```');
    console.log('');
    
    console.log('⚠️  Execute manualmente no dashboard do Supabase:');
    console.log('🔗 URL: https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql');
    console.log('');
    console.log('📝 Instruções:');
    console.log('1. Acesse o SQL Editor no dashboard');
    console.log('2. Cole o SQL acima');
    console.log('3. Execute a query');
    console.log('4. Teste a abertura de caixa novamente');
    console.log('');
    
    // Tentar verificar se a correção já foi aplicada
    console.log('🔍 Verificando políticas existentes...');
    
    const { data: policies, error } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'cash_audit_log');
      
    if (error) {
      console.log('ℹ️  Não foi possível verificar as políticas via API (normal)');
    }
    
    console.log('');
    console.log('✅ Instruções de correção exibidas!');
    console.log('');
    console.log('🎯 Após aplicar a migração:');
    console.log('- O erro "row-level security policy" deve ser resolvido');
    console.log('- A abertura de caixa funcionará normalmente');
    console.log('- Os logs de auditoria serão inseridos automaticamente');

  } catch (error) {
    console.error('❌ Erro ao processar migração:', error.message);
  }
}

applyRlsFix();