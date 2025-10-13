/**
 * Componente de Proteção de Permissões
 * 
 * Renderiza conteúdo condicionalmente baseado nas permissões do usuário.
 * Fornece proteção granular para componentes e funcionalidades.
 * 
 * @version 1.0.0
 */

import React, { ReactNode } from 'react';
import {
  BarRole,
  SystemModule,
  PermissionAction,
  ModulePermissions,
} from '../../types/permissions';

import { usePermissionCheck } from '../../hooks/usePermissions';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermissionGuardProps {
  /** Função do usuário atual */
  userRole: BarRole;
  
  /** Permissões customizadas (opcional) */
  customPermissions?: ModulePermissions;
  
  /** Módulo a ser verificado */
  module: SystemModule;
  
  /** Ação a ser verificada */
  action: PermissionAction;
  
  /** Conteúdo a ser renderizado se tiver permissão */
  children: ReactNode;
  
  /** Conteúdo alternativo se não tiver permissão */
  fallback?: ReactNode;
  
  /** Se deve renderizar null quando não tem permissão (padrão: true) */
  hideWhenDenied?: boolean;
  
  /** Callback executado quando acesso é negado */
  onAccessDenied?: (module: SystemModule, action: PermissionAction) => void;
  
  /** Callback executado quando acesso é permitido */
  onAccessGranted?: (module: SystemModule, action: PermissionAction) => void;
}

interface MultiplePermissionGuardProps {
  /** Função do usuário atual */
  userRole: BarRole;
  
  /** Permissões customizadas (opcional) */
  customPermissions?: ModulePermissions;
  
  /** Lista de verificações de permissão */
  permissions: Array<{
    module: SystemModule;
    action: PermissionAction;
    required?: boolean; // Se true, todas devem ser válidas
  }>;
  
  /** Modo de verificação: 'all' (todas) ou 'any' (qualquer uma) */
  mode?: 'all' | 'any';
  
  /** Conteúdo a ser renderizado se tiver permissão */
  children: ReactNode;
  
  /** Conteúdo alternativo se não tiver permissão */
  fallback?: ReactNode;
  
  /** Se deve renderizar null quando não tem permissão */
  hideWhenDenied?: boolean;
}

interface RoleGuardProps {
  /** Função do usuário atual */
  userRole: BarRole;
  
  /** Funções permitidas */
  allowedRoles: BarRole[];
  
  /** Conteúdo a ser renderizado se a função for permitida */
  children: ReactNode;
  
  /** Conteúdo alternativo se a função não for permitida */
  fallback?: ReactNode;
  
  /** Se deve renderizar null quando função não é permitida */
  hideWhenDenied?: boolean;
}

interface ManagementGuardProps {
  /** Função do usuário atual (gerenciador) */
  managerRole: BarRole;
  
  /** Função alvo a ser gerenciada */
  targetRole: BarRole;
  
  /** Conteúdo a ser renderizado se pode gerenciar */
  children: ReactNode;
  
  /** Conteúdo alternativo se não pode gerenciar */
  fallback?: ReactNode;
  
  /** Se deve renderizar null quando não pode gerenciar */
  hideWhenDenied?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL DE PROTEÇÃO
// ============================================================================

/**
 * Componente principal para proteção baseada em permissões
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  userRole,
  customPermissions,
  module,
  action,
  children,
  fallback = null,
  hideWhenDenied = true,
  onAccessDenied,
  onAccessGranted,
}) => {
  const { hasPermission } = usePermissionCheck(userRole, customPermissions);
  
  const hasAccess = hasPermission(module, action);
  
  // Executar callbacks
  React.useEffect(() => {
    if (hasAccess && onAccessGranted) {
      onAccessGranted(module, action);
    } else if (!hasAccess && onAccessDenied) {
      onAccessDenied(module, action);
    }
  }, [hasAccess, module, action, onAccessGranted, onAccessDenied]);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (hideWhenDenied) {
    return null;
  }
  
  return <>{fallback}</>;
};

// ============================================================================
// COMPONENTE PARA MÚLTIPLAS PERMISSÕES
// ============================================================================

/**
 * Componente para verificar múltiplas permissões
 */
export const MultiplePermissionGuard: React.FC<MultiplePermissionGuardProps> = ({
  userRole,
  customPermissions,
  permissions,
  mode = 'all',
  children,
  fallback = null,
  hideWhenDenied = true,
}) => {
  const { hasPermission } = usePermissionCheck(userRole, customPermissions);
  
  const hasAccess = React.useMemo(() => {
    const results = permissions.map(perm => hasPermission(perm.module, perm.action));
    
    if (mode === 'all') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }, [permissions, hasPermission, mode]);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (hideWhenDenied) {
    return null;
  }
  
  return <>{fallback}</>;
};

// ============================================================================
// COMPONENTE PARA PROTEÇÃO POR FUNÇÃO
// ============================================================================

/**
 * Componente para proteção baseada em função
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  userRole,
  allowedRoles,
  children,
  fallback = null,
  hideWhenDenied = true,
}) => {
  const hasAccess = allowedRoles.includes(userRole);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (hideWhenDenied) {
    return null;
  }
  
  return <>{fallback}</>;
};

// ============================================================================
// COMPONENTE PARA PROTEÇÃO DE GERENCIAMENTO
// ============================================================================

/**
 * Componente para proteção de capacidade de gerenciamento
 */
export const ManagementGuard: React.FC<ManagementGuardProps> = ({
  managerRole,
  targetRole,
  children,
  fallback = null,
  hideWhenDenied = true,
}) => {
  const { canManage } = usePermissionCheck(managerRole);
  
  const hasAccess = canManage(targetRole);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (hideWhenDenied) {
    return null;
  }
  
  return <>{fallback}</>;
};

// ============================================================================
// COMPONENTES DE CONVENIÊNCIA
// ============================================================================

/**
 * Componente para proteger visualização
 */
export const ViewGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="visualizar" />
);

