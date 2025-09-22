/**
 * Contexto de Autenticação
 * 
 * Gerencia o estado global de autenticação e permissões
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  loadUserPermissions, 
  UserPermissions, 
  logout as authLogout,
  validateSession
} from '../middleware/authMiddleware';
import { auditLogger } from '../utils/auditLogger';

// ============================================================================
// INTERFACES
// ============================================================================

interface AuthContextType {
  // Estado
  user: any | null;
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  
  // Ações
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  
  // Utilitários
  hasPermission: (module: string, action?: string) => boolean;
  isAdmin: () => boolean;
  canManageEmployees: () => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar autenticação
  useEffect(() => {
    initializeAuth();
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadPermissions(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setPermissions(null);
          setError(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        setError('Erro ao verificar sessão');
        return;
      }

      if (session?.user) {
        setUser(session.user);
        await loadPermissions(session.user);
      }
    } catch (err) {
      console.error('Erro na inicialização da auth:', err);
      setError(err instanceof Error ? err.message : 'Erro de inicialização');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (currentUser?: any) => {
    try {
      const userToLoad = currentUser || user;
      if (!userToLoad) return;

      const userPermissions = await loadUserPermissions();
      setPermissions(userPermissions);
      
      if (!userPermissions) {
        setError('Usuário sem permissões configuradas');
      } else if (!userPermissions.isActive) {
        setError('Usuário inativo');
      } else if (!userPermissions.hasSystemAccess) {
        setError('Usuário sem acesso ao sistema');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setError('Erro ao carregar permissões do usuário');
    }
  };

  // ============================================================================
  // AÇÕES DE AUTENTICAÇÃO
  // ============================================================================

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        const errorMessage = getLoginErrorMessage(loginError.message);
        setError(errorMessage);
        
        // Log da tentativa de login falhada
        await auditLogger.logLoginAttempt(email, false, errorMessage);
        
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        setUser(data.user);
        await loadPermissions(data.user);
        
        // Verificar se o usuário tem acesso
        const userPermissions = await loadUserPermissions();
        if (!userPermissions) {
          await authLogout();
          const error = 'Usuário não encontrado no sistema';
          setError(error);
          return { success: false, error };
        }
        
        if (!userPermissions.isActive) {
          await authLogout();
          const error = 'Usuário inativo';
          setError(error);
          return { success: false, error };
        }
        
        if (!userPermissions.hasSystemAccess) {
          await authLogout();
          const error = 'Usuário sem acesso ao sistema';
          setError(error);
          
          // Log da tentativa de login sem acesso
          await auditLogger.logLoginAttempt(email, false, error);
          
          return { success: false, error };
        }

        // Log do login bem-sucedido
        await auditLogger.logLoginAttempt(email, true);
        
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido no login' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authLogout();
      setUser(null);
      setPermissions(null);
      setError(null);
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async (): Promise<void> => {
    if (user) {
      await loadPermissions();
    }
  };

  // ============================================================================
  // UTILITÁRIOS DE PERMISSÃO
  // ============================================================================

  const hasPermission = (module: string, action: string = 'visualizar'): boolean => {
    if (!permissions || !permissions.isActive || !permissions.hasSystemAccess) {
      return false;
    }

    const modulePermission = permissions.permissions[module as keyof typeof permissions.permissions];
    if (!modulePermission) {
      return false;
    }

    return modulePermission[action as keyof typeof modulePermission] || false;
  };

  const isAdmin = (): boolean => {
    if (!permissions) return false;
    
    return permissions.role === 'gerente' || 
           hasPermission('configuracoes', 'administrar') || 
           hasPermission('funcionarios', 'administrar');
  };

  const canManageEmployees = (): boolean => {
    if (!permissions) return false;
    
    return permissions.role === 'gerente' || 
           hasPermission('funcionarios', 'administrar') ||
           hasPermission('funcionarios', 'editar');
  };

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  const getLoginErrorMessage = (error: string): string => {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado',
      'Too many requests': 'Muitas tentativas. Tente novamente mais tarde',
      'User not found': 'Usuário não encontrado',
      'Invalid email': 'Email inválido'
    };

    return errorMessages[error] || 'Erro no login. Tente novamente';
  };

  // ============================================================================
  // VALOR DO CONTEXTO
  // ============================================================================

  const contextValue: AuthContextType = {
    // Estado
    user,
    permissions,
    loading,
    error,
    
    // Ações
    login,
    logout,
    refreshPermissions,
    
    // Utilitários
    hasPermission,
    isAdmin,
    canManageEmployees
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

// ============================================================================
// COMPONENTE DE PROTEÇÃO SIMPLES
// ============================================================================

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, fallback }) => {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || error) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Você precisa estar logado para acessar esta página'}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthContext;