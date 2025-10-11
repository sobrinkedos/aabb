// Tipos específicos para o sistema de hierarquia administrativa

import { PapelUsuario, PrivilegiosAdmin } from './multitenant';

// Interface para processo de registro de empresa com primeiro usuário
export interface ProcessoRegistroEmpresa {
  // 1. Validação de dados da empresa
  validarDadosEmpresa(dados: DadosEmpresa): ValidationResult;
  
  // 2. Criação da empresa
  criarEmpresa(dados: DadosEmpresa): Promise<Empresa>;
  
  // 3. Criação automática do SUPER_ADMIN
  criarPrimeiroUsuario(empresaId: string, dadosAdmin: DadosAdmin): Promise<UsuarioEmpresa>;
  
  // 4. Configuração de privilégios totais
  configurarPrivilegiosCompletos(usuarioId: string): Promise<void>;
  
  // 5. Envio de confirmação
  enviarEmailConfirmacao(email: string, token: string): Promise<void>;
}

// Interface para dados do administrador no registro
export interface DadosAdmin {
  nome_completo: string;
  email: string;
  telefone?: string;
  senha: string;
}

// Interface para dados da empresa no registro
export interface DadosEmpresa {
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
}

// Interface para resultado de validação
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Interface para controle de criação de usuários por papel
export interface RestricoesCriacaoUsuario {
  [PapelUsuario.SUPER_ADMIN]: PapelUsuario[]; // Pode criar qualquer papel
  [PapelUsuario.ADMIN]: PapelUsuario[];       // Pode criar MANAGER e USER
  [PapelUsuario.MANAGER]: PapelUsuario[];     // Pode criar apenas USER
  [PapelUsuario.USER]: PapelUsuario[];        // Não pode criar usuários
}

export const RESTRICOES_CRIACAO_USUARIO: RestricoesCriacaoUsuario = {
  [PapelUsuario.SUPER_ADMIN]: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER, PapelUsuario.USER],
  [PapelUsuario.ADMIN]: [PapelUsuario.MANAGER, PapelUsuario.USER],
  [PapelUsuario.MANAGER]: [PapelUsuario.USER],
  [PapelUsuario.USER]: []
};

// Interface para delegação de privilégios
export interface DelegacaoPrivilegio {
  id: string;
  usuario_origem_id: string;
  usuario_destino_id: string;
  privilegio: keyof PrivilegiosAdmin;
  temporario: boolean;
  data_expiracao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para histórico de mudanças de papel
export interface HistoricoMudancaPapel {
  id: string;
  usuario_id: string;
  papel_anterior: PapelUsuario;
  papel_novo: PapelUsuario;
  alterado_por: string;
  motivo?: string;
  created_at: string;
}

// Interface para onboarding do primeiro usuário
export interface OnboardingFlow {
  // Tela 1: Confirmação de privilégios
  mostrarPrivilegios(): void;
  
  // Tela 2: Configuração inicial da empresa
  configurarEmpresa(): void;
  
  // Tela 3: Convite para primeiro funcionário (opcional)
  convidarPrimeiroFuncionario(): void;
  
  // Tela 4: Tour das funcionalidades administrativas
  tourFuncionalidades(): void;
}

// Interface para alertas administrativos
export interface AlertaAdministrativo {
  id: string;
  tipo: 'novo_admin' | 'mudanca_papel' | 'tentativa_escalacao' | 'config_critica';
  titulo: string;
  mensagem: string;
  usuario_afetado?: string;
  usuario_responsavel?: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  lido: boolean;
  created_at: string;
}

// Interface para relatório de atividades administrativas
export interface RelatorioAtividadeAdmin {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    total_usuarios_criados: number;
    total_mudancas_papel: number;
    total_configuracoes_alteradas: number;
    total_tentativas_negadas: number;
  };
  atividades_por_papel: Record<PapelUsuario, number>;
  usuarios_mais_ativos: Array<{
    usuario_id: string;
    nome: string;
    papel: PapelUsuario;
    total_acoes: number;
  }>;
  configuracoes_mais_alteradas: Array<{
    categoria: string;
    total_alteracoes: number;
  }>;
}

// Interface para notificações de mudanças de privilégios
export interface NotificacaoPrivilegio {
  id: string;
  usuario_id: string;
  tipo: 'privilegio_concedido' | 'privilegio_revogado' | 'papel_alterado';
  detalhes: {
    privilegio?: keyof PrivilegiosAdmin;
    papel_anterior?: PapelUsuario;
    papel_novo?: PapelUsuario;
    alterado_por: string;
  };
  lida: boolean;
  created_at: string;
}

// Tipos para componentes de proteção
export interface ProtectedByRoleProps {
  papel: PapelUsuario | PapelUsuario[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ProtectedByPrivilegeProps {
  privilegio: keyof PrivilegiosAdmin;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Interface para indicadores visuais de papel
export interface IndicadorPapel {
  papel: PapelUsuario;
  cor: string;
  icone: string;
  descricao: string;
  privilegios_resumo: string[];
}

export const INDICADORES_PAPEL: Record<PapelUsuario, IndicadorPapel> = {
  [PapelUsuario.SUPER_ADMIN]: {
    papel: PapelUsuario.SUPER_ADMIN,
    cor: 'red',
    icone: 'crown',
    descricao: 'Administrador Principal',
    privilegios_resumo: ['Acesso total', 'Configurações críticas', 'Gerenciar administradores']
  },
  [PapelUsuario.ADMIN]: {
    papel: PapelUsuario.ADMIN,
    cor: 'orange',
    icone: 'shield',
    descricao: 'Administrador',
    privilegios_resumo: ['Gerenciar usuários', 'Configurações gerais', 'Relatórios']
  },
  [PapelUsuario.MANAGER]: {
    papel: PapelUsuario.MANAGER,
    cor: 'blue',
    icone: 'users',
    descricao: 'Gerente',
    privilegios_resumo: ['Gerenciar funcionários', 'Relatórios básicos']
  },
  [PapelUsuario.USER]: {
    papel: PapelUsuario.USER,
    cor: 'gray',
    icone: 'user',
    descricao: 'Usuário',
    privilegios_resumo: ['Acesso aos módulos permitidos']
  }
};