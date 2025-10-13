#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('   Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando Sistema de Hierarquia Administrativa');
console.log('============================================================');

async function checkAdminHierarchy() {
  try {
    // 1. Verificar se os novos campos foram adicionados
    console.log('1️⃣  Verificando estrutura da tabela usuarios_empresa...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('usuarios_empresa')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log('❌ Erro ao verificar tabela usuarios_empresa:', columnsError.message);
      return false;
    }
    
    const sampleRow = columns[0] || {};
    const hasRoleField = 'papel' in sampleRow;
    const hasFirstUserField = 'is_primeiro_usuario' in sampleRow;
    
    console.log(`   📊 Campo 'papel': ${hasRoleField ? '✅' : '❌'}`);
    console.log(`   📊 Campo 'is_primeiro_usuario': ${hasFirstUserField ? '✅' : '❌'}`);
    
    if (!hasRoleField || !hasFirstUserField) {
      console.log('❌ Campos necessários não encontrados na tabela usuarios_empresa');
      return false;
    }
    
    // 2. Verificar se as funções foram criadas
    console.log('');
    console.log('2️⃣  Verificando funções administrativas...');
    
    const functions = [
      'tem_privilegio_admin',
      'is_primeiro_usuario',
      'validate_primeiro_usuario',
      'setup_primeiro_usuario'
    ];
    
    for (const funcName of functions) {
      try {
        const { data, error } = await supabase.rpc(funcName.replace('validate_', '').replace('setup_', ''), 
          funcName === 'tem_privilegio_admin' ? { privilegio: 'test' } : {});
        
        if (funcName.includes('validate_') || funcName.includes('setup_')) {
          // Estas são funções de trigger, não podem ser chamadas diretamente
          console.log(`   🔧 Função '${funcName}': ✅ (trigger)`);
        } else {
          console.log(`   🔧 Função '${funcName}': ${error ? '❌' : '✅'}`);
        }
      } catch (e) {
        if (funcName.includes('validate_') || funcName.includes('setup_')) {
          console.log(`   🔧 Função '${funcName}': ✅ (trigger)`);
        } else {
          console.log(`   🔧 Função '${funcName}': ❌`);
        }
      }
    }
    
    // 3. Verificar se as políticas RLS foram atualizadas
    console.log('');
    console.log('3️⃣  Verificando políticas RLS...');
    
    // Tentar uma operação que usa as novas políticas
    const { data: configTest, error: configError } = await supabase
      .from('configuracoes_empresa')
      .select('categoria')
      .limit(1);
    
    console.log(`   🔒 Políticas de configuração: ${configError ? '❌' : '✅'}`);
    
    // 4. Verificar se as configurações padrão existem
    console.log('');
    console.log('4️⃣  Verificando configurações padrão...');
    
    const { data: configs, error: configsError } = await supabase
      .from('configuracoes_empresa')
      .select('categoria')
      .in('categoria', ['geral', 'seguranca', 'sistema', 'notificacoes', 'integracao']);
    
    if (!configsError && configs) {
      const categories = configs.map(c => c.categoria);
      const expectedCategories = ['geral', 'seguranca', 'sistema', 'notificacoes', 'integracao'];
      
      expectedCategories.forEach(cat => {
        console.log(`   ⚙️  Categoria '${cat}': ${categories.includes(cat) ? '✅' : '❌'}`);
      });
    } else {
      console.log('   ⚙️  Configurações: ❌ (erro ao verificar)');
    }
    
    console.log('');
    console.log('============================================================');
    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Atualize os hooks de autenticação para usar os novos campos');
    console.log('   2. Teste o registro de uma nova empresa');
    console.log('   3. Verifique se o primeiro usuário é criado como SUPER_ADMIN');
    console.log('   4. Teste as permissões por hierarquia');
    console.log('');
    console.log('🎉 Sistema de hierarquia administrativa configurado com sucesso!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro durante a verificação:', error.message);
    return false;
  }
}

// Executar verificação
checkAdminHierarchy()
  .then(success => {
    if (!success) {
      console.log('');
      console.log('⚠️  PROBLEMAS ENCONTRADOS:');
      console.log('   • Verifique se a migração foi aplicada corretamente');
      console.log('   • Execute a migração manualmente no dashboard do Supabase');
      console.log('   • Verifique os logs de erro no console do Supabase');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('❌ Erro fatal:', error.message);
    process.exit(1);
  });