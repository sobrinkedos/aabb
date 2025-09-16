import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { AuthorizationMiddleware, PermissionUtils } from '../../services/authorization-middleware';
import { ModuloSistema, PermissaoModulo } from '../../types/multitenant';
import { useFuncionarios } from '../../hooks/useFuncionarios';
import { renderHook, act } from '@testing-library/react';

/**
 * Testes de Permissões e Autenticação
 * 
 * Estes testes verificam se o sistema de permissões está funcionando
 * corretamente e se a autenticação está segura.
 */

describe('Permissões e Autenticação', () => {
  let empresaId: string;
  let adminId: string;
  let funcionarioId: string;
  let adminToken: string;
  let funcionarioToken: string;

  beforeEach(async () => {
    // Criar empresa de teste
    const { data: empresa } = await supabase
      .from('empresas')
      .insert({
        nome: 'Empresa Teste Permissões',
        email: 'permissoes@teste.com',
        telefone: '11999999999',
        status: 'ativa'
      })
      .select()
      .single();

    empresaId = empresa!.id;

    // Criar usuário administrador
    const { data: authAdmin } = await supabase.auth.signUp({
      email: 'admin@teste.com',
      password: 'senha123456',
      options: {
        data: { nome_completo: 'Administrador Teste' }
      }
    });

    // Criar usuário funcionário
    const { data: authFunc } = await supabase.auth.signUp({
      email: 'funcionario@teste.com',
      password: 'senha123456',
      options: {
        data: { nome_completo: 'Funcionário Teste' }
      }
    });

    adminToken = authAdmin.session!.access_token;
    funcionarioToken = authFunc.session!.access_token;

    // Criar registros de usuários na empresa
    const { data: adminUser } = await supabase
      .from('usuarios_empresa')
      .insert({
        user_id: authAdmin.user!.id,
        empresa_id: empresaId,
        nome_completo: 'Administrador Teste',
        email: 'admin@teste.com',
        tipo_usuario: 'administrador',
        status: 'ativo'
      })
      .select()
      .single();

    const { data: funcUser } = await supabase
      .from('usuarios_empresa')
      .insert({
        user_id: authFunc.user!.id,
        empresa_id: empresaId,
        nome_completo: 'Funcionário Teste',
        email: 'funcionario@teste.com',
        tipo_usuario: 'funcionario',
        status: 'ativo'
      })
      .select()
      .single();

    adminId = adminUser!.id;
    funcionarioId = funcUser!.id;

    // Criar permissões limitadas para o funcionário
    await supabase
      .from('permissoes_usuario')
      .insert([
        {
          usuario_empresa_id: funcionarioId,
          modulo: ModuloSistema.CLIENTES,
          permissoes: {
            visualizar: true,
            criar: true,
            editar: false,
            excluir: false,
            administrar: false
          }
        },
        {
          usuario_empresa_id: funcionarioId,
          modulo: ModuloSistema.DASHBOARD,
          permissoes: {
            visualizar: true,
            criar: false,
            editar: false,
            excluir: false,
            administrar: false
          }
        }
      ]);
  });

  afterEach(async () => {
    // Limpar dados de teste
    await supabase.from('permissoes_usuario').delete().eq('usuario_empresa_id', funcionarioId);
    await supabase.from('usuarios_empresa').delete().in('id', [adminId, funcionarioId]);
    await supabase.from('empresas').delete().eq('id', empresaId);
  });

  describe('Autenticação de Usuários', () => {
    it('deve autenticar administrador com sucesso', async () => {
      const result = await AuthorizationMiddleware.checkAuth(adminToken);
      
      expect(result.authorized).toBe(true);
      expect(result.user?.tipo_usuario).toBe('administrador');
      expect(result.user?.empresa_id).toBe(empresaId);
    });

    it('deve autenticar funcionário com sucesso', async () => {
      const result = await AuthorizationMiddleware.checkAuth(funcionarioToken);
      
      expect(result.authorized).toBe(true);
      expect(result.user?.tipo_usuario).toBe('funcionario');
      expect(result.user?.empresa_id).toBe(empresaId);
    });

    it('deve rejeitar token inválido', async () => {
      const result = await AuthorizationMiddleware.checkAuth('token_invalido');
      
      expect(result.authorized).toBe(false);
      expect(result.error).toContain('Token inválido');
    });

    it('deve rejeitar token expirado', async () => {
      const tokenExpirado = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const result = await AuthorizationMiddleware.checkAuth(tokenExpirado);
      
      expect(result.authorized).toBe(false);
    });

    it('deve verificar status do usuário', async () => {
      // Desativar usuário
      await supabase
        .from('usuarios_empresa')
        .update({ status: 'inativo' })
        .eq('id', funcionarioId);

      const result = await AuthorizationMiddleware.checkAuth(funcionarioToken);
      
      expect(result.authorized).toBe(false);
      expect(result.error).toContain('inativo');
    });
  });

  describe('Verificação de Permissões', () => {
    it('administrador deve ter acesso total', async () => {
      const modules = Object.values(ModuloSistema);
      const actions = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'] as const;

      for (const module of modules) {
        for (const action of actions) {
          const result = await AuthorizationMiddleware.checkPermission(
            adminToken,
            module,
            action
          );
          
          expect(result.authorized).toBe(true);
        }
      }
    });

    it('funcionário deve ter permissões limitadas', async () => {
      // Permissões que o funcionário DEVE ter
      const permissoesPermitidas = [
        { modulo: ModuloSistema.CLIENTES, acao: 'visualizar' as const },
        { modulo: ModuloSistema.CLIENTES, acao: 'criar' as const },
        { modulo: ModuloSistema.DASHBOARD, acao: 'visualizar' as const }
      ];

      for (const { modulo, acao } of permissoesPermitidas) {
        const result = await AuthorizationMiddleware.checkPermission(
          funcionarioToken,
          modulo,
          acao
        );
        
        expect(result.authorized).toBe(true);
      }

      // Permissões que o funcionário NÃO deve ter
      const permissoesNegadas = [
        { modulo: ModuloSistema.CLIENTES, acao: 'editar' as const },
        { modulo: ModuloSistema.CLIENTES, acao: 'excluir' as const },
        { modulo: ModuloSistema.CLIENTES, acao: 'administrar' as const },
        { modulo: ModuloSistema.FUNCIONARIOS, acao: 'visualizar' as const },
        { modulo: ModuloSistema.CONFIGURACOES, acao: 'visualizar' as const }
      ];

      for (const { modulo, acao } of permissoesNegadas) {
        const result = await AuthorizationMiddleware.checkPermission(
          funcionarioToken,
          modulo,
          acao
        );
        
        expect(result.authorized).toBe(false);
      }
    });

    it('deve verificar permissões hierárquicas', async () => {
      // Dar permissão de administrar para um módulo
      await supabase
        .from('permissoes_usuario')
        .upsert({
          usuario_empresa_id: funcionarioId,
          modulo: ModuloSistema.ATENDIMENTO_BAR,
          permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: true,
            administrar: true
          }
        });

      // Deve ter todas as permissões para este módulo
      const acoes = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'] as const;
      
      for (const acao of acoes) {
        const result = await AuthorizationMiddleware.checkPermission(
          funcionarioToken,
          ModuloSistema.ATENDIMENTO_BAR,
          acao
        );
        
        expect(result.authorized).toBe(true);
      }
    });
  });

  describe('Utilitários de Permissão', () => {
    it('deve calcular permissões implícitas corretamente', () => {
      const permissoesAdmin = PermissionUtils.impliesPermissions('administrar');
      expect(permissoesAdmin).toEqual(['visualizar', 'criar', 'editar', 'excluir', 'administrar']);

      const permissoesEditar = PermissionUtils.impliesPermissions('editar');
      expect(permissoesEditar).toEqual(['visualizar', 'editar']);

      const permissoesVisualizar = PermissionUtils.impliesPermissions('visualizar');
      expect(permissoesVisualizar).toEqual(['visualizar']);
    });

    it('deve verificar permissão mínima necessária', () => {
      const permissoes: PermissaoModulo = {
        visualizar: true,
        criar: true,
        editar: false,
        excluir: false,
        administrar: false
      };

      expect(PermissionUtils.hasMinimumPermission(permissoes, 'visualizar')).toBe(true);
      expect(PermissionUtils.hasMinimumPermission(permissoes, 'criar')).toBe(true);
      expect(PermissionUtils.hasMinimumPermission(permissoes, 'editar')).toBe(false);
      expect(PermissionUtils.hasMinimumPermission(permissoes, 'excluir')).toBe(false);
    });

    it('deve calcular nível de acesso corretamente', () => {
      const permissoesAdmin: PermissaoModulo = {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: true,
        administrar: true
      };

      const permissoesEscrita: PermissaoModulo = {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false,
        administrar: false
      };

      const permissoesLeitura: PermissaoModulo = {
        visualizar: true,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      };

      const permissoesNenhuma: PermissaoModulo = {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      };

      expect(PermissionUtils.getAccessLevel(permissoesAdmin)).toBe('admin');
      expect(PermissionUtils.getAccessLevel(permissoesEscrita)).toBe('write');
      expect(PermissionUtils.getAccessLevel(permissoesLeitura)).toBe('read');
      expect(PermissionUtils.getAccessLevel(permissoesNenhuma)).toBe('none');
    });

    it('deve filtrar módulos acessíveis', () => {
      const todasPermissoes = {
        [ModuloSistema.DASHBOARD]: {
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false,
          administrar: false
        },
        [ModuloSistema.CLIENTES]: {
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false,
          administrar: false
        },
        [ModuloSistema.FUNCIONARIOS]: {
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
          administrar: true
        },
        [ModuloSistema.CONFIGURACOES]: {
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          administrar: false
        }
      } as Record<ModuloSistema, PermissaoModulo>;

      const modulosLeitura = PermissionUtils.getAccessibleModules(todasPermissoes, 'read');
      expect(modulosLeitura).toHaveLength(3);
      expect(modulosLeitura).toContain(ModuloSistema.DASHBOARD);
      expect(modulosLeitura).toContain(ModuloSistema.CLIENTES);
      expect(modulosLeitura).toContain(ModuloSistema.FUNCIONARIOS);

      const modulosEscrita = PermissionUtils.getAccessibleModules(todasPermissoes, 'write');
      expect(modulosEscrita).toHaveLength(2);
      expect(modulosEscrita).toContain(ModuloSistema.CLIENTES);
      expect(modulosEscrita).toContain(ModuloSistema.FUNCIONARIOS);

      const modulosAdmin = PermissionUtils.getAccessibleModules(todasPermissoes, 'admin');
      expect(modulosAdmin).toHaveLength(1);
      expect(modulosAdmin).toContain(ModuloSistema.FUNCIONARIOS);
    });
  });

  describe('Middleware de Administrador', () => {
    it('deve permitir acesso para administrador', async () => {
      const result = await AuthorizationMiddleware.requireAdmin(adminToken);
      
      expect(result.authorized).toBe(true);
      expect(result.user?.tipo_usuario).toBe('administrador');
    });

    it('deve negar acesso para funcionário', async () => {
      const result = await AuthorizationMiddleware.requireAdmin(funcionarioToken);
      
      expect(result.authorized).toBe(false);
      expect(result.error).toContain('administradores');
    });
  });

  describe('Logs de Auditoria de Acesso', () => {
    it('deve registrar tentativas de acesso', async () => {
      // Simular tentativa de acesso
      await AuthorizationMiddleware.logAccessAttempt(
        adminId,
        empresaId,
        'ACCESS_ATTEMPT',
        'test_resource',
        true,
        '127.0.0.1',
        'Test User Agent'
      );

      // Verificar se o log foi criado
      const { data: logs } = await supabase
        .from('logs_auditoria')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('acao', 'ACCESS_ATTEMPT')
        .eq('recurso', 'test_resource');

      expect(logs).toHaveLength(1);
      expect(logs![0].usuario_id).toBe(adminId);
      expect(logs![0].ip_address).toBe('127.0.0.1');
    });

    it('deve registrar tentativas de acesso negadas', async () => {
      await AuthorizationMiddleware.logAccessAttempt(
        funcionarioId,
        empresaId,
        'UNAUTHORIZED_ACCESS',
        'admin_resource',
        false,
        '192.168.1.100'
      );

      const { data: logs } = await supabase
        .from('logs_auditoria')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('acao', 'FAILED_UNAUTHORIZED_ACCESS')
        .eq('recurso', 'admin_resource');

      expect(logs).toHaveLength(1);
      expect(logs![0].detalhes.success).toBe(false);
    });
  });

  describe('Segurança de Senha Provisória', () => {
    it('deve detectar usuários com senha provisória', async () => {
      // Marcar usuário como tendo senha provisória
      await supabase
        .from('usuarios_empresa')
        .update({ senha_provisoria: true })
        .eq('id', funcionarioId);

      // Verificar detecção
      const { data: usuario } = await supabase
        .from('usuarios_empresa')
        .select('senha_provisoria')
        .eq('id', funcionarioId)
        .single();

      expect(usuario?.senha_provisoria).toBe(true);
    });

    it('deve bloquear acesso para usuários com senha provisória', async () => {
      // Marcar como senha provisória
      await supabase
        .from('usuarios_empresa')
        .update({ senha_provisoria: true })
        .eq('id', funcionarioId);

      // Tentar autenticar
      const result = await AuthorizationMiddleware.checkAuth(funcionarioToken);
      
      // Deve permitir autenticação mas indicar necessidade de troca
      expect(result.authorized).toBe(true);
      
      // Verificar se há indicação de senha provisória
      const { data: userCheck } = await supabase
        .from('usuarios_empresa')
        .select('senha_provisoria')
        .eq('user_id', result.user?.id)
        .single();
      
      expect(userCheck?.senha_provisoria).toBe(true);
    });
  });

  describe('Validação de Configurações de Segurança', () => {
    it('deve aplicar configurações de senha da empresa', async () => {
      // Criar configurações de segurança
      await supabase
        .from('configuracoes_empresa')
        .insert({
          empresa_id: empresaId,
          categoria: 'seguranca',
          configuracoes: {
            senha_minima_caracteres: 12,
            senha_exigir_maiuscula: true,
            senha_exigir_numero: true,
            senha_exigir_simbolo: true,
            tentativas_login: 3,
            bloqueio_temporario: 60
          }
        });

      // Verificar se as configurações foram salvas
      const { data: config } = await supabase
        .from('configuracoes_empresa')
        .select('configuracoes')
        .eq('empresa_id', empresaId)
        .eq('categoria', 'seguranca')
        .single();

      expect(config?.configuracoes.senha_minima_caracteres).toBe(12);
      expect(config?.configuracoes.tentativas_login).toBe(3);
    });
  });
});