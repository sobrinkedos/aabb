import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, AuthContextType } from '../types/auth';
import { AUTH_CONFIG } from '../config/auth';
import { Session } from '@supabase/supabase-js';
import AuthLoader from '../components/Auth/AuthLoader';

// Versão simplificada do AuthContext para resolver problemas de carregamento
interface SimpleAuthContextType extends AuthContextType {
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  isOffline: boolean;
  checkOnlineStatus: () => Promise<boolean>;
}

const AuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

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
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Função simplificada de verificação online
  const checkOnlineStatus = async () => {
    if (!isSupabaseConfigured) {
      setIsOffline(false);
      return true;
    }

    try {
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      setIsOffline(false);
      return true;
    } catch {
      setIsOffline(true);
      return false;
    }
  };

  // Inicialização super simples
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Inicializando autenticação simples...');
      
      // Timeout de segurança - força carregamento após 3 segundos
      const safetyTimeout = setTimeout(() => {
        console.log('⏰ Safety timeout - forçando carregamento');
        setIsLoading(false);
      }, 3000);

      try {
        if (!isSupabaseConfigured) {
          console.log('🔧 Modo demo ativo');
          clearTimeout(safetyTimeout);
          setIsLoading(false);
          return;
        }

        // Tentar verificar sessão com timeout curto
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (result && 'data' in result) {
          console.log('✅ Sessão verificada');
          // Se há sessão, não precisamos fazer mais nada agora
        }
        
        clearTimeout(safetyTimeout);
        setIsLoading(false);
        
      } catch (error) {
        console.log('⚠️ Erro na verificação de sessão, continuando...', error);
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Modo demo
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
        return { success: false, error: 'Credenciais inválidas para modo demo' };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const appUser: User = {
            id: profile.id,
            name: profile.name || data.user.email || 'Usuário',
            email: data.user.email!,
            role: profile.role || 'employee',
            avatar: profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.name}`,
          };
          setUser(appUser);
        }
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Registro não disponível no modo demo' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const loginAsDemo = async () => {
    const mockUser: User = {
      id: 'demo-user-id',
      name: AUTH_CONFIG.DEMO_USER.name,
      email: AUTH_CONFIG.DEMO_USER.email,
      role: AUTH_CONFIG.DEMO_USER.role,
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Demo'
    };
    setUser(mockUser);
    return { success: true, error: null };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      loginAsDemo, 
      logout, 
      isLoading, 
      isOffline, 
      checkOnlineStatus 
    }}>
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-sm z-50">
          ⚠️ <strong>Modo Desenvolvimento:</strong> Supabase não configurado. 
          Use: {AUTH_CONFIG.DEMO_USER.email} / demo123456
        </div>
      )}
      
      {isLoading ? (
        <AuthLoader message="Inicializando sistema..." />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};