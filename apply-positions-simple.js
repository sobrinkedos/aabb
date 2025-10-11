import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupPositionsAndDepartments() {
  try {
    console.log('🚀 Configurando positions e departments...\n');

    // Verificar se as tabelas já existem
    console.log('🔍 Verificando tabelas existentes...');
    
    const { data: existingDepts, error: deptCheckError } = await supabase
      .from('departments')
      .select('id')
      .limit(1);

    const { data: existingPos, error: posCheckError } = await supabase
      .from('positions')
      .select('id')
      .limit(1);

    if (!deptCheckError && existingDepts !== null) {
      console.log('✅ Tabela departments já existe');
    } else {
      console.log('⚠️ Tabela departments não encontrada ou erro:', deptCheckError?.message);
    }

    if (!posCheckError && existingPos !== null) {
      console.log('✅ Tabela positions já existe');
    } else {
      console.log('⚠️ Tabela positions não encontrada ou erro:', posCheckError?.message);
    }

    // Inserir departamento padrão
    console.log('\n📝 Inserindo departamento padrão...');
    const { error: deptError } = await supabase
      .from('departments')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Geral',
        description: 'Departamento geral',
        is_active: true
      }, {
        onConflict: 'id'
      });

    if (deptError) {
      console.error('❌ Erro ao inserir departamento:', deptError.message);
    } else {
      console.log('✅ Departamento padrão inserido/atualizado');
    }

    // Inserir cargos padrão
    console.log('\n📝 Inserindo cargos padrão...');
    const defaultPositions = [
      { id: '00000000-0000-0000-0000-000000000001', name: 'Funcionário', description: 'Cargo geral' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'Gerente', description: 'Gerente' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'Atendente', description: 'Atendente' },
      { id: '00000000-0000-0000-0000-000000000004', name: 'Cozinheiro', description: 'Cozinheiro' },
      { id: '00000000-0000-0000-0000-000000000005', name: 'Garçom', description: 'Garçom' }
    ];

    for (const position of defaultPositions) {
      const { error: posError } = await supabase
        .from('positions')
        .upsert({
          ...position,
          is_active: true
        }, {
          onConflict: 'id'
        });

      if (posError) {
        console.error(`❌ Erro ao inserir cargo ${position.name}:`, posError.message);
      } else {
        console.log(`✅ Cargo ${position.name} inserido/atualizado`);
      }
    }

    // Verificar resultado final
    console.log('\n🔍 Verificando dados inseridos...\n');

    const { data: departments, error: deptListError } = await supabase
      .from('departments')
      .select('id, name, is_active')
      .order('name');

    if (deptListError) {
      console.error('❌ Erro ao listar departments:', deptListError.message);
    } else {
      console.log('✅ Departments cadastrados:', departments?.length || 0);
      departments?.forEach(dept => {
        console.log(`  - ${dept.name} (${dept.is_active ? 'Ativo' : 'Inativo'})`);
      });
    }

    const { data: positions, error: posListError } = await supabase
      .from('positions')
      .select('id, name, is_active')
      .order('name');

    if (posListError) {
      console.error('❌ Erro ao listar positions:', posListError.message);
    } else {
      console.log('\n✅ Positions cadastrados:', positions?.length || 0);
      positions?.forEach(pos => {
        console.log(`  - ${pos.name} (${pos.is_active ? 'Ativo' : 'Inativo'})`);
      });
    }

    console.log('\n✅ Processo concluído!');

  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  }
}

setupPositionsAndDepartments();
