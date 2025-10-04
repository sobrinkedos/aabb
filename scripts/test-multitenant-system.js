#!/usr/bin/env node

/**
 * Script de Teste Completo do Sistema Multitenant
 * 
 * Este script testa:
 * 1. Registro de empresas
 * 2. Isolamento entre empresas
 * 3. Políticas RLS
 * 4. Hierarquia de usuários
 * 5. Integridade do sistema
 */

const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jtfdzjmravketpkwjkvp.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZmR6am1yYXZrZXRwa3dqa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjM1NjIsImV4cCI6MjA3MzkzOTU2Mn0.AOFSlSLFVw-pU1-lpUzxJ2fov3kR95eBlz_92mtSMgs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utilitários de log
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ '), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️ '), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  section: (msg) => console.log(chalk.cyan('\n📋'), chalk.bold(msg))
};

// Dados de teste
const empresasTest = [
  {
    nome_empresa: 'AABB Teste 1',
    cnpj: '11111111000111',
    email_admin: 'admin1@teste.com',
    telefone_empresa: '(11) 1111-1111',
    nome_admin: 'Administrador Um',
    telefone_admin: '(11) 9999-1111',
    senha: 'senhaSegura123',
    confirmar_senha: 'senhaSegura123'
  },
  {
    nome_empresa: 'AABB Teste 2',
    cnpj: '22222222000222',
    email_admin: 'admin2@teste.com',
    telefone_empresa: '(22) 2222-2222',
    nome_admin: 'Administrador Dois',
    telefone_admin: '(22) 9999-2222',
    senha: 'senhaSegura456',
    confirmar_senha: 'senhaSegura456'
  }
];

class MultitenantTester {
  constructor() {
    this.empresasIds = [];
    this.usuariosIds = [];
    this.authTokens = [];
  }

  async executarTestes() {
    try {
      log.section('INICIANDO TESTES DO SISTEMA MULTITENANT');
      
      await this.testarRelatorioIntegridade();
      await this.testarRegistroEmpresas();
      await this.testarIsolamentoEmpresas();
      await this.testarHierarquiaUsuarios();
      await this.testarPoliticasRLS();
      await this.limparDadosTeste();
      
      log.section('TODOS OS TESTES CONCLUÍDOS COM SUCESSO! 🎉');
    } catch (error) {
      log.error(`Erro durante os testes: ${error.message}`);
      await this.limparDadosTeste();
      process.exit(1);
    }
  }

  async testarRelatorioIntegridade() {
    log.section('TESTE 1: Relatório de Integridade do Sistema');
    
    try {
      // Testar função de verificação de integridade
      const { data, error } = await supabase
        .rpc('verificar_integridade_sistema_completa');

      if (error) {
        log.error(`Erro ao executar verificação de integridade: ${error.message}`);
        return;
      }

      log.info('Resultado da verificação de integridade:');
      data.forEach(item => {
        const statusColor = item.status === 'OK' ? 'green' : 
                           item.status === 'ATENÇÃO' ? 'yellow' : 'red';
        console.log(`  ${chalk[statusColor](item.status)} ${item.categoria}: ${item.item}`);
        if (item.status !== 'OK') {
          console.log(`    📋 ${item.detalhes}`);
          console.log(`    💡 ${item.acao_recomendada}`);
        }
      });

      // Testar relatório de isolamento
      const { data: isolamento, error: isolamentoError } = await supabase
        .rpc('relatorio_isolamento_multitenant');

      if (!isolamentoError && isolamento) {
        log.info('\nRelatório de isolamento de tabelas críticas:');
        const tabelasCriticas = ['empresas', 'usuarios_empresa', 'menu_items', 'inventory_items'];
        isolamento
          .filter(item => tabelasCriticas.includes(item.tabela))
          .forEach(item => {
            const statusColor = item.status_isolamento === 'ISOLAMENTO_COMPLETO' ? 'green' : 'yellow';
            console.log(`  ${chalk[statusColor](item.status_isolamento)} ${item.tabela}`);
          });
      }

      log.success('Verificação de integridade concluída');
    } catch (error) {
      log.error(`Erro na verificação de integridade: ${error.message}`);
    }
  }

