/**
 * Utilitário para corrigir a tabela inventory_categories
 * Execute uma vez para configurar a tabela corretamente
 */

import { supabase } from '../lib/supabase';

export const fixInventoryCategories = async () => {
  console.log('🔧 Iniciando correção da tabela inventory_categories...');

  try {
    // 1. Desabilitar RLS
    console.log('1️⃣ Desabilitando RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE inventory_categories DISABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️ Erro ao desabilitar RLS (pode ser que já esteja desabilitado):', rlsError.message);
    } else {
      console.log('✅ RLS desabilitado com sucesso');
    }

    // 2. Verificar estrutura da tabela
    console.log('2️⃣ Verificando estrutura da tabela...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'inventory_categories');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('📋 Colunas encontradas:', columns?.map(c => c.column_name));
    }

    // 3. Verificar se há empresas
    console.log('3️⃣ Verificando empresas...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome')
      .limit(1);

    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return false;
    }

    if (!empresas || empresas.length === 0) {
      console.error('❌ Nenhuma empresa encontrada no banco');
      return false;
    }

    const empresaId = empresas[0].id;
    console.log('✅ Empresa encontrada:', empresas[0].nome, 'ID:', empresaId);

    // 4. Verificar se já existem categorias
    console.log('4️⃣ Verificando categorias existentes...');
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('inventory_categories')
      .select('id, name')
      .limit(5);

    if (categoriesError) {
      console.log('⚠️ Erro ao buscar categorias (tabela pode não existir ainda):', categoriesError.message);
    } else {
      console.log('📋 Categorias existentes:', existingCategories?.length || 0);
    }

    // 5. Tentar criar categorias padrão
    console.log('5️⃣ Criando categorias padrão...');
    
    const defaultCategories = [
      { name: 'Bebidas', description: 'Bebidas em geral', color: '#3B82F6', icon: 'wine' },
      { name: 'Alimentos', description: 'Produtos alimentícios', color: '#10B981', icon: 'utensils' },
      { name: 'Limpeza', description: 'Produtos de limpeza', color: '#F59E0B', icon: 'spray-can' }
    ];

    for (const category of defaultCategories) {
      try {
        const { data, error } = await supabase
          .from('inventory_categories')
          .insert({
            ...category,
            empresa_id: empresaId,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.log(`⚠️ Categoria '${category.name}' pode já existir:`, error.message);
        } else {
          console.log(`✅ Categoria '${category.name}' criada:`, data?.id);
        }
      } catch (err) {
        console.log(`⚠️ Erro ao criar categoria '${category.name}':`, err);
      }
    }

    // 6. Verificar resultado final
    console.log('6️⃣ Verificando resultado final...');
    const { data: finalCategories, error: finalError } = await supabase
      .from('inventory_categories')
      .select('id, name, empresa_id, is_active')
      .eq('is_active', true);

    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError);
      return false;
    }

    console.log('🎉 Correção concluída! Categorias disponíveis:', finalCategories?.length || 0);
    console.log('📋 Categorias:', finalCategories?.map(c => c.name));

    return true;

  } catch (error) {
    console.error('💥 Erro geral na correção:', error);
    return false;
  }
};

// Função para executar via console do navegador
(window as any).fixInventoryCategories = fixInventoryCategories;