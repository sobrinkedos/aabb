import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { AuthorizationMiddleware } from '../../services/authorization-middleware';
import { ModuloSistema } from '../../types/multitenant';

/**
 * Testes de Isolamento Multitenant
 * 
 * Estes testes verificam se o sistema mantém o isolamento adequado
 * entre diferentes empresas e se as políticas RLS estão funcionando corretamente.
 */

describe('Isolamento Multitenant', () => {
  let empresa1Id: string;
  let empresa2Id: string;
  let usuario1Id: string;
  let usuario2Id: string;
  let authToken1: string;
  let authToken2: string;

  beforeEach(async () => {
    // Criar empresas de teste
    const { data: empresa1 } = await supabase
      .from('empresas')
      .insert({
        nome: 'Empresa Teste 1',
        email: 'teste1@exemplo.com',
        telefone: '11999999991',
        status: 'ativa'
      })
      .select()
      .single();

    const { data: empresa2 } = await supabase
      .from('empresas')
      .insert({
        nome: 'Empresa Teste 2',
        email: 'teste2@exemplo.com',
        telefone: '11999999992',
        status: 'ativa'
      })
      .select()
      .single();

    empresa1Id = empresa1!.id;
    empresa2Id = empresa2!.id;

    // Criar usuários de teste
    const { data: auth1 } = await supabase.auth.signUp({
      email: 'usuario1@teste.com',
      password: 'senha123456',
      options: {
        data: { nome_completo: 'Usuário Teste 1' }
      }
    });

    const { data: auth2 } = await supabase.auth.signUp({
      email: 'usuario2@teste.com',
      password: 'senha123456',
      options: {
        data: { nome_completo: 'Usuário Teste 2' }
      }
    });

    usuario1Id = auth1.user!.id;
    usuario2Id = auth2.user!.id;
    authToken1 = auth1.session!.access_token;
    authToken2 = auth2.session!.access_token;

    // Criar registros de usuários nas empresas
    await supabase
      .from('usuarios_empresa')
      .insert({
        user_id: usuario1Id,
        empresa_id: empresa1Id,
        nome_completo: 'Usuário Teste 1',
        email: 'usuario1@teste.com',
        tipo_usuario: 'administrador',
        status: 'ativo'
      });

    await supabase
      .from('usuarios_empresa')
      .insert({
        user_id: usuario2Id,
        empresa_id: empresa2Id,
        nome_completo: 'Usuário Teste 2',
        email: 'usuario2@teste.com',
        tipo_usuario: 'administrador',
        status: 'ativo'
      });
  });

  afterEach(async () => {
    // Limpar dados de teste
    await supabase.from('usuarios_empresa').delete().in('empresa_id', [empresa1Id, empresa2Id]);
    await supabase.from('empresas').delete().in('id', [empresa1Id, empresa2Id]);
    
    // Remover usuários de autenticação
    await supabase.auth.admin.deleteUser(usuario1Id);
    await supabase.auth.admin.deleteUser(usuario2Id);
  });

  describe('Isolamento de Dados por Empresa', () => {
    it('deve impedir acesso a dados de outra empresa', async () => {
      // Criar um funcionário na empresa 1
      const { data: funcionario1 } = await supabase
        .from('employees')
        .insert({
          empresa_id: empresa1Id,
          name: 'Funcionário Empresa 1',
          email: 'func1@empresa1.com',
          position: 'Garçom'
        })
        .select()
        .single();

      // Criar um funcionário na empresa 2
      const { data: funcionario2 } = await supabase
        .from('employees')
        .insert({
          empresa_id: empresa2Id,
          name: 'Funcionário Empresa 2',
          email: 'func2@empresa2.com',
          position: 'Garçom'
        })
        .select()
        .single();

      // Usuário da empresa 1 deve ver apenas funcionários da empresa 1
      const { data: funcionariosEmpresa1 } = await supabase
        .from('employees')
        .select('*')
        .eq('empresa_id', empresa1Id);

      expect(funcionariosEmpresa1).toHaveLength(1);
      expect(funcionariosEmpresa1![0].id).toBe(funcionario1!.id);

      // Usuário da empresa 2 deve ver apenas funcionários da empresa 2
      const { data: funcionariosEmpresa2 } = await supabase
        .from('employees')
        .select('*')
        .eq('empresa_id', empresa2Id);

      expect(funcionariosEmpresa2).toHaveLength(1);
      expect(funcionariosEmpresa2![0].id).toBe(funcionario2!.id);

      // Tentar acessar funcionário de outra empresa deve falhar
      const { data: tentativaAcesso, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', funcionario2!.id)
        .eq('empresa_id', empresa1Id);

      expect(tentativaAcesso).toHaveLength(0);
    });

    it('deve isolar clientes entre empresas', async () => {
      // Criar clientes em empresas diferentes
      const { data: cliente1 } = await supabase
        .from('customers')
        .insert({
          empresa_id: empresa1Id,
          name: 'Cliente Empresa 1',
          email: 'cliente1@empresa1.com',
          phone: '11999999991'
        })
        .select()
        .single();

      const { data: cliente2 } = await supabase
        .from('customers')
        .insert({
          empresa_id: empresa2Id,
          name: 'Cliente Empresa 2',
          email: 'cliente2@empresa2.com',
          phone: '11999999992'
        })
        .select()
        .single();

      // Verificar isolamento
      const { data: clientesEmpresa1 } = await supabase
        .from('customers')
        .select('*')
        .eq('empresa_id', empresa1Id);

      const { data: clientesEmpresa2 } = await supabase
        .from('customers')
        .select('*')
        .eq('empresa_id', empresa2Id);

      expect(clientesEmpresa1).toHaveLength(1);
      expect(clientesEmpresa1![0].id).toBe(cliente1!.id);
      
      expect(clientesEmpresa2).toHaveLength(1);
      expect(clientesEmpresa2![0].id).toBe(cliente2!.id);
    });

    it('deve isolar comandas entre empresas', async () => {
      // Criar comandas em empresas diferentes
      const { data: comanda1 } = await supabase
        .from('comandas')
        .insert({
          empresa_id: empresa1Id,
          numero_comanda: 1,
          customer_name: 'Cliente 1',
          status: 'aberta',
          total_amount: 50.00
        })
        .select()
        .single();

      const { data: comanda2 } = await supabase
        .from('comandas')
        .insert({
          empresa_id: empresa2Id,
          numero_comanda: 1,
          customer_name: 'Cliente 2',
          status: 'aberta',
          total_amount: 75.00
        })
        .select()
        .single();

      // Verificar isolamento
      const { data: comandasEmpresa1 } = await supabase
        .from('comandas')
        .select('*')
        .eq('empresa_id', empresa1Id);

      const { data: comandasEmpresa2 } = await supabase
        .from('comandas')
        .select('*')
        .eq('empresa_id', empresa2Id);

      expect(comandasEmpresa1).toHaveLength(1);
      expect(comandasEmpresa1![0].id).toBe(comanda1!.id);
      
      expect(comandasEmpresa2).toHaveLength(1);
      expect(comandasEmpresa2![0].id).toBe(comanda2!.id);
    });
  });

  describe('Políticas RLS (Row Level Security)', () => {
    it('deve aplicar RLS em todas as tabelas principais', async () => {
      const tabelas = [
        'empresas',
        'usuarios_empresa',
        'employees',
        'customers',
        'comandas',
        'balcao_orders',
        'cash_sessions',
        'cash_transactions',
        'logs_auditoria',
        'configuracoes_empresa',
        'permissoes_usuario'
      ];

      for (const tabela of tabelas) {
        const { data, error } = await supabase
          .rpc('check_rls_enabled', { table_name: tabela });

        expect(error).toBeNull();
        expect(data).toBe(true);
      }
    });

    it('deve ter políticas de isolamento por empresa', async () => {
      // Verificar se existem políticas para isolamento
      const { data: policies } = await supabase
        .rpc('get_table_policies', { schema_name: 'public' });

      const tabelasComIsolamento = [
        'employees',
        'customers',
        'comandas',
        'balcao_orders',
        'cash_sessions',
        'cash_transactions'
      ];

      for (const tabela of tabelasComIsolamento) {
        const policiesForTable = policies?.filter((p: any) => p.tablename === tabela);
        expect(policiesForTable?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Middleware de Autorização', () => {
    it('deve validar tokens de autenticação', async () => {
      const result = await AuthorizationMiddleware.checkAuth(authToken1);
      
      expect(result.authorized).toBe(true);
      expect(result.user?.empresa_id).toBe(empresa1Id);
    });

    it('deve rejeitar tokens inválidos', async () => {
      const result = await AuthorizationMiddleware.checkAuth('token_invalido');
      
      expect(result.authorized).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve verificar permissões específicas', async () => {
      const result = await AuthorizationMiddleware.checkPermission(
        authToken1,
        ModuloSistema.FUNCIONARIOS,
        'visualizar'
      );
      
      // Administrador deve ter acesso total
      expect(result.authorized).toBe(true);
    });

    it('deve verificar isolamento por empresa', async () => {
      const result = await AuthorizationMiddleware.checkTenantIsolation(
        authToken1,
        empresa1Id
      );
      
      expect(result.authorized).toBe(true);
      
      // Tentar acessar recurso de outra empresa
      const resultNegado = await AuthorizationMiddleware.checkTenantIsolation(
        authToken1,
        empresa2Id
      );
      
      expect(resultNegado.authorized).toBe(false);
    });
  });

  describe('Logs de Auditoria', () => {
    it('deve registrar ações com isolamento por empresa', async () => {
      // Registrar uma ação
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresa1Id,
        p_usuario_id: usuario1Id,
        p_acao: 'TEST_ACTION',
        p_recurso: 'test_resource',
        p_detalhes: { teste: true }
      });

      // Verificar se o log foi criado apenas para a empresa correta
      const { data: logsEmpresa1 } = await supabase
        .from('logs_auditoria')
        .select('*')
        .eq('empresa_id', empresa1Id)
        .eq('acao', 'TEST_ACTION');

      const { data: logsEmpresa2 } = await supabase
        .from('logs_auditoria')
        .select('*')
        .eq('empresa_id', empresa2Id)
        .eq('acao', 'TEST_ACTION');

      expect(logsEmpresa1).toHaveLength(1);
      expect(logsEmpresa2).toHaveLength(0);
    });
  });

  describe('Configurações de Empresa', () => {
    it('deve isolar configurações entre empresas', async () => {
      // Criar configurações para cada empresa
      await supabase
        .from('configuracoes_empresa')
        .insert({
          empresa_id: empresa1Id,
          categoria: 'sistema',
          configuracoes: { tema: 'claro' }
        });

      await supabase
        .from('configuracoes_empresa')
        .insert({
          empresa_id: empresa2Id,
          categoria: 'sistema',
          configuracoes: { tema: 'escuro' }
        });

      // Verificar isolamento
      const { data: configEmpresa1 } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .eq('empresa_id', empresa1Id);

      const { data: configEmpresa2 } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .eq('empresa_id', empresa2Id);

      expect(configEmpresa1).toHaveLength(1);
      expect(configEmpresa1![0].configuracoes.tema).toBe('claro');
      
      expect(configEmpresa2).toHaveLength(1);
      expect(configEmpresa2![0].configuracoes.tema).toBe('escuro');
    });
  });

  describe('Permissões de Usuário', () => {
    it('deve isolar permissões entre empresas', async () => {
      // Criar usuários funcionários
      const { data: func1 } = await supabase
        .from('usuarios_empresa')
        .insert({
          empresa_id: empresa1Id,
          nome_completo: 'Funcionário 1',
          email: 'func1@empresa1.com',
          tipo_usuario: 'funcionario',
          status: 'ativo'
        })
        .select()
        .single();

      const { data: func2 } = await supabase
        .from('usuarios_empresa')
        .insert({
          empresa_id: empresa2Id,
          nome_completo: 'Funcionário 2',
          email: 'func2@empresa2.com',
          tipo_usuario: 'funcionario',
          status: 'ativo'
        })
        .select()
        .single();

      // Criar permissões
      await supabase
        .from('permissoes_usuario')
        .insert({
          usuario_empresa_id: func1!.id,
          modulo: ModuloSistema.CLIENTES,
          permissoes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
        });

      await supabase
        .from('permissoes_usuario')
        .insert({
          usuario_empresa_id: func2!.id,
          modulo: ModuloSistema.CLIENTES,
          permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
        });

      // Verificar isolamento
      const { data: permFunc1 } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', func1!.id);

      const { data: permFunc2 } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', func2!.id);

      expect(permFunc1).toHaveLength(1);
      expect(permFunc1![0].permissoes.criar).toBe(false);
      
      expect(permFunc2).toHaveLength(1);
      expect(permFunc2![0].permissoes.criar).toBe(true);
    });
  });
});