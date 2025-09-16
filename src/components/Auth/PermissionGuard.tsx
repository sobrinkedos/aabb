import React from 'react';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContext';
import { ModuloSistema } from '../../types/multitenant';

interface PermissionGuardProps {
  children: React.ReactNode;
  modulo: ModuloSistema;
  acao?: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar';
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Componente para proteger elementos baseado em permissões do usuário
 * 
 * @param children - Conteúdo a ser renderizado se o usuário tiver permissão
 * @param modulo - Módulo do sistema a ser verificado
 * @param acao - Ação específica a ser verificada (padrão: 'visualizar')
 * @param requireAdmin - Se true, requer que o usuário seja administrador
 * @param fallback - Conteúdo alternativo a ser mostrado se não tiver permissão
 * @param showFallback - Se true, mostra o fallback; se false, não renderiza nada
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  modulo,
  acao = 'visualizar',
  requireAdmin = false,
  fallback = null,
  showFallback = false
}) => {
  const { user, verificarPermissao } = useMultitenantAuth();

  // Se não há usuário logado, não mostrar nada
  if (!user) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Se requer admin e usuário não é admin
  if (requireAdmin && user.tipo_usuario !== 'administrador') {
    return showFallback ? <>{fallback}</> : null;
  }

  // Verificar permissão específica
  const hasPermission = verificarPermissao(modulo, acao);
  
  if (!hasPermission) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Hook para verificar permissões de forma programática
 */
export const usePermissionCheck = () => {
  const { user, verificarPermissao } = useMultitenantAuth();

  const hasPermission = (
    modulo: ModuloSistema, 
    acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar' = 'visualizar'
  ): boolean => {
    if (!user) return false;
    return verificarPermissao(modulo, acao);
  };

  const isAdmin = (): boolean => {
    return user?.tipo_usuario === 'administrador';
  };

  const canAccess = (modulo: ModuloSistema): boolean => {
    return hasPermission(modulo, 'visualizar');
  };

  const canCreate = (modulo: ModuloSistema): boolean => {
    return hasPermission(modulo, 'criar');
  };

  const canEdit = (modulo: ModuloSistema): boolean => {
    return hasPermission(modulo, 'editar');
  };

  const canDelete = (modulo: ModuloSistema): boolean => {
    return hasPermission(modulo, 'excluir');
  };

  const canAdminister = (modulo: ModuloSistema): boolean => {
    return hasPermission(modulo, 'administrar');
  };

  return {
    hasPermission,
    isAdmin,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    canAdminister,
    user
  };
};

/**
 * Componente para mostrar diferentes conteúdos baseado no nível de permissão
 */
interface ConditionalRenderProps {
  admin?: React.ReactNode;
  canEdit?: React.ReactNode;
  canView?: React.ReactNode;
  fallback?: React.ReactNode;
  modulo: ModuloSistema;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  admin,
  canEdit,
  canView,
  fallback,
  modulo
}) => {
  const { isAdmin, canEdit: hasEditPermission, canAccess } = usePermissionCheck();

  // Prioridade: Admin > Edit > View > Fallback
  if (admin && isAdmin()) {
    return <>{admin}</>;
  }

  if (canEdit && hasEditPermission(modulo)) {
    return <>{canEdit}</>;
  }

  if (canView && canAccess(modulo)) {
    return <>{canView}</>;
  }

  return <>{fallback}</>;
};

/**
 * Componente para botões com permissões
 */
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  modulo: ModuloSistema;
  acao: 'criar' | 'editar' | 'excluir' | 'administrar';
  requireAdmin?: boolean;
  children: React.ReactNode;
  fallbackText?: string;
  showDisabled?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  modulo,
  acao,
  requireAdmin = false,
  children,
  fallbackText,
  showDisabled = false,
  className = '',
  ...props
}) => {
  const { hasPermission, isAdmin } = usePermissionCheck();

  const hasAccess = hasPermission(modulo, acao) && (!requireAdmin || isAdmin());

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

/**
 * Componente para links com permissões
 */
interface PermissionLinkProps {
  modulo: ModuloSistema;
  acao?: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar';
  requireAdmin?: boolean;
  children: React.ReactNode;
  href: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  modulo,
  acao = 'visualizar',
  requireAdmin = false,
  children,
  href,
  className = '',
  fallback = null
}) => {
  const { hasPermission, isAdmin } = usePermissionCheck();

  const hasAccess = hasPermission(modulo, acao) && (!requireAdmin || isAdmin());

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
};

/**
 * HOC para proteger componentes inteiros
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  modulo: ModuloSistema,
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar' = 'visualizar',
  requireAdmin: boolean = false
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard 
        modulo={modulo} 
        acao={acao} 
        requireAdmin={requireAdmin}
        fallback={
          <div className="p-4 text-center text-gray-500">
            <p>Você não tem permissão para acessar este conteúdo.</p>
          </div>
        }
        showFallback={true}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Componente para mostrar indicador de permissão
 */
interface PermissionIndicatorProps {
  modulo: ModuloSistema;
  acao?: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar';
  showText?: boolean;
  className?: string;
}

export const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({
  modulo,
  acao = 'visualizar',
  showText = false,
  className = ''
}) => {
  const { hasPermission } = usePermissionCheck();
  const hasAccess = hasPermission(modulo, acao);

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        hasAccess ? 'bg-green-400' : 'bg-red-400'
      }`}></div>
      {showText && (
        <span className={`ml-2 text-xs ${
          hasAccess ? 'text-green-600' : 'text-red-600'
        }`}>
          {hasAccess ? 'Permitido' : 'Negado'}
        </span>
      )}
    </div>
  );
};