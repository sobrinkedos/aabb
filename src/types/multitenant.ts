// Tipos para o sistema de autenticação multitenant

// Enums
export enum ModuloSistema {
  DASHBOARD = 'dashboard',
  MONITOR_BAR = 'monitor_bar',
  ATENDIMENTO_BAR = 'atendimento_bar',
  MONITOR_COZINHA = 'monitor_cozinha',
  GESTAO_CAIXA = 'gestao_caixa',
  CLIENTES = 'clientes',
  FUNCIONARIOS = 'funcionarios',
  SOCIOS = 'socios',
  CONFIGURACOES = 'configuracoes',
  RELATORIOS = 'relatorios'
}

export enum CategoriaConfiguracao {
  SEGURANCA = 'seguranca',
  SISTEMA = 'sistema',
  NOTIFICACOES = 'notificacoes',
  INTEGRACAO = 'integracao'
}

// Interface para Empresa
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email_admin: string;
  telefone?: string;
  endereco?: {
    rua: string;
    numero: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  plano: 'basico' | 'premium' | 'enterprise';
  status: 'ativo' | 'inativo' | 'suspenso';
  configuracoes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Interface para Usuário da Empresa
export interface UsuarioEmpresa {
  id: string;
  user_id: string;
  empresa_id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  cargo?: string;
  tipo_usuario: 'administrador' | 'funcionario';
  status: 'ativo' | 'inativo' | 'bloqueado';
  senha_provisoria: boolean;
  ultimo_login?: string;
  created_at: string;
  updated_at: string;
}

// Interface para Permissões de Módulo
export interface PermissaoModulo {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  administrar?: boolean;
}

// Interface para Permissões de Usuário
export interface PermissaoUsuario {
  id: string;
  usuario_empresa_id: string;
  modulo: ModuloSistema;
  permissoes: PermissaoModulo;
  created_at: string;
  updated_at: string;
}

// Interface para Configurações da Empresa
export interface ConfiguracaoEmpresa {
  id: string;
  empresa_id: string;
  categoria: CategoriaConfiguracao;
  configuracoes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Interfaces específicas para cada categoria de configuração
export interface ConfiguracaoSeguranca {
  tempo_sessao: number; // em minutos
  tentativas_login: number;
  bloqueio_temporario: number; // em minutos
  exigir_2fa: boolean;
}

export interface ConfiguracaoSistema {
  tema: 'claro' | 'escuro' | 'auto';
  idioma: string;
  timezone: string;
  formato_data: string;
}

export interface ConfiguracaoNotificacoes {
  email_novos_usuarios: boolean;
  email_tentativas_login: boolean;
  email_alteracoes_config: boolean;
}

export interface ConfiguracaoIntegracao {
  webhook_url?: string;
  api_keys: Record<string, string>;
}

// Interface para Logs de Auditoria
export interface LogAuditoria {
  id: string;
  empresa_id: string;
  usuario_id?: string;
  acao: string;
  recurso?: string;
  detalhes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Interface para dados de registro de empresa
export interface RegistroEmpresaData {
  // Dados da empresa
  nome_empresa: string;
  cnpj: string;
  telefone_empresa?: string;
  endereco?: {
    rua: string;
    numero: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  
  // Dados do administrador
  nome_admin: string;
  email_admin: string;
  telefone_admin?: string;
  senha: string;
  confirmar_senha: string;
}

// Interface para contexto de autenticação multitenant
export interface AuthContextMultitenant {
  user: UsuarioEmpresa | null;
  empresa: Empresa | null;
  permissoes: Record<ModuloSistema, PermissaoModulo>;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registrarEmpresa: (data: RegistroEmpresaData) => Promise<{ success: boolean; error?: string }>;
  verificarPermissao: (modulo: ModuloSistema, acao: keyof PermissaoModulo) => boolean;
  atualizarPermissoes: () => Promise<void>;
}

// Interface para filtros de logs
export interface FiltrosLog {
  usuario_id?: string;
  acao?: string;
  recurso?: string;
  data_inicio?: string;
  data_fim?: string;
  ip_address?: string;
}

// Interface para resposta de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interface para paginação
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}