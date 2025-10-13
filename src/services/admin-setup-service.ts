import { supabase } from '../lib/supabase';
import { ModuloSistema, CategoriaConfiguracao } from '../types/multitenant';

export interface AdminSetupData {
  userId: string;
  name: string;
  email: string;
  companyName?: string;
}

export class AdminSetupService {
  /**
   * Configura o primeiro usuário como administrador principal
   */
  static async setupFirstAdmin(data: AdminSetupData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Configurando primeiro administrador:', data.email);

      // 1. Verificar se realmente é o primeiro usuário
      const { data: existingUsers, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (countError) {
        throw new Error(`Erro ao verificar usuários: ${countError.message}`);
      }

      const isFirstUser = !existingUsers || existingUsers.length <= 1; // <= 1 porque o usuário atual já foi criado

      if (!isFirstUser) {
        console.log('ℹ️ Não é o primeiro usuário, configuração de admin não aplicada');
        return { success: true };
      }

      // 2. Criar empresa padrão
      const empresaId = await this.createDefaultCompany(data);

      // 3. Configurar usuário como admin da empresa
      await this.setupUserAsAdmin(data.userId, empresaId, data);

      // 4. Criar configurações padrão
      await this.createDefaultConfigurations(empresaId);

      // 5. Criar permissões completas
      await this.createFullPermissions(data.userId, empresaId);

      console.log('✅ Primeiro administrador configurado com sucesso!');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao configurar administrador:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Cria empresa padrão para o primeiro usuário
   */
  private static async createDefaultCompany(data: AdminSetupData): Promise<string> {
    const empresaId = `empresa-${data.userId}`;
    const companyName = data.companyName || 'Minha Empresa';

    const empresaData = {
      id: empresaId,
      nome: companyName,
      razao_social: `${companyName} Ltda`,
      cnpj: '00.000.000/0001-00', // CNPJ placeholder
      email: data.email,
      telefone: '(11) 99999-9999',
      endereco: JSON.stringify({
        rua: 'Rua da Empresa',
        numero: '123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '00000-000'
      }),
      plano: 'premium',
      status: 'ativo',
      configuracoes: JSON.stringify({
        initialized: true,
        firstAdmin: data.userId,
        setupDate: new Date().toISOString()
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('empresas')
      .insert([empresaData]);

    if (error) {
      throw new Error(`Erro ao criar empresa: ${error.message}`);
    }

    console.log('🏢 Empresa padrão criada:', companyName);
    return empresaId;
  }

  /**
   * Configura usuário como administrador da empresa
   */
  private static async setupUserAsAdmin(userId: string, empresaId: string, data: AdminSetupData): Promise<void> {
    const usuarioEmpresaData = {
      user_id: userId,
      empresa_id: empresaId,
      nome_completo: data.name,
      email: data.email,
      cargo: 'Administrador Principal',
      tipo_usuario: 'administrador',
      status: 'ativo',
      senha_provisoria: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('usuarios_empresa')
      .insert([usuarioEmpresaData]);

    if (error) {
      throw new Error(`Erro ao criar vínculo usuário-empresa: ${error.message}`);
    }

    console.log('👤 Usuário configurado como administrador principal');
  }

  /**
   * Cria configurações padrão da empresa
   */
  private static async createDefaultConfigurations(empresaId: string): Promise<void> {
    const configuracoes = [
      // Configurações Gerais
      {
        empresa_id: empresaId,
        categoria: 'geral',
        chave: 'nome_sistema',
        valor: 'ClubManager Pro',
        descricao: 'Nome do sistema',
        tipo: 'string'
      },
      {
        empresa_id: empresaId,
        categoria: 'geral',
        chave: 'timezone',
        valor: 'America/Sao_Paulo',
        descricao: 'Fuso horário',
        tipo: 'string'
      },
      {
        empresa_id: empresaId,
        categoria: 'geral',
        chave: 'moeda',
        valor: 'BRL',
        descricao: 'Moeda padrão',
        tipo: 'string'
      },

      // Configurações de Segurança
      {
        empresa_id: empresaId,
        categoria: 'seguranca',
        chave: 'senha_min_length',
        valor: '8',
        descricao: 'Tamanho mínimo da senha',
        tipo: 'number'
      },
      {
        empresa_id: empresaId,
        categoria: 'seguranca',
        chave: 'exigir_2fa_admin',
        valor: 'false',
        descricao: 'Exigir 2FA para administradores',
        tipo: 'boolean'
      },
      {
        empresa_id: empresaId,
        categoria: 'seguranca',
        chave: 'tentativas_login_max',
        valor: '5',
        descricao: 'Máximo de tentativas de login',
        tipo: 'number'
      },

      // Configurações de Backup
      {
        empresa_id: empresaId,
        categoria: 'backup',
        chave: 'backup_automatico',
        valor: 'true',
        descricao: 'Backup automático habilitado',
        tipo: 'boolean'
      },
      {
        empresa_id: empresaId,
        categoria: 'backup',
        chave: 'backup_frequencia',
        valor: 'diario',
        descricao: 'Frequência do backup',
        tipo: 'string'
      },
      {
        empresa_id: empresaId,
        categoria: 'backup',
        chave: 'backup_retencao_dias',
        valor: '30',
        descricao: 'Dias de retenção do backup',
        tipo: 'number'
      },

      // Configurações de Notificações
      {
        empresa_id: empresaId,
        categoria: 'notificacoes',
        chave: 'email_alertas_sistema',
        valor: 'true',
        descricao: 'Enviar alertas por email',
        tipo: 'boolean'
      },
      {
        empresa_id: empresaId,
        categoria: 'notificacoes',
        chave: 'email_relatorios',
        valor: 'true',
        descricao: 'Enviar relatórios por email',
        tipo: 'boolean'
      }
    ];

    const { error } = await supabase
      .from('configuracoes_empresa')
      .insert(configuracoes);

    if (error) {
      throw new Error(`Erro ao criar configurações: ${error.message}`);
    }

    console.log('⚙️ Configurações padrão criadas');
  }

  /**
   * Cria permissões completas para o administrador principal
   */
  private static async createFullPermissions(userId: string, empresaId: string): Promise<void> {
    // Buscar o ID do usuário na tabela usuarios_empresa
    const { data: usuarioEmpresa, error: userError } = await supabase
      .from('usuarios_empresa')
      .select('id')
      .eq('user_id', userId)
      .eq('empresa_id', empresaId)
      .single();

    if (userError || !usuarioEmpresa) {
      throw new Error('Usuário da empresa não encontrado');
    }

    // Criar permissões completas para todos os módulos
    const permissoes = Object.values(ModuloSistema).map(modulo => ({
      usuario_empresa_id: usuarioEmpresa.id,
      modulo: modulo,
      permissoes: JSON.stringify({
        visualizar: true,
        criar: true,
        editar: true,
        excluir: true,
        administrar: true
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('permissoes_usuario')
      .insert(permissoes);

    if (error) {
      throw new Error(`Erro ao criar permissões: ${error.message}`);
    }

    console.log('🔐 Permissões completas criadas para administrador');
  }

  /**
   * Verifica se um usuário é o administrador principal
   */
  static async isMainAdmin(userId: string): Promise<boolean> {
    try {
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('configuracoes')
        .eq('id', `empresa-${userId}`)
        .single();

      if (error || !empresa) return false;

      const config = typeof empresa.configuracoes === 'string' 
        ? JSON.parse(empresa.configuracoes) 
        : empresa.configuracoes;

      return config?.firstAdmin === userId;
    } catch {
      return false;
    }
  }

  /**
   * Obtém informações de configuração da empresa
   */
  static async getCompanySetupInfo(empresaId: string): Promise<{
    isSetup: boolean;
    firstAdmin?: string;
    setupDate?: string;
  }> {
    try {
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('configuracoes')
        .eq('id', empresaId)
        .single();

      if (error || !empresa) {
        return { isSetup: false };
      }

      const config = typeof empresa.configuracoes === 'string' 
        ? JSON.parse(empresa.configuracoes) 
        : empresa.configuracoes;

      return {
        isSetup: config?.initialized || false,
        firstAdmin: config?.firstAdmin,
        setupDate: config?.setupDate
      };
    } catch {
      return { isSetup: false };
    }
  }
}