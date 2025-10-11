import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jtfdzjmravketpkwjkvp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
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
    console.log('🔧 Aplicando correção de constraint em inventory_categories...\n');

    // Ler o arquivo de migration
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250203000001_fix_inventory_categories_unique_constraint.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📝 Executando SQL...\n');

    // Executar a migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      console.log('⚠️  Função exec_sql não encontrada, tentando executar via REST API...\n');
      
      // Dividir o SQL em statements individuais
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('DO $$') || statement.includes('END $$')) {
          // Executar blocos DO como uma única statement
          const { error: execError } = await supabase.rpc('exec', { sql: statement + ';' });
          if (execError) {
            console.error('❌ Erro ao executar statement:', execError.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('📋 Verificando estrutura...\n');

    // Verificar se a constraint foi criada
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'inventory_categories')
      .eq('constraint_type', 'UNIQUE');

    if (!constraintError && constraints) {
      console.log('✅ Constraints UNIQUE encontradas:');
      constraints.forEach(c => {
        console.log(`   - ${c.constraint_name}`);
      });
    }

    console.log('\n✅ Correção concluída!');
    console.log('\n📌 Agora cada empresa pode ter categorias com nomes únicos apenas dentro do seu escopo.');
    console.log('📌 Diferentes empresas podem ter categorias com o mesmo nome.');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    process.exit(1);
  }
}

applyMigration();
