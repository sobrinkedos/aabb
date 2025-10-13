/**
 * Script para resetar o sistema de funcionários
 * Execute com cuidado - remove todos os dados de funcionários!
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (use as variáveis do seu ambiente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Chave de serviço necessária

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface ResetOptions {
  preserveAdmin?: boolean;
  adminEmail?: string;
  dryRun?: boolean; // Apenas simular, não executar
}

export async function resetEmployeeSystem(options: ResetOptions = {}) {
  const { preserveAdmin = true, adminEmail, dryRun = false } = options;
  
  console.log('🚨 INICIANDO RESET DO SISTEMA DE FUNCIONÁRIOS');
  console.log(`Modo: ${dryRun ? 'SIMULAÇÃO' : 'EXECUÇÃO REAL'}`);
  console.log(`Preservar admin: ${preserveAdmin}`);
  
  try {
    // 1. Identificar usuário administrador se necessário
    let adminUserId: string | null = null;
    
    if (preserveAdmin) {
      const { data: adminUser } = await supabase
        .from('usuarios_empresa')
        .select('user_id, email, nome_completo')
        .or('is_primeiro_usuario.eq.true,tipo_usuario.eq.administrador')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      if (adminUser) {
        adminUserId = adminUser.user_id;
        console.log(`👤 Admin preservado: ${adminUser.nome_completo} (${adminUser.email})`);
      }
    }

    // 2. Contar registros antes da limpeza
    const counts = await getTableCounts();
    console.log('📊 Registros antes da limpeza:', counts);

    if (dryRun) {
      console.log('🔍 MODO SIMULAÇÃO - Nenhum dado será removido');
      return { success: true, message: 'Simulação concluída', counts };
    }

    // 3. Limpar permissões de usuários (exceto admin)
    console.log('🧹 Limpando permissões...');
    if (preserveAdmin && adminUserId) {
      await supabase
        .from('permissoes_usuario')
        .delete()
        .not('usuario_empresa_id', 'in', `(SELECT id FROM usuarios_empresa WHERE user_id = '${adminUserId}')`);
    } else {
      await supabase.from('permissoes_usuario').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 3.1. Limpar dados operacionais
    console.log('🧹 Limpando resumos diários de caixa...');
    await supabase.from('daily_cash_summary').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🧹 Limpando itens do menu...');
    await supabase.from('menu_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (!preserveAdmin) {
      console.log('🧹 Limpando empresas (RESET COMPLETO)...');
      await supabase.from('empresas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      console.log('⚠️  Empresas preservadas (modo seguro)');
    }
    
    // Limpar outras tabelas relacionadas se existirem
    const additionalTables = [
      'employee_shifts',
      'employee_sales', 
      'employee_commissions',
      'attendance_records',
      'performance_metrics',
      'cash_register_sessions',
      'sales_transactions'
    ];
    
    for (const table of additionalTables) {
      try {
        console.log(`🧹 Limpando ${table}...`);
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (error) {
        console.log(`ℹ️  Tabela ${table} não existe ou já está vazia`);
      }
    }

    // 4. Limpar funcionários do bar (exceto admin)
    console.log('🧹 Limpando funcionários do bar...');
    if (preserveAdmin && adminUserId) {
      await supabase
        .from('bar_employees')
        .delete()
        .neq('employee_id', adminUserId);
    } else {
      await supabase.from('bar_employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 5. Limpar usuários da empresa (exceto admin)
    console.log('🧹 Limpando usuários da empresa...');
    if (preserveAdmin && adminUserId) {
      await supabase
        .from('usuarios_empresa')
        .delete()
        .neq('user_id', adminUserId);
    } else {
      await supabase.from('usuarios_empresa').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 6. Limpar usuários do Auth (mais complexo, requer admin API)
    console.log('🧹 Limpando usuários do Auth...');
    if (!preserveAdmin || !adminUserId) {
      console.log('⚠️  Limpeza completa do Auth requer acesso direto ao banco');
      console.log('Execute o SQL: DELETE FROM auth.users;');
    } else {
      console.log('⚠️  Para remover usuários do Auth (exceto admin), execute:');
      console.log(`DELETE FROM auth.users WHERE id != '${adminUserId}';`);
    }

    // 7. Verificar resultado
    const finalCounts = await getTableCounts();
    console.log('📊 Registros após limpeza:', finalCounts);

    console.log('✅ Reset concluído com sucesso!');
    
    return {
      success: true,
      message: 'Sistema resetado com sucesso',
      beforeCounts: counts,
      afterCounts: finalCounts,
      adminPreserved: preserveAdmin ? adminUserId : null
    };

  } catch (error) {
    console.error('❌ Erro durante o reset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

async function getTableCounts() {
  const [permissoes, barEmployees, usuariosEmpresa, dailyCash, menuItens, empresas] = await Promise.all([
    supabase.from('permissoes_usuario').select('id', { count: 'exact', head: true }),
    supabase.from('bar_employees').select('id', { count: 'exact', head: true }),
    supabase.from('usuarios_empresa').select('id', { count: 'exact', head: true }),
    supabase.from('daily_cash_summary').select('id', { count: 'exact', head: true }),
    supabase.from('menu_itens').select('id', { count: 'exact', head: true }),
    supabase.from('empresas').select('id', { count: 'exact', head: true })
  ]);

  return {
    permissoes_usuario: permissoes.count || 0,
    bar_employees: barEmployees.count || 0,
    usuarios_empresa: usuariosEmpresa.count || 0,
    daily_cash_summary: dailyCash.count || 0,
    menu_itens: menuItens.count || 0,
    empresas: empresas.count || 0
  };
}

// Função para uso direto
export async function resetEmployeeSystemSafe() {
  return resetEmployeeSystem({ 
    preserveAdmin: true, 
    dryRun: false 
  });
}

export async function simulateReset() {
  return resetEmployeeSystem({ 
    preserveAdmin: true, 
    dryRun: true 
  });
}

// Execução direta se chamado como script
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const preserveAdmin = !args.includes('--no-preserve-admin');
  
  resetEmployeeSystem({ 
    preserveAdmin, 
    dryRun: isDryRun 
  }).then(result => {
    console.log('Resultado:', result);
    process.exit(result.success ? 0 : 1);
  });
}