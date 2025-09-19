import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, AuthContextType } from '../types/auth';
import { AUTH_CONFIG } from '../config/auth';
import { SUPABASE_CONFIG } from '../config/supabase';
import { Session } from '@supabase/supabase-js';
import AuthLoader from '../components/Auth/AuthLoader';
import { processAuthError, AuthRetryManager, AuthErrorLogger } from '../utils/authErrors';

// Estendendo o tipo para incluir funcionalidades adicionais
interface ExtendedAuthContextType extends AuthContextType {
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  isOffline: boolean;
  checkOnlineStatus: () => Promise<boolean>;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const retryManager = new AuthRetryManager();
  const errorLogger = AuthErrorLogger.getInstance();

  // Função para detectar se está offline
  const checkOnlineStatus = async () => {
    if (!isSupabaseConfigured) {
      setIsOffline(false); // Modo demo sempre online
      return true;
    }

    try {
      // Verificação simples de conectividade com timeout agressivo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout
      
      // Tentar uma requisição simples ao Supabase
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey
        }
      });
      
      clearTimeout(timeoutId);
      
      const isOnline = response.ok || response.status === 401; // 401 é esperado sem auth
      setIsOffline(!isOnline);
      return isOnline;
    } catch (error) {
      console.log('Verificação de conectividade falhou:', error);
      setIsOffline(true);
      return false;
    }
  };

  // Efeito #1: Lida APENAS com a sessão de autenticação do Supabase.
  // É rápido e não depende do banco de dados.
  useEffect(() => {
    // Função para limpar tokens corrompidos
    const clearCorruptedTokens = () => {
      try {
        // Limpar todos os tokens relacionados ao Supabase do localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        console.log('🧹 Tokens corrompidos limpos do localStorage');
      } catch (error) {
        console.warn('Erro ao limpar localStorage:', error);
      }
    };

    // Função de inicialização com timeout forçado
    const initializeAuth = async () => {
      // Se Supabase não está configurado, usar modo demo
      if (!isSupabaseConfigured) {
        console.log('🔧 Supabase não configurado, usando modo demo');
        setIsLoading(false);
        return;
      }

      // Timeout global para toda a inicialização
      const globalTimeout = setTimeout(() => {
        console.log('⏰ Timeout na inicialização, forçando modo offline');
        setIsOffline(true);
        setIsLoading(false);
      }, 5000); // 5 segundos máximo

      try {
        // Verificar conectividade rapidamente
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const connectivityCheck = fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
          method: 'HEAD',
          headers: { 'apikey': SUPABASE_CONFIG.anonKey },
          signal: controller.signal
        }).then(response => {
          clearTimeout(timeoutId);
          return response.ok || response.status === 401; // 401 é esperado
        }).catch(() => {
          clearTimeout(timeoutId);
          return false;
        });

        const isOnline = await connectivityCheck;
        
        if (!isOnline) {
          console.log('🔌 Sem conectividade, usando modo offline');
          setIsOffline(true);
          clearTimeout(globalTimeout);
          setIsLoading(false);
          return;
        }

        // Tentar obter sessão
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Erro ao verificar sessão:', error);
          
          // Se erro de token, limpar e tentar novamente
          if (error.message?.includes('refresh') || error.message?.includes('Invalid')) {
            console.log('🔄 Limpando tokens corrompidos...');
            clearCorruptedTokens();
            
            // Segunda tentativa
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            setSession(retrySession);
          } else {
            setSession(null);
          }
        } else {
          setSession(session);
        }

        clearTimeout(globalTimeout);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Erro na inicialização:', error);
        clearTimeout(globalTimeout);
        setIsOffline(true);
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Ouve por futuras mudanças na autenticação (login/logout).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, session ? 'Session ativa' : 'Sem sessão');
        
        // Se houver erro de token, limpar e tentar novamente
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🔄 Token refresh falhou, limpando tokens...');
          clearCorruptedTokens();
        }
        
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Efeito #2: Lida com a busca do perfil no banco de dados.
  // Roda sempre que a sessão mudar.
  useEffect(() => {
    // Se Supabase não está configurado, não tentar buscar perfil
    if (!isSupabaseConfigured) {
      return;
    }
    
    if (session) {
      console.log('AuthContext: Sessão encontrada, buscando perfil:', session.user.id);
      // Se há uma sessão, buscamos o perfil do usuário.
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile, error }) => {
          console.log('AuthContext: Resultado da busca de perfil:', { profile, error });
          if (error || !profile) {
            console.error('Perfil não encontrado ou erro na busca, deslogando.', error);
            // Se o perfil não existe, algo está errado. Forçamos o logout.
            supabase.auth.signOut();
          } else {
            // Perfil encontrado, montamos o objeto de usuário da aplicação.
            const appUser: User = {
              id: profile.id,
              name: profile.name || session.user.email || 'Usuário',
          email: session.user.email!,
          role: profile.role || 'employee',
          avatar: profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.name || session.user.email}`,
            };
            console.log('AuthContext: Usuário da aplicação criado:', appUser);
            setUser(appUser);
          }
        });
    } else {
      // Se não há sessão, não há usuário.
      setUser(null);
    }
  }, [session]); // Depende apenas da sessão.

  const login = async (email: string, password: string) => {
    // Se o Supabase não está configurado, simular login local para desenvolvimento
    if (!isSupabaseConfigured) {
      console.info('🔑 Usando autenticação mock para desenvolvimento');
      
      // Simular usuário demo usando configuração
      if (email === AUTH_CONFIG.DEMO_USER.email && password === 'demo123456') {
        const mockUser: User = {
          id: 'demo-user-id',
          name: AUTH_CONFIG.DEMO_USER.name,
          email: AUTH_CONFIG.DEMO_USER.email,
          role: AUTH_CONFIG.DEMO_USER.role,
          avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Demo'
        };
        setUser(mockUser);
        return { success: true, error: null };
      } else {
        return { success: false, error: `Credenciais inválidas. Use: ${AUTH_CONFIG.DEMO_USER.email} / demo123456` };
      }
    }
    
    // Login normal com Supabase configurado usando retry
    try {
      const result = await retryManager.executeWithRetry(
        async () => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          return { success: true, error: null };
        },
        (attempt, error) => {
          console.warn(`Tentativa de login ${attempt} falhou:`, error);
          errorLogger.logError(error, 'login_retry', email);
        }
      );
      
      return result;
    } catch (err) {
      const errorInfo = processAuthError(err);
      errorLogger.logError(err, 'login', email);
      
      return { 
        success: false, 
        error: errorInfo.userMessage 
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Cadastro não disponível no modo demonstração' };
    }

    try {
      const result = await retryManager.executeWithRetry(
        async () => {
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name }
            }
          });

          if (authError) throw authError;

          if (data.user) {
            // O perfil é criado automaticamente pelo trigger handle_new_user()
            // Aguardar um pouco para o trigger processar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('✅ Usuário registrado com sucesso. Perfil criado automaticamente pelo trigger.');
            return { success: true, error: null };
          }

          throw new Error('Erro desconhecido no cadastro');
        },
        (attempt, error) => {
          console.warn(`Tentativa de cadastro ${attempt} falhou:`, error);
          errorLogger.logError(error, 'register_retry', email);
        }
      );

      return result;
    } catch (err) {
      const errorInfo = processAuthError(err);
      errorLogger.logError(err, 'register', email);
      
      return { 
        success: false, 
        error: errorInfo.userMessage 
      };
    }
  };

  const loginAsDemo = async () => {
    return login(AUTH_CONFIG.DEMO_USER.email, 'demo123456');
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      // Logout local no modo mock
      setUser(null);
      return;
    }
    
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginAsDemo, logout, isLoading, isOffline, checkOnlineStatus }}>
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-sm z-50">
          ⚠️ <strong>Modo Desenvolvimento:</strong> Supabase não configurado. 
          Use: {AUTH_CONFIG.DEMO_USER.email} / demo123456
        </div>
      )}
      
      {isLoading ? (
        <AuthLoader message="Verificando sessão de usuário..." />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
