import React from 'react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { hasPermission, hasRole, isAdmin } from '../../utils/auth';
import { Role } from '../../config/auth';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  roles?: Role[];
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Componente para proteger elementos baseado em permissões do usuário
 * 
 * @param children - Conteúdo a ser renderizado se o usuário tiver permissão
 * @param permission - Permissão específica a ser verificada
 * @param roles - Roles necessárias para acessar o conteúdo
 * @param requireAdmin - Se true, requer que o usuário seja administrador
 * @param fallback - Conteúdo alternativo a ser mostrado se não tiver permissão
 * @param showFallback - Se true, mostra o fallback; se false, não renderiza nada
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  roles,
  requireAdmin = false,
  fallback = null,
  showFallback = false
}) => {
  const { user } = useAuth();

  // Se não há usuário logado, não mostrar nada
  if (!user) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Se requer admin e usuário não é admin
  if (requireAdmin && !isAdmin(user)) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Verificar permissão específica
  if (permission && !hasPermission(user, permission)) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Verificar roles específicas
  if (roles && !hasRole(user, roles)) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Hook para verificar permissões de forma programática
 */
export const usePermissionCheck = () => {
  const { user } = useAuth();

  const checkPermission = (permission: string): boolean => {
    return hasPermission(user, permission);
  };

  const checkRole = (roles: Role[]): boolean => {
    return hasRole(user, roles);
  };

  const checkIsAdmin = (): boolean => {
    return isAdmin(user);
  };

  return {
    hasPermission: checkPermission,
    hasRole: checkRole,
    isAdmin: checkIsAdmin,
    user
  };
};

/**
 * Componente para botões com permissões
 */
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  roles?: Role[];
  requireAdmin?: boolean;
  children: React.ReactNode;
  fallbackText?: string;
  showDisabled?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  roles,
  requireAdmin = false,
  children,
  fallbackText,
  showDisabled = false,
  className = '',
  ...props
}) => {
  const { hasPermission: checkPermission, hasRole: checkRole, isAdmin: checkIsAdmin } = usePermissionCheck();

  let hasAccess = true;

  if (requireAdmin && !checkIsAdmin()) {
    hasAccess = false;
  }

  if (permission && !checkPermission(permission)) {
    hasAccess = false;
  }

  if (roles && !checkRole(roles)) {
    hasAccess = false;
  }

  if (!hasAccess && !showDisabled) {
    return null;
  }

  if (!hasAccess && showDisabled) {
    return (
      <button
        {...props}
        disabled={true}
        className={`${className} opacity-50 cursor-not-allowed`}
        title={fallbackText || 'Você não tem permissão para esta ação'}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...props}
      className={className}
    >
      {children}
    </button>
  );
};