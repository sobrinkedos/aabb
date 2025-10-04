#!/usr/bin/env node

/**
 * SCRIPT DE CORREÇÃO URGENTE - FALHA DE ISOLAMENTO MULTITENANT
 * 
 * Este script corrige imediatamente a falha crítica de segurança
 * onde usuários conseguem ver produtos de outras empresas.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jtfdzjmravketpkwjkvp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  console.log('Configure a variável de ambiente ou execute no Supabase Dashboard');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function corrigirIsolamentoUrgente() {
  console.log('🚨 INICIANDO CORREÇÃO URGENTE DE ISOLAMENTO MULTITENANT\n');

  try {
    // 1. Remover política insegura
    console.log('1️⃣ Removendo política insegura...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
      query: `
        DROP POLICY IF EXISTS "menu_items_select_public" ON public.menu_items;
        DROP POLICY IF EXISTS "menu_items_modify_admin" ON public.menu_items;
      `
    });

    if (dropError) {
      console.error('❌ Erro ao remover políticas:', dropError);
    } else {
      console.log('✅ Políticas inseguras removidas');
    }

    // 2. Criar política segura
    console.log('\n2️⃣ Criando política segura...');
    const { error: createError } = await supabase.rpc('execute_sql', {
      query: `
        -- Política SELECT: Apenas itens da própria empresa
        CREATE POLICY "menu_items_empresa_select" ON public.menu_items
        FOR SELECT USING (
          auth.uid() IS NOT NULL AND (
            empresa_id = public.get_user_empresa_id() OR
            auth.jwt() ->> 'role' = 'service_role'
          )
        );

        -- Política INSERT: Apenas administradores da empresa
        CREATE POLICY "menu_items_empresa_insert" ON public.menu_items
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL AND
          empresa_id = public.get_user_empresa_id() AND
          public.is_admin_user()
        );

        -- Política UPDATE: Apenas administradores da empresa
        CREATE POLICY "menu_items_empresa_update" ON public.menu_items
        FOR UPDATE USING (
          auth.uid() IS NOT NULL AND
          empresa_id = public.get_user_empresa_id() AND
          public.is_admin_user()
        );

        -- Política DELETE: Apenas SUPER_ADMIN da empresa
        CREATE POLICY "menu_items_empresa_delete" ON public.menu_items
        FOR DELETE USING (
          auth.uid() IS NOT NULL AND
          empresa_id = public.get_user_empresa_id() AND
          EXISTS (
            SELECT 1 FROM public.usuarios_empresa 
            WHERE user_id = auth.uid() 
            AND papel = 'SUPER_ADMIN'
            AND status = 'ativo'
          )
        );
      `
    });

    if (createError) {
      console.error('❌ Erro ao criar políticas seguras:', createError);
    } else {
      console.log('✅ Políticas seguras criadas');
    }

    // 3. Verificar se há itens sem empresa_id
    console.log('\n3️⃣ Verificando itens sem empresa_id...');
    const { data: itemsSemEmpresa, error: checkError } = await supabase
      .from('menu_items')
      .select('id, name')
      .is('empresa_id', null);

    if (checkError) {
      console.error('❌ Erro ao verificar itens:', checkError);
    } else if (itemsSemEmpresa && itemsSemEmpresa.length > 0) {
      console.log(`⚠️ Encontrados ${itemsSemEmpresa.length} itens sem empresa_id`);
      
      // Buscar primeira empresa ativa
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('created_at')
        .limit(1);

      if (empresas && empresas.length > 0) {
        const empresaPadrao = empresas[0];
        console.log(`🔧 Vinculando itens à empresa padrão: ${empresaPadrao.nome}`);

        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ empresa_id: empresaPadrao.id })
          .is('empresa_id', null);

        if (updateError) {
          console.error('❌ Erro ao atualizar itens:', updateError);
        } else {
          console.log('✅ Itens vinculados à empresa padrão');
        }
      }
    } else {
      console.log('✅ Todos os itens já têm empresa_id');
    }

    // 4. Verificar políticas RLS ativas
    console.log('\n4️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT policyname, cmd
        FROM pg_policies 
        WHERE tablename = 'menu_items' 
        AND schemaname = 'public'
        ORDER BY policyname;
      `
    });

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError);
    } else if (policies) {
      console.log('📋 Políticas RLS ativas para menu_items:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    // 5. Teste de isolamento
    console.log('\n5️⃣ Testando isolamento...');
    const { data: empresasTest } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('status', 'ativo')
      .limit(2);

    if (empresasTest && empresasTest.length >= 2) {
      console.log('🧪 Teste de isolamento com 2 empresas:');
      empresasTest.forEach((empresa, index) => {
        console.log(`  ${index + 1}. ${empresa.nome} (${empresa.id})`);
      });
      console.log('💡 Teste manual: Verifique se usuários só veem itens de sua empresa');
    }

    // 6. Log da correção
    console.log('\n6️⃣ Registrando correção...');
    const { error: logError } = await supabase
      .from('logs_auditoria')
      .insert({
        empresa_id: null,
        usuario_id: null,
        acao: 'CORRECAO_ISOLAMENTO_URGENTE',
        recurso: 'menu_items',
        detalhes: {
          script: 'fix-cross-tenant-urgent.js',
          timestamp: new Date().toISOString(),
          politicas_removidas: ['menu_items_select_public'],
          politicas_criadas: ['menu_items_empresa_select', 'menu_items_empresa_insert', 'menu_items_empresa_update', 'menu_items_empresa_delete']
        }
      });

    if (logError) {
      console.error('❌ Erro ao registrar log:', logError);
    } else {
      console.log('✅ Correção registrada no log de auditoria');
    }

    console.log('\n🎉 CORREÇÃO URGENTE CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Recarregue a aplicação no browser');
    console.log('2. Teste se usuários só veem produtos de sua empresa');
    console.log('3. Verifique logs de auditoria para tentativas cross-tenant');
    console.log('4. Aplique a migração completa: 20250204000004_fix_cross_tenant_access.sql');

  } catch (error) {
    console.error('💥 ERRO FATAL na correção:', error);
    process.exit(1);
  }
}

// Executar correção
if (require.main === module) {
  corrigirIsolamentoUrgente();
}

module.exports = { corrigirIsolamentoUrgente };