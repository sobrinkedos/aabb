import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AdminNavigation } from './AdminNavigation';
import { PapelUsuario } from '../../types/multitenant';
import { AccessDenied } from '../Auth/AccessDenied';

interface AdminLayoutProps {
  requiredRole?: PapelUsuario | PapelUsuario[];
  requiredPrivilege?: keyof import('../../types/multitenant').PrivilegiosAdmin;
}

export function AdminLayout({ requiredRole, requiredPrivilege }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, papel, verificarPrivilegio } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se tem pelo menos privilégios básicos de administração
  const hasBasicAdminAccess = 
    verificarPrivilegio('gerenciar_usuarios') ||
    verificarPrivilegio('configuracoes_empresa') ||
    verificarPrivilegio('configuracoes_seguranca') ||
    verificarPrivilegio('configuracoes_sistema') ||
    verificarPrivilegio('relatorios_avancados') ||
    verificarPrivilegio('auditoria_completa');

  if (!hasBasicAdminAccess) {
    return (
      <AccessDenied 
        reason="insufficient_privilege"
        message="Você não tem privilégios administrativos para acessar esta área."
      />
    );
  }

  // Verificar papel específico se requerido
  if (requiredRole && papel) {
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.includes(papel)
      : papel === requiredRole;

    if (!hasRequiredRole) {
      return (
        <AccessDenied 
          reason="insufficient_role"
          requiredRole={Array.isArray(requiredRole) ? requiredRole[0] : requiredRole}
          currentRole={papel}
        />
      );
    }
  }

  // Verificar privilégio específico se requerido
  if (requiredPrivilege && !verificarPrivilegio(requiredPrivilege)) {
    return (
      <AccessDenied 
        reason="insufficient_privilege"
        message={`Esta funcionalidade requer o privilégio "${requiredPrivilege}".`}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar de Navegação */}
      <AdminNavigation />
      
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Administração
              </h1>
              <p className="text-sm text-gray-600">
                Gerencie sua empresa e usuários
              </p>
            </div>
            
            {/* Indicador de Papel */}
            {papel && (
              <div className="flex items-center space-x-2">
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${papel === PapelUsuario.SUPER_ADMIN ? 'bg-red-100 text-red-800' : ''}
                  ${papel === PapelUsuario.ADMIN ? 'bg-orange-100 text-orange-800' : ''}
                  ${papel === PapelUsuario.MANAGER ? 'bg-blue-100 text-blue-800' : ''}
                  ${papel === PapelUsuario.USER ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {papel === PapelUsuario.SUPER_ADMIN && 'Super Administrador'}
                  {papel === PapelUsuario.ADMIN && 'Administrador'}
                  {papel === PapelUsuario.MANAGER && 'Gerente'}
                  {papel === PapelUsuario.USER && 'Usuário'}
                </span>
              </div>
            )}
          </div>
        </header>
        
        {/* Conteúdo da Página */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Layouts específicos para diferentes níveis de acesso
export function SuperAdminLayout() {
  return <AdminLayout requiredRole={PapelUsuario.SUPER_ADMIN} />;
}

export function AdminOnlyLayout() {
  return <AdminLayout requiredRole={[PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN]} />;
}

export function ManagerAndAboveLayout() {
  return <AdminLayout requiredRole={[PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER]} />;
}

// Layouts específicos por privilégio
export function UserManagementLayout() {
  return <AdminLayout requiredPrivilege="gerenciar_usuarios" />;
}

export function SecurityLayout() {
  return <AdminLayout requiredPrivilege="configuracoes_seguranca" />;
}

export function SystemLayout() {
  return <AdminLayout requiredPrivilege="configuracoes_sistema" />;
}

export function ReportsLayout() {
  return <AdminLayout requiredPrivilege="relatorios_avancados" />;
}

export function AuditLayout() {
  return <AdminLayout requiredPrivilege="auditoria_completa" />;
}