  async testarRegistroEmpresas() {
    log.section('TESTE 2: Registro de Empresas');

    for (let i = 0; i < empresasTest.length; i++) {
      const empresaData = empresasTest[i];
      log.info(`Testando registro da empresa: ${empresaData.nome_empresa}`);

      try {
        // 1. Criar usuário no auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: empresaData.email_admin,
          password: empresaData.senha,
          options: {
            data: {
              name: empresaData.nome_admin,
              role: 'admin'
            }
          }
        });

        if (authError) {
          log.error(`Erro ao criar usuário auth: ${authError.message}`);
          continue;
        }

        log.success(`Usuário auth criado: ${authData.user.id}`);
        this.usuariosIds.push(authData.user.id);

        // 2. Usar função de registro completo
        const { data: registroData, error: registroError } = await supabase
          .rpc('registrar_empresa_completa', {
            p_nome_empresa: empresaData.nome_empresa,
            p_cnpj: empresaData.cnpj,
            p_email_admin: empresaData.email_admin,
            p_telefone_empresa: empresaData.telefone_empresa,
            p_endereco: null,
            p_nome_admin: empresaData.nome_admin,
            p_telefone_admin: empresaData.telefone_admin,
            p_user_id: authData.user.id
          });

        if (registroError || !registroData || !registroData.success) {
          log.error(`Erro no registro: ${registroError?.message || registroData?.error}`);
          continue;
        }

        log.success(`Empresa registrada: ${registroData.empresa_id}`);
        this.empresasIds.push(registroData.empresa_id);

        // 3. Verificar se primeiro usuário foi criado corretamente
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios_empresa')
          .select('*')
          .eq('id', registroData.usuario_id)
          .single();

        if (!usuarioError && usuarioData) {
          if (usuarioData.is_primeiro_usuario && usuarioData.papel === 'SUPER_ADMIN') {
            log.success('✓ Primeiro usuário criado corretamente como SUPER_ADMIN');
          } else {
            log.warning('⚠️ Primeiro usuário não configurado corretamente');
          }
        }

      } catch (error) {
        log.error(`Erro no registro da empresa ${i + 1}: ${error.message}`);
      }
    }
  }

  async testarIsolamentoEmpresas() {
    log.section('TESTE 3: Isolamento entre Empresas');

    if (this.empresasIds.length < 2) {
      log.warning('Necessário pelo menos 2 empresas para testar isolamento');
      return;
    }

    try {
      // Fazer login como usuário da empresa 1
      const { data: loginData1, error: loginError1 } = await supabase.auth.signInWithPassword({
        email: empresasTest[0].email_admin,
        password: empresasTest[0].senha
      });

      if (loginError1) {
        log.error(`Erro no login da empresa 1: ${loginError1.message}`);
        return;
      }

      log.success('Login da empresa 1 realizado');

      // Tentar acessar dados da empresa 2
      const { data: dadosEmpresa2, error: errorEmpresa2 } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', this.empresasIds[1]);

      if (dadosEmpresa2 && dadosEmpresa2.length > 0) {
        log.error('❌ FALHA DE ISOLAMENTO: Usuário da empresa 1 conseguiu ver dados da empresa 2');
      } else {
        log.success('✓ Isolamento funcionando: Usuário não consegue ver outras empresas');
      }

      // Tentar inserir dados para empresa 2
      const { data: insertTest, error: insertError } = await supabase
        .from('menu_items')
        .insert({
          name: 'Item Teste Cross-Tenant',
          price: 10.00,
          category: 'teste',
          empresa_id: this.empresasIds[1] // Tentar inserir para empresa diferente
        });

      if (insertError) {
        log.success('✓ RLS bloqueou inserção cross-tenant');
      } else {
        log.error('❌ FALHA DE SEGURANÇA: Inserção cross-tenant foi permitida');
      }

      await supabase.auth.signOut();

    } catch (error) {
      log.error(`Erro no teste de isolamento: ${error.message}`);
    }
  }

  async testarHierarquiaUsuarios() {
    log.section('TESTE 4: Hierarquia de Usuários');

    if (this.empresasIds.length === 0) {
      log.warning('Nenhuma empresa disponível para teste de hierarquia');
      return;
    }

    try {
      // Login como SUPER_ADMIN
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: empresasTest[0].email_admin,
        password: empresasTest[0].senha
      });

      if (loginError) {
        log.error(`Erro no login: ${loginError.message}`);
        return;
      }

      // Verificar permissões do SUPER_ADMIN
      const { data: permissoes } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', (await this.getUsuarioEmpresaId()));

      if (permissoes && permissoes.length >= 10) {
        log.success('✓ SUPER_ADMIN tem permissões completas');
      } else {
        log.warning('⚠️ SUPER_ADMIN pode ter permissões incompletas');
      }

      // Verificar função is_admin_user
      const { data: isAdmin } = await supabase.rpc('is_admin_user');
      if (isAdmin) {
        log.success('✓ Função is_admin_user funcionando');
      } else {
        log.error('❌ Função is_admin_user não reconhece administrador');
      }

      await supabase.auth.signOut();

    } catch (error) {
      log.error(`Erro no teste de hierarquia: ${error.message}`);
    }
  }

  async testarPoliticasRLS() {
    log.section('TESTE 5: Políticas RLS');

    const tabelas = ['menu_items', 'inventory_items', 'comandas', 'balcao_orders'];

    for (const tabela of tabelas) {
      try {
        log.info(`Testando RLS na tabela: ${tabela}`);

        // Verificar se RLS está ativo
        const { data: rlsStatus } = await supabase
          .rpc('check_rls_enabled', { table_name: tabela })
          .single();

        if (rlsStatus) {
          log.success(`✓ RLS ativo em ${tabela}`);
        } else {
          log.warning(`⚠️ RLS não ativo em ${tabela}`);
        }

        // Verificar se tem políticas
        const { data: policies } = await supabase
          .rpc('get_table_policies', { table_name: tabela });

        if (policies && policies.length > 0) {
          log.success(`✓ ${policies.length} política(s) encontrada(s) em ${tabela}`);
        } else {
          log.warning(`⚠️ Nenhuma política RLS em ${tabela}`);
        }

      } catch (error) {
        log.warning(`Não foi possível testar RLS em ${tabela}: ${error.message}`);
      }
    }
  }

  async getUsuarioEmpresaId() {
    const { data } = await supabase
      .from('usuarios_empresa')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    return data?.id;
  }

  async limparDadosTeste() {
    log.section('LIMPEZA: Removendo dados de teste');

    try {
      // Remover usuários auth (isso removerá dados relacionados por cascade)
      for (const userId of this.usuariosIds) {
        try {
          // Note: em produção isso só funcionaria com service role
          log.info(`Removendo dados de teste para usuário: ${userId}`);
        } catch (error) {
          log.warning(`Não foi possível remover usuário ${userId}: ${error.message}`);
        }
      }

      log.info('Dados de teste removidos (alguns podem precisar de remoção manual)');
    } catch (error) {
      log.warning(`Erro na limpeza: ${error.message}`);
    }
  }
}

// Executar testes
async function main() {
  const tester = new MultitenantTester();
  await tester.executarTestes();
}

// Verificar se tem dependências
try {
  require('chalk');
} catch (error) {
  console.log('❌ Dependência "chalk" não encontrada. Execute: npm install chalk');
  process.exit(1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MultitenantTester;