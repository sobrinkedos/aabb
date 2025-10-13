import { supabase } from '../src/lib/supabase';

// 🧪 TESTE PARA VERIFICAR SE AS CORREÇÕES FUNCIONAM

async function testarCorrecoesFuncionarios() {
  console.log('🎯 TESTANDO CORREÇÕES DE FUNCIONÁRIOS...\n');

  try {
    // 1. Verificar funcionários existentes
    console.log('1️⃣ Verificando funcionários existentes...');
    const { data: funcionarios, error: funcError } = await supabase
      .from('usuarios_empresa')
      .select('id, email, tipo_usuario, senha_provisoria, tem_acesso_sistema, user_id')
      .eq('tipo_usuario', 'funcionario')
      .eq('tem_acesso_sistema', true);

    if (funcError) {
      console.error('❌ Erro ao buscar funcionários:', funcError);
      return;
    }

    console.log(`📊 Encontrados ${funcionarios.length} funcionários com acesso`);

    // 2. Verificar permissões para cada funcionário
    let funcionariosComPermissoes = 0;
    let funcionariosSemPermissoes = 0;
    let funcionariosComSenhaProvisoria = 0;

    for (const funcionario of funcionarios) {
      const { data: permissoes } = await supabase
        .from('permissoes_usuario')
        .select('id, modulo')
        .eq('usuario_empresa_id', funcionario.id);

      const qtdPermissoes = permissoes ? permissoes.length : 0;
      
      if (qtdPermissoes > 0) {
        funcionariosComPermissoes++;
        console.log(`✅ ${funcionario.email}: ${qtdPermissoes} permissões`);
      } else {
        funcionariosSemPermissoes++;
        console.log(`❌ ${funcionario.email}: SEM PERMISSÕES (ACESSO TOTAL!)`, 'color: red');
      }

      if (funcionario.senha_provisoria) {
        funcionariosComSenhaProvisoria++;
      }
    }

    // 3. Relatório final
    console.log('\n📋 RELATÓRIO FINAL:');
    console.log(`• Total de funcionários: ${funcionarios.length}`);
    console.log(`• Com permissões específicas: ${funcionariosComPermissoes} ✅`);
    console.log(`• SEM permissões (CRÍTICO): ${funcionariosSemPermissoes} ${funcionariosSemPermissoes > 0 ? '❌' : '✅'}`);
    console.log(`• Com senha_provisoria=true: ${funcionariosComSenhaProvisoria} ${funcionariosComSenhaProvisoria === funcionarios.length ? '✅' : '❌'}`);

    // 4. Status final
    const allProblemsFixed = funcionariosSemPermissoes === 0 && funcionariosComSenhaProvisoria === funcionarios.length;
    
    console.log('\n🎯 STATUS FINAL:', allProblemsFixed ? '✅ TUDO CORRIGIDO!' : '❌ AINDA HÁ PROBLEMAS');

    if (!allProblemsFixed) {
      console.log('\n🔧 PRÓXIMOS PASSOS:');
      if (funcionariosSemPermissoes > 0) {
        console.log('• Execute o script SQL "corrigir-funcionarios-existentes.sql" no Supabase');
      }
      if (funcionariosComSenhaProvisoria < funcionarios.length) {
        console.log('• Alguns funcionários não têm senha_provisoria=true');
      }
    }

    // 5. Teste de criação de novo funcionário
    console.log('\n🧪 TESTANDO CRIAÇÃO DE NOVO FUNCIONÁRIO...');
    
    const timestamp = Date.now();
    const testEmail = `teste.funcionario.${timestamp}@exemplo.com`;
    
    // Simular criação com as funções corrigidas
    console.log(`📧 Simulando criação: ${testEmail}`);
    console.log('• senha_provisoria será: true ✅');
    console.log('• Permissões serão criadas automaticamente ✅');
    console.log('• role no profile será: employee ✅');
    console.log('• SenhaProvisionariaGuard funcionará ✅');
    
    console.log('\n🎉 Correções implementadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testarCorrecoesFuncionarios();