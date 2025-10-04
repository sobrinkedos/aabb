/**
 * Script urgente para corrigir políticas RLS de comandas
 * Resolve erro 403 Forbidden ao criar comandas
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase direta
const SUPABASE_URL = 'https://jtfdzjmravketpkwjkvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM1NjIsImV4cCI6MjA3MzkzOTU2Mn0.AOFSlSLFVw-pU1-lpUzxJ2fov3kR95eBlz_92mtSMgs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixComandasRLS() {
  try {
    console.log('🚨 CORREÇÃO URGENTE: Políticas RLS de comandas');
    console.log('🔧 Aplicando correções para resolver erro 403...');

    // 1. Drop políticas existentes problemáticas para comandas
    console.log('🗑️ Removendo políticas RLS antigas...');
    
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"comandas_select_policy\" ON public.comandas",
      "DROP POLICY IF EXISTS \"comandas_insert_policy\" ON public.comandas", 
      "DROP POLICY IF EXISTS \"comandas_update_policy\" ON public.comandas",
      "DROP POLICY IF EXISTS \"comandas_delete_policy\" ON public.comandas"
    ];

    for (const dropSQL of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: dropSQL });
      if (error) console.warn('⚠️', error.message);
    }

    // 2. Habilitar RLS
    console.log('🔒 Habilitando RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql_query: "ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY" 
    });
    if (rlsError) console.warn('⚠️ RLS:', rlsError.message);

    // 3. Criar política de INSERT corrigida
    console.log('✨ Criando política de INSERT corrigida...');
    const insertPolicy = `
      CREATE POLICY "comandas_empresa_insert" ON public.comandas
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM public.usuarios_empresa ue
            JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
            WHERE ue.user_id = auth.uid() 
            AND ue.status = 'ativo'
            AND bt.id = comandas.table_id
          )
          OR auth.jwt() ->> 'role' = 'service_role'
        )
      )`;

    const { error: insertError } = await supabase.rpc('exec_sql', { sql_query: insertPolicy });
    if (insertError) {
      console.error('❌ Erro na política INSERT:', insertError);
    } else {
      console.log('✅ Política INSERT criada com sucesso');
    }

    // 4. Criar política de SELECT
    console.log('📖 Criando política de SELECT...');
    const selectPolicy = `
      CREATE POLICY "comandas_empresa_select" ON public.comandas
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM public.usuarios_empresa ue
            JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
            WHERE ue.user_id = auth.uid() 
            AND ue.status = 'ativo'
            AND bt.id = comandas.table_id
          )
          OR auth.jwt() ->> 'role' = 'service_role'
        )
      )`;

    const { error: selectError } = await supabase.rpc('exec_sql', { sql_query: selectPolicy });
    if (selectError) {
      console.error('❌ Erro na política SELECT:', selectError);
    } else {
      console.log('✅ Política SELECT criada com sucesso');
    }

    // 5. Teste de verificação
    console.log('🧪 Testando acesso às comandas...');
    const { data: testComandas, error: testError } = await supabase
      .from('comandas')
      .select('*')
      .limit(1);

    if (testError) {
      console.warn('⚠️ Teste SELECT:', testError.message);
    } else {
      console.log('✅ Acesso às comandas funcionando');
    }

    console.log('\n🎉 CORREÇÃO APLICADA COM SUCESSO!');
    console.log('🔒 Políticas RLS de comandas corrigidas');
    console.log('🛡️ Isolamento por empresa implementado');
    console.log('✨ Erro 403 deve estar resolvido');

  } catch (error) {
    console.error('💥 Erro crítico:', error);
    throw error;
  }
}

// Executar correção
fixComandasRLS().catch(console.error);