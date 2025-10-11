const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wznycskqsavpmejwpksp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Lendo arquivo de migration...');
    const migrationSQL = fs.readFileSync('supabase/migrations/20250207000001_advanced_cash_management_system.sql', 'utf8');
    
    console.log('Aplicando migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Erro ao aplicar migration:', error);
      process.exit(1);
    }
    
    console.log('Migration aplicada com sucesso!');
    console.log('Resultado:', data);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

applyMigration();
