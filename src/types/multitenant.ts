// Tipos para o sistema de autenticação multitenant

// Enums
export enum PapelUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',    // Primeiro usuário - privilégios totais
  ADMIN = 'ADMIN',                // Administrador com algumas restrições
  MANAGER = 'MANAGER',            // Gerente com acesso limitado
  USER = 'USER'                   // Usuário comum
}

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
  GERAL = 'geral',
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
  tipo_usuario: 'administrador' | 'funcionario'; // Mantido para compatibilidade
  papel: PapelUsuario;
  is_primeiro_usuario: boolean;
  status: 'ativo' | 'inativo' | 'bloqueado';
  senha_provisoria: boolean;
  ultimo_login?: string;
  created_at: string;
  updated_at: string;
}

// Interface para Privilégios Administrativos
export interface PrivilegiosAdmin {
  configuracoes_empresa: boolean;
  gerenciar_usuarios: boolean;
  configuracoes_seguranca: boolean;
  integracao_externa: boolean;
  backup_restauracao: boolean;
  relatorios_avancados: boolean;
  auditoria_completa: boolean;
  configuracoes_sistema: boolean;
}

// Matriz de privilégios por papel
export const PRIVILEGIOS_POR_PAPEL: Record<PapelUsuario, PrivilegiosAdmin> = {
  [PapelUsuario.SUPER_ADMIN]: {
    configuracoes_empresa: true,
    gerenciar_usuarios: true,
    configuracoes_seguranca: true,
    integracao_externa: true,
    backup_restauracao: true,
    relatorios_avancados: true,
    auditoria_completa: true,
    configuracoes_sistema: true
  },
  [PapelUsuario.ADMIN]: {
    configuracoes_empresa: true,
    gerenciar_usuarios: true,
    configuracoes_seguranca: false,  // Restrito ao SUPER_ADMIN
    integracao_externa: false,       // Restrito ao SUPER_ADMIN
    backup_restauracao: true,
    relatorios_avancados: true,
    auditoria_completa: false,       // Restrito ao SUPER_ADMIN
    configuracoes_sistema: false     // Restrito ao SUPER_ADMIN
  },
  [PapelUsuario.MANAGER]: {
    configuracoes_empresa: false,
    gerenciar_usuarios: true,
    configuracoes_seguranca: false,
    integracao_externa: false,
    backup_restauracao: false,
    relatorios_avancados: true,
    auditoria_completa: false,
    configuracoes_sistema: false
  },
  [PapelUsuario.USER]: {
    configuracoes_empresa: false,
    gerenciar_usuarios: false,
    configuracoes_seguranca: false,
    integracao_externa: false,
    backup_restauracao: false,
    relatorios_avancados: false,
    auditoria_completa: false,
    configuracoes_sistema: false
  }
};

// Mapeamento de acesso por categoria de configuração
export const ACESSO_CONFIGURACAO: Record<string, PapelUsuario[]> = {
  geral: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
  seguranca: [PapelUsuario.SUPER_ADMIN],
  sistema: [PapelUsuario.SUPER_ADMIN],
  notificacoes: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
  integracao: [PapelUsuario.SUPER_ADMIN]
};

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
export interface ConfiguracaoGeral {
  nome_empresa: string;
  logo_url?: string;
  tema: 'claro' | 'escuro' | 'auto';
  idioma: string;
  timezone: string;
  formato_data: string;
}

export interface ConfiguracaoSeguranca {
  tempo_sessao: number; // em minutos
  tentativas_login: number;
  bloqueio_temporario: number; // em minutos
  exigir_2fa: boolean;
  whitelist_ips?: string[];
  politica_senha: {
    min_caracteres: number;
    exigir_maiuscula: boolean;
    exigir_numero: boolean;
    exigir_simbolo: boolean;
  };
}

export interface ConfiguracaoSistema {
  backup_automatico: boolean;
  retencao_logs_dias: number;
  limite_usuarios: number;
  modulos_habilitados: string[];
}

export interface ConfiguracaoNotificacoes {
  email_novos_usuarios: boolean;
  email_tentativas_login: boolean;
  email_alteracoes_config: boolean;
  webhook_eventos: string[];
}

export interface ConfiguracaoIntegracao {
  webhook_url?: string;
  api_keys: Record<string, string>;
  integracao_externa: {
    erp_ativo: boolean;
    api_endpoint?: string;
    token_acesso?: string;
  };
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
  privilegios: PrivilegiosAdmin;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPrimeiroUsuario: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registrarEmpresa: (data: RegistroEmpresaData) => Promise<{ success: boolean; error?: string }>;
  verificarPermissao: (modulo: ModuloSistema, acao: keyof PermissaoModulo) => boolean;
  verificarPrivilegio: (privilegio: keyof PrivilegiosAdmin) => boolean;
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