/**
 * Componente para proteger criação
 */
export const CreateGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="criar" />
);

/**
 * Componente para proteger edição
 */
export const EditGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="editar" />
);

/**
 * Componente para proteger exclusão
 */
export const DeleteGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="excluir" />
);

/**
 * Componente para proteger administração
 */
export const AdminGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="administrar" />
);

/**
 * Componente para proteger acesso apenas de gerentes
 */
export const ManagerOnlyGuard: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={['gerente']} />
);

/**
 * Componente para proteger acesso de funcionários operacionais
 */
export const OperationalGuard: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={['atendente', 'garcom', 'cozinheiro', 'barman']} />
);

// ============================================================================
// HOOKS PARA COMPONENTES
// ============================================================================

/**
 * Hook para usar proteção de permissões em componentes funcionais
 */
export function usePermissionGuard(
  userRole: BarRole,
  module: SystemModule,
  action: PermissionAction,
  customPermissions?: ModulePermissions
) {
  const { hasPermission } = usePermissionCheck(userRole, customPermissions);
  
  return React.useMemo(() => ({
    hasAccess: hasPermission(module, action),
    guard: (children: ReactNode, fallback?: ReactNode) => 
      hasPermission(module, action) ? children : (fallback || null),
  }), [hasPermission, module, action]);
}

/**
 * Hook para usar proteção de função em componentes funcionais
 */
export function useRoleGuard(userRole: BarRole, allowedRoles: BarRole[]) {
  return React.useMemo(() => {
    const hasAccess = allowedRoles.includes(userRole);
    
    return {
      hasAccess,
      guard: (children: ReactNode, fallback?: ReactNode) => 
        hasAccess ? children : (fallback || null),
    };
  }, [userRole, allowedRoles]);
}

// ============================================================================
// COMPONENTE DE DEBUG (apenas em desenvolvimento)
// ============================================================================

interface PermissionDebugProps {
  userRole: BarRole;
  customPermissions?: ModulePermissions;
  showDetails?: boolean;
}

/**
 * Componente para debug de permissões (apenas desenvolvimento)
 */
export const PermissionDebug: React.FC<PermissionDebugProps> = ({
  userRole,
  customPermissions,
  showDetails = false,
}) => {
  const { hasPermission, canAccess, canManage } = usePermissionCheck(userRole, customPermissions);
  
  // Só renderizar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const modules: SystemModule[] = [
    'dashboard', 'monitor_bar', 'atendimento_bar', 'monitor_cozinha',
    'gestao_caixa', 'clientes', 'funcionarios', 'relatorios', 'configuracoes'
  ];
  
  const actions: PermissionAction[] = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];
  const roles: BarRole[] = ['atendente', 'garcom', 'cozinheiro', 'barman', 'gerente'];
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999,
    }}>
      <h4>Debug de Permissões</h4>
      <p><strong>Função:</strong> {userRole}</p>
      
      {showDetails && (
        <>
          <h5>Acesso a Módulos:</h5>
          {modules.map(module => (
            <div key={module}>
              <strong>{module}:</strong> {canAccess(module) ? '✅' : '❌'}
            </div>
          ))}
          
          <h5>Pode Gerenciar:</h5>
          {roles.map(role => (
            <div key={role}>
              <strong>{role}:</strong> {canManage(role) ? '✅' : '❌'}
            </div>
          ))}
        </>
      )}
    </div>
  );
};