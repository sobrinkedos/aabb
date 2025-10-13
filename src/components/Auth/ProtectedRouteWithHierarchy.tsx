import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PapelUsuario, PrivilegiosAdmin } from '../../types/multitenant';
import { usePrivileges } from '../../contexts/PrivilegeContext';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface ProtectedRouteWithHierarchyProps {
  children: React.ReactNode;
  papel?: PapelUsuario | PapelUsuario[];
  privilegio?: keyof PrivilegiosAdmin;
  categoria?: string; // Para configurações
  fallbackPath?: string;
}

export function ProtectedRouteWithHierarchy({
  children,
  papel,
  privilegio,
  categoria,
  fallbackPath = '/dashboard'
}: ProtectedRouteWithHierarchyProps) {
  const { 
    papel: userRole, 
    verificarPrivilegio, 
    podeAcessarConfiguracao, 
    isLoading 
  } = usePrivileges();
  const location = useLocation();

  // Mostrar loading enquanto verifica dados
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar papel específico
  if (papel) {
    const papeisPermitidos = Array.isArray(papel) ? papel : [papel];
    const temPapel = papeisPermitidos.includes(userRole);
    
    if (!temPapel) {
      return (
        <AccessDeniedPage 
          type="role"
          userRole={userRole}
          requiredRoles={papeisPermitidos}
          fallbackPath={fallbackPath}
        />
      );
    }
  }

  // Verificar privilégio específico
  if (privilegio) {
    const temPrivilegio = verificarPrivilegio(privilegio);
    
    if (!temPrivilegio) {
      return (
        <AccessDeniedPage 
          type="privilege"
          privilege={privilegio}
          fallbackPath={fallbackPath}
        />
      );
    }
  }

  // Verificar acesso a categoria de configuração
  if (categoria) {
    const podeAcessar = podeAcessarConfiguracao(categoria);
    
    if (!podeAcessar) {
      return (
        <AccessDeniedPage 
          type="configuration"
          category={categoria}
          fallbackPath={fallbackPath}
        />
      );
    }
  }

  // Se passou por todas as verificações, renderizar o componente
  return <>{children}</>;
}

interface AccessDeniedPageProps {
  type: 'role' | 'privilege' | 'configuration';
  userRole?: PapelUsuario;
  requiredRoles?: PapelUsuario[];
  privilege?: keyof PrivilegiosAdmin;
  category?: string;
  fallbackPath: string;
}

function AccessDeniedPage({ 
  type, 
  userRole, 
  requiredRoles, 
  privilege, 
  category, 
  fallbackPath 
}: AccessDeniedPageProps) {
  const getIcon = () => {
    switch (type) {
      case 'role':
        return <Shield className="h-12 w-12 text-orange-500" />;
      case 'privilege':
        return <Lock className="h-12 w-12 text-red-500" />;
      case 'configuration':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      default:
        return <Shield className="h-12 w-12 text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'role':
        return 'Papel Insuficiente';
      case 'privilege':
        return 'Privilégio Necessário';
      case 'configuration':
        return 'Configuração Restrita';
      default:
        return 'Acesso Negado';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'role':
        return `Seu papel atual (${userRole}) não tem acesso a esta funcionalidade. Papéis necessários: ${requiredRoles?.join(', ')}.`;
      case 'privilege':
        return `Esta funcionalidade requer o privilégio "${privilege}" que você não possui.`;
      case 'configuration':
        return `Acesso à categoria "${category}" é restrito ao seu nível de usuário.`;
      default:
        return 'Você não tem permissão para acessar este recurso.';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'role':
        return 'bg-orange-50 border-orange-200';
      case 'privilege':
        return 'bg-red-50 border-red-200';
      case 'configuration':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className={`bg-white shadow-lg rounded-lg border-2 ${getBgColor()} p-8`}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center mb-4">
              {getIcon()}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getTitle()}
            </h3>
            
            <p className="text-sm text-gray-600 mb-6">
              {getMessage()}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
              
              <button
                onClick={() => window.location.href = fallbackPath}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir para Dashboard
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Se você acredita que deveria ter acesso, entre em contato com o administrador da empresa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}