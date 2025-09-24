/**
 * Componentes de Renderização Baseada em Permissões
 * 
 * Renderiza componentes UI baseado nas permissões do usuário
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { ModulePermissions, ModulePermission } from '../../middleware/authMiddleware';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermissionBasedRenderProps {
  children: React.ReactNode;
  module: keyof ModulePermissions;
  action?: keyof ModulePermission;
  fallback?: React.ReactNode;
  inverse?: boolean; // Renderiza quando NÃO tem permissão
}

interface RoleBasedRenderProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  inverse?: boolean;
}

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ============================================================================
// COMPONENTE PRINCIPAL DE PERMISSÃO
// ============================================================================

export const PermissionBasedRender: React.FC<PermissionBasedRenderProps> = ({
  children,
  module,
  action = 'visualizar',
  fallback = null,
  inverse = false
}) => {
  const { hasPermission } = useAuth();
  
  const userHasPermission = hasPermission(module, action);
  const shouldRender = inverse ? !userHasPermission : userHasPermission;
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

// ============================================================================
// COMPONENTE BASEADO EM FUNÇÃO
// ============================================================================

export const RoleBasedRender: React.FC<RoleBasedRenderProps> = ({
  children,
  allowedRoles,
  fallback = null,
  inverse = false
}) => {
  const { permissions } = useAuth();
  
  if (!permissions) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }
  
  const hasAllowedRole = allowedRoles.includes(permissions.role);
  const shouldRender = inverse ? !hasAllowedRole : hasAllowedRole;
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

// ============================================================================
// COMPONENTE APENAS PARA ADMINISTRADORES
// ============================================================================

export const AdminOnly: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null
}) => {
  const { isAdmin } = useAuth();
  
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
};

// ============================================================================
// COMPONENTE PARA GERENTES DE FUNCIONÁRIOS
// ============================================================================

export const EmployeeManagerOnly: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null
}) => {
  const { canManageEmployees } = useAuth();
  
  return canManageEmployees() ? <>{children}</> : <>{fallback}</>;
};

// ============================================================================
// COMPONENTES ESPECÍFICOS POR MÓDULO
// ============================================================================

export const DashboardAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="dashboard" action={action}>
    {children}
  </PermissionBasedRender>
);

export const BarMonitorAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="monitor_bar" action={action}>
    {children}
  </PermissionBasedRender>
);

export const ServiceAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="atendimento_bar" action={action}>
    {children}
  </PermissionBasedRender>
);

export const KitchenAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="monitor_cozinha" action={action}>
    {children}
  </PermissionBasedRender>
);

export const CashierAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="gestao_caixa" action={action}>
    {children}
  </PermissionBasedRender>
);

export const CustomersAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="clientes" action={action}>
    {children}
  </PermissionBasedRender>
);

export const EmployeesAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="funcionarios" action={action}>
    {children}
  </PermissionBasedRender>
);

export const ReportsAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="relatorios" action={action}>
    {children}
  </PermissionBasedRender>
);

export const SettingsAccess: React.FC<{ children: React.ReactNode; action?: keyof ModulePermission }> = ({
  children,
  action = 'visualizar'
}) => (
  <PermissionBasedRender module="configuracoes" action={action}>
    {children}
  </PermissionBasedRender>
);

// ============================================================================
// HOOK PARA VERIFICAÇÕES CONDICIONAIS
// ============================================================================

export const usePermissionCheck = () => {
  const { hasPermission, isAdmin, canManageEmployees, permissions } = useAuth();
  
  return {
    // Verificações básicas
    hasPermission,
    isAdmin,
    canManageEmployees,
    
    // Verificações específicas de módulo
    canViewDashboard: () => hasPermission('dashboard', 'visualizar'),
    canManageDashboard: () => hasPermission('dashboard', 'administrar'),
    
    canViewBar: () => hasPermission('monitor_bar', 'visualizar'),
    canManageBar: () => hasPermission('monitor_bar', 'administrar'),
    
    canViewService: () => hasPermission('atendimento_bar', 'visualizar'),
    canCreateOrders: () => hasPermission('atendimento_bar', 'criar'),
    canEditOrders: () => hasPermission('atendimento_bar', 'editar'),
    
    canViewKitchen: () => hasPermission('monitor_cozinha', 'visualizar'),
    canManageKitchen: () => hasPermission('monitor_cozinha', 'administrar'),
    
    canViewCashier: () => hasPermission('gestao_caixa', 'visualizar'),
    canManageCashier: () => hasPermission('gestao_caixa', 'administrar'),
    
    canViewCustomers: () => hasPermission('clientes', 'visualizar'),
    canCreateCustomers: () => hasPermission('clientes', 'criar'),
    canEditCustomers: () => hasPermission('clientes', 'editar'),
    canDeleteCustomers: () => hasPermission('clientes', 'excluir'),
    
    canViewEmployees: () => hasPermission('funcionarios', 'visualizar'),
    canCreateEmployees: () => hasPermission('funcionarios', 'criar'),
    canEditEmployees: () => hasPermission('funcionarios', 'editar'),
    canDeleteEmployees: () => hasPermission('funcionarios', 'excluir'),
    
    canViewReports: () => hasPermission('relatorios', 'visualizar'),
    canCreateReports: () => hasPermission('relatorios', 'criar'),
    
    canViewSettings: () => hasPermission('configuracoes', 'visualizar'),
    canManageSettings: () => hasPermission('configuracoes', 'administrar'),
    
    // Informações do usuário
    getUserRole: () => permissions?.role || 'unknown',
    getUserId: () => permissions?.userId,
    getEmpresaId: () => permissions?.empresaId,
    isUserActive: () => permissions?.isActive || false,
    hasSystemAccess: () => permissions?.hasSystemAccess || false
  };
};

// ============================================================================
// COMPONENTE DE DEBUG (APENAS DESENVOLVIMENTO)
// ============================================================================

export const PermissionDebugger: React.FC = () => {
  const { permissions, user } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug - Permissões</h4>
      <div className="space-y-1">
        <div>Usuário: {user?.email || 'N/A'}</div>
        <div>Função: {permissions?.role || 'N/A'}</div>
        <div>Ativo: {permissions?.isActive ? 'Sim' : 'Não'}</div>
        <div>Acesso Sistema: {permissions?.hasSystemAccess ? 'Sim' : 'Não'}</div>
        <div className="mt-2">
          <details>
            <summary className="cursor-pointer">Permissões Detalhadas</summary>
            <pre className="mt-1 text-xs overflow-auto max-h-32">
              {JSON.stringify(permissions?.permissions, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default PermissionBasedRender;