/**
 * Componente para proteger rotas baseado em permissões específicas
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, AlertCircle, Lock } from 'lucide-react';
import { 
  loadUserPermissions, 
  hasModuleAccess,
  UserPermissions, 
  ModulePermissions
} from '../../middleware/authMiddleware';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  module: keyof ModulePermissions;
  action?: keyof import('../../middleware/authMiddleware').ModulePermission;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  redirectTo?: string;
}

interface PermissionState {
  loading: boolean;
  hasPermission: boolean;
  permissions: UserPermissions | null;
  error: string | null;
}

// ============================================================================
// COMPONENTES DE FALLBACK
// ============================================================================

const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Verificando permissões...</p>
    </div>
  </div>
);

const DefaultAccessDeniedComponent: React.FC<{ module: string; action: string }> = ({ module, action }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <Lock className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
      <p className="text-gray-600 mb-4">
        Você não tem permissão para acessar este módulo.
      </p>
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700">
          <strong>Módulo:</strong> {module}
        </p>
        <p className="text-sm text-gray-700">
          <strong>Ação:</strong> {action}
        </p>
      </div>
      <p className="text-sm text-gray-500">
        Entre em contato com o administrador para solicitar as permissões necessárias.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Voltar
      </button>
    </div>
  </div>
);

const ErrorComponent: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
        <AlertCircle className="h-8 w-8 text-yellow-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro de Verificação</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = ({
  children,
  module,
  action = 'visualizar',
  fallback,
  loadingComponent,
  redirectTo = '/'
}) => {
  const [state, setState] = useState<PermissionState>({
    loading: true,
    hasPermission: false,
    permissions: null,
    error: null
  });

  useEffect(() => {
    checkPermissions();
  }, [module, action]);

  const checkPermissions = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const permissions = await loadUserPermissions();
      
      if (!permissions) {
        setState({
          loading: false,
          hasPermission: false,
          permissions: null,
          error: 'Usuário não autenticado'
        });
        return;
      }

      if (!permissions.isActive) {
        setState({
          loading: false,
          hasPermission: false,
          permissions,
          error: 'Usuário inativo'
        });
        return;
      }

      if (!permissions.hasSystemAccess) {
        setState({
          loading: false,
          hasPermission: false,
          permissions,
          error: 'Usuário sem acesso ao sistema'
        });
        return;
      }

      const hasPermission = hasModuleAccess(permissions, module, action);
      
      setState({
        loading: false,
        hasPermission,
        permissions,
        error: null
      });
    } catch (error) {
      setState({
        loading: false,
        hasPermission: false,
        permissions: null,
        error: error instanceof Error ? error.message : 'Erro de verificação de permissões'
      });
    }
  };

  // Mostrar loading
  if (state.loading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Mostrar erro de autenticação
  if (state.error) {
    if (state.error === 'Usuário não autenticado') {
      return <Navigate to="/login" replace />;
    }
    return <ErrorComponent error={state.error} />;
  }

  // Mostrar erro de autorização
  if (!state.hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Para alguns módulos importantes, redirecionar em vez de mostrar erro
    if (['dashboard'].includes(module)) {
      return <Navigate to={redirectTo} replace />;
    }

    return <DefaultAccessDeniedComponent module={module} action={action} />;
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
};

export default PermissionProtectedRoute;