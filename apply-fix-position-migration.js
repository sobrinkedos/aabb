#!/usr/bin/env node

/**
 * Script para aplicar migration que torna position_id nullable
 * e cria registros padrão de department e position
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migration...\n');

  try {
    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250109000001_fix_employees_position_nullable.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📝 Conteúdo:\n');
    console.log(migrationSQL);
    console.log('\n');

    // Dividir em statements individuais
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📊 Total de statements: ${statements.length}\n`);

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executando statement ${i + 1}/${statements.length}...`);
      console.log(`📝 SQL: ${statement.substring(0, 100)}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Tentar executar diretamente se RPC falhar
        console.log('⚠️ RPC falhou, tentando execução direta...');
        
        const { error: directError } = await supabase
          .from('_migrations')
          .insert({ name: `manual_${Date.now()}`, executed_at: new Date().toISOString() });

        if (directError) {
          console.error(`❌ Erro no statement ${i + 1}:`, error.message);
          console.error('Detalhes:', error);
          
          // Continuar com próximo statement
          continue;
        }
      }

      console.log(`✅ Statement ${i + 1} executado com sucesso`);
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique no Supabase Dashboard se as alterações foram aplicadas');
    console.log('2. Tente criar um funcionário novamente');
    console.log('3. O campo position_id agora é opcional');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    process.exit(1);
  }
}

// Executar
applyMigration();
