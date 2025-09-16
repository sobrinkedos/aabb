import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContext';
import { ModuloSistema } from '../../types/multitenant';

interface ProtectedRouteProps {
  children: React.ReactNode;
  modulo?: ModuloSistema;
  acao?: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar';
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  modulo,
  acao = 'visualizar',
  requireAdmin = false
}) => {
  const { isAuthenticated, isLoading, user, verificarPermissao } = useMultitenantAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se usuário tem senha provisória
  if (user.senha_provisoria) {
    return <Navigate to="/alterar-senha" replace />;
  }

  // Verificar se usuário está ativo
  if (user.status !== 'ativo') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Conta Inativa</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sua conta está {user.status === 'inativo' ? 'inativa' : 'bloqueada'}. 
              Entre em contato com o administrador da empresa.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/logout'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se requer administrador
  if (requireAdmin && user.tipo_usuario !== 'administrador') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Restrito</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta página requer privilégios de administrador.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar permissão específica do módulo
  if (modulo && !verificarPermissao(modulo, acao)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Você não tem permissão para {acao} neste módulo ({modulo}).
            </p>
            <div className="mt-6 space-x-3">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se passou por todas as verificações, renderizar o componente
  return <>{children}</>;
};

// Hook para verificar permissões em componentes
export const usePermissions = () => {
  const { verificarPermissao, user } = useMultitenantAuth();

  const hasPermission = (modulo: ModuloSistema, acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'administrar' = 'visualizar') => {
    return verificarPermissao(modulo, acao);
  };

  const isAdmin = () => {
    return user?.tipo_usuario === 'administrador';
  };

  const canAccess = (modulo: ModuloSistema) => {
    return hasPermission(modulo, 'visualizar');
  };

  return {
    hasPermission,
    isAdmin,
    canAccess
  };
};