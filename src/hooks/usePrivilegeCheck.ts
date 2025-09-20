import { useHierarchicalAuth } from '../contexts/HierarchicalAuthContext';
import { PapelUsuario } from '../types/multitenant';

/**
 * Hook para verificações rápidas de privilégios
 */
export function usePrivilegeCheck() {
  const { 
    verificarPrivilegio, 
    podeGerenciarUsuario, 
    podeAcessarConfiguracao, 
    papel,
    isPrimeiroUsuario 
  } = useHierarchicalAuth();

  return {
    // Verificações de privilégios específicos
    podeConfigurarEmpresa: () => verificarPrivilegio('configuracoes_empresa'),
    podeGerenciarUsuarios: () => verificarPrivilegio('gerenciar_usuarios'),
    podeConfigurarSeguranca: () => verificarPrivilegio('configuracoes_seguranca'),
    podeIntegracaoExterna: () => verificarPrivilegio('integracao_externa'),
    podeBackupRestauracao: () => verificarPrivilegio('backup_restauracao'),
    podeRelatoriosAvancados: () => verificarPrivilegio('relatorios_avancados'),
    podeAuditoriaCompleta: () => verificarPrivilegio('auditoria_completa'),
    podeConfigurarSistema: () => verificarPrivilegio('configuracoes_sistema'),
    
    // Verificações de papel
    isSuperAdmin: () => papel === PapelUsuario.SUPER_ADMIN,
    isAdmin: () => papel === PapelUsuario.ADMIN,
    isManager: () => papel === PapelUsuario.MANAGER,
    isUser: () => papel === PapelUsuario.USER,
    isPrimeiroUsuario: () => isPrimeiroUsuario,
    
    // Verificações de gerenciamento
    podeGerenciarUsuario,
    podeAcessarConfiguracao,
    
    // Verificações específicas por categoria de configuração
    podeAcessarConfiguracaoGeral: () => podeAcessarConfiguracao('geral'),
    podeAcessarConfiguracaoSeguranca: () => podeAcessarConfiguracao('seguranca'),
    podeAcessarConfiguracaoSistema: () => podeAcessarConfiguracao('sistema'),
    podeAcessarConfiguracaoNotificacoes: () => podeAcessarConfiguracao('notificacoes'),
    podeAcessarConfiguracaoIntegracao: () => podeAcessarConfiguracao('integracao'),
    
    // Verificações de criação de usuários
    podeCriarSuperAdmin: () => papel === PapelUsuario.SUPER_ADMIN,
    podeCriarAdmin: () => papel === PapelUsuario.SUPER_ADMIN,
    podeCriarManager: () => [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN].includes(papel!),
    podeCriarUser: () => [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER].includes(papel!),
    
    // Papel atual
    papel,
    isPrimeiroUsuario
  };
}

/**
 * Hook para verificações de acesso a módulos específicos
 */
export function useModuleAccess() {
  const { verificarPrivilegio, papel } = useHierarchicalAuth();

  return {
    // Módulos administrativos
    podeAcessarGestaoUsuarios: () => verificarPrivilegio('gerenciar_usuarios'),
    podeAcessarConfiguracoes: () => verificarPrivilegio('configuracoes_empresa'),
    podeAcessarRelatorios: () => verificarPrivilegio('relatorios_avancados'),
    podeAcessarAuditoria: () => verificarPrivilegio('auditoria_completa'),
    podeAcessarIntegracoes: () => verificarPrivilegio('integracao_externa'),
    podeAcessarBackup: () => verificarPrivilegio('backup_restauracao'),
    
    // Módulos operacionais (baseado em permissões específicas)
    podeAcessarDashboard: () => true, // Todos podem acessar dashboard
    podeAcessarMonitorBar: () => papel !== PapelUsuario.USER || verificarPrivilegio('gerenciar_usuarios'),
    podeAcessarAtendimentoBar: () => true, // Baseado em permissões específicas
    podeAcessarMonitorCozinha: () => true, // Baseado em permissões específicas
    podeAcessarGestaoCaixa: () => papel !== PapelUsuario.USER || verificarPrivilegio('gerenciar_usuarios'),
    podeAcessarClientes: () => true, // Baseado em permissões específicas
    podeAcessarFuncionarios: () => verificarPrivilegio('gerenciar_usuarios'),
    podeAcessarSocios: () => verificarPrivilegio('gerenciar_usuarios'),
    
    // Papel atual para verificações adicionais
    papel
  };
}

/**
 * Hook para verificações de operações CRUD
 */
export function useCrudPermissions() {
  const { podeExecutarOperacao, papel } = useHierarchicalAuth();

  return {
    // Operações com usuários
    podeVisualizarUsuario: (papelAlvo: PapelUsuario) => podeExecutarOperacao(papelAlvo, 'visualizar'),
    podeCriarUsuario: (papelAlvo: PapelUsuario) => podeExecutarOperacao(papelAlvo, 'criar'),
    podeEditarUsuario: (papelAlvo: PapelUsuario) => podeExecutarOperacao(papelAlvo, 'editar'),
    podeExcluirUsuario: (papelAlvo: PapelUsuario) => podeExecutarOperacao(papelAlvo, 'excluir'),
    
    // Verificações gerais
    temPrivilegiosAdministrativos: () => [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER].includes(papel!),
    ehAdministradorCompleto: () => [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN].includes(papel!),
    ehSuperAdmin: () => papel === PapelUsuario.SUPER_ADMIN,
    
    // Papel atual
    papel
  };
}