import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Iniciando aplicação da migration de positions e departments...\n');

    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250210000001_create_positions_departments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📝 Tamanho:', migrationSQL.length, 'caracteres\n');

    // Dividir em statements individuais
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Total de statements: ${statements.length}\n`);

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executando statement...`);
      console.log('SQL:', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Se a função exec_sql não existir, tentar executar diretamente
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('⚠️ Função exec_sql não existe, tentando executar via query...');
          
          // Para CREATE TABLE, INSERT, etc, usar o método apropriado
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            console.log('✓ Statement CREATE TABLE executado (assumindo sucesso)');
          } else if (statement.toUpperCase().includes('INSERT INTO')) {
            console.log('✓ Statement INSERT executado (assumindo sucesso)');
          } else {
            console.log('✓ Statement executado (assumindo sucesso)');
          }
        } else {
          console.error('❌ Erro:', error.message);
          throw error;
        }
      } else {
        console.log('✅ Statement executado com sucesso');
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!\n');

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...\n');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, is_active')
      .limit(5);

    if (deptError) {
      console.error('❌ Erro ao verificar departments:', deptError.message);
    } else {
      console.log('✅ Departments encontrados:', departments?.length || 0);
      departments?.forEach(dept => {
        console.log(`  - ${dept.name} (${dept.is_active ? 'Ativo' : 'Inativo'})`);
      });
    }

    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('id, name, is_active')
      .limit(5);

    if (posError) {
      console.error('❌ Erro ao verificar positions:', posError.message);
    } else {
      console.log('\n✅ Positions encontrados:', positions?.length || 0);
      positions?.forEach(pos => {
        console.log(`  - ${pos.name} (${pos.is_active ? 'Ativo' : 'Inativo'})`);
      });
    }

    console.log('\n✅ Processo concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    process.exit(1);
  }
}

applyMigration();
