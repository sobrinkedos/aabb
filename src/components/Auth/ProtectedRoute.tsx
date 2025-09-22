/**
 * Componente de Proteção de Rotas
 * 
 * Protege rotas baseado em autenticação e permissões
 */

import React, { useEffect, useState } from 'react';
import { Shield, AlertCircle, Lock } from 'lucide-react';
import { 
  requireAuth, 
  requireModulePermission, 
  UserPermissions, 
  ModulePermissions, 
  ModulePermission 
} from '../../middleware/authMiddleware';

// ============================================================================
// INTERFACES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireModule?: keyof ModulePermissions;
  requireAction?: keyof ModulePermission;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  authorized: boolean;
  permissions: UserPermissions | null;
  error: string | null;
}

// ============================================================================
// COMPONENTES DE FALLBACK
// ============================================================================

const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Verificando permissões...</p>
    </div>
  </div>
);

const UnauthorizedComponent: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => window.location.href = '/login'}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Fazer Login
      </button>
    </div>
  </div>
);

const UnauthenticatedComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-yellow-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Necessário</h2>
      <p className="text-gray-600 mb-4">
        Você precisa estar logado para acessar esta página.
      </p>
      <button
        onClick={() => window.location.href = '/login'}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Fazer Login
      </button>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireModule,
  requireAction = 'visualizar',
  fallback,
  loadingComponent
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    authorized: false,
    permissions: null,
    error: null
  });

  useEffect(() => {
    checkPermissions();
  }, [requireModule, requireAction]);

  const checkPermissions = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      let result;
      
      if (requireModule) {
        // Verificar permissão específica de módulo
        result = await requireModulePermission(requireModule, requireAction);
      } else {
        // Verificar apenas autenticação
        result = await requireAuth();
      }

      if (result.success) {
        setAuthState({
          loading: false,
          authenticated: true,
          authorized: true,
          permissions: result.permissions!,
          error: null
        });
      } else {
        setAuthState({
          loading: false,
          authenticated: false,
          authorized: false,
          permissions: null,
          error: result.error || 'Erro de autenticação'
        });
      }
    } catch (error) {
      setAuthState({
        loading: false,
        authenticated: false,
        authorized: false,
        permissions: null,
        error: error instanceof Error ? error.message : 'Erro inesperado'
      });
    }
  };

  // Mostrar loading
  if (authState.loading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Mostrar erro de autenticação
  if (!authState.authenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <UnauthenticatedComponent />;
  }

  // Mostrar erro de autorização
  if (!authState.authorized) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <UnauthorizedComponent error={authState.error || 'Sem permissão'} />;
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
};

// ============================================================================
// HOOK PARA USAR PERMISSÕES
// ============================================================================

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    authorized: false,
    permissions: null,
    error: null
  });

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const result = await requireAuth();
      
      if (result.success) {
        setAuthState({
          loading: false,
          authenticated: true,
          authorized: true,
          permissions: result.permissions!,
          error: null
        });
      } else {
        setAuthState({
          loading: false,
          authenticated: false,
          authorized: false,
          permissions: null,
          error: result.error || 'Não autenticado'
        });
      }
    } catch (error) {
      setAuthState({
        loading: false,
        authenticated: false,
        authorized: false,
        permissions: null,
        error: error instanceof Error ? error.message : 'Erro inesperado'
      });
    }
  };

  const refresh = () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    loadAuth();
  };

  return {
    ...authState,
    refresh
  };
};

// ============================================================================
// COMPONENTE DE PROTEÇÃO POR PERMISSÃO
// ============================================================================

interface PermissionGuardProps {
  children: React.ReactNode;
  module: keyof ModulePermissions;
  action?: keyof ModulePermission;
  fallback?: React.ReactNode;
  permissions?: UserPermissions | null;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action = 'visualizar',
  fallback,
  permissions
}) => {
  const { permissions: authPermissions } = useAuth();
  const userPermissions = permissions || authPermissions;

  if (!userPermissions) {
    return fallback || null;
  }

  const hasPermission = userPermissions.permissions[module]?.[action];

  if (!hasPermission) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;