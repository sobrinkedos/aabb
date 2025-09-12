import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  loginAsDemo: () => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  isLoading: boolean; // Apenas para o carregamento inicial da sessão
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Efeito #1: Lida APENAS com a sessão de autenticação do Supabase.
  // É rápido e não depende do banco de dados.
  useEffect(() => {
    // Se Supabase não está configurado, pular verificação de sessão
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    
    // Pega a sessão inicial para parar o carregamento o mais rápido possível.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false); // <-- PONTO CRÍTICO: resolve o carregamento infinito.
    }).catch((error) => {
      console.warn('Erro ao verificar sessão, usando modo mock:', error);
      setIsLoading(false);
    });

    // Ouve por futuras mudanças na autenticação (login/logout).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
              role: profile.role as User['role'],
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
      
      // Simular usuário demo
      if (email === 'demo@clubmanager.com' && password === 'demo123456') {
        const mockUser: User = {
          id: 'demo-user-id',
          name: 'Usuário Demonstração',
          email: 'demo@clubmanager.com',
          role: 'admin',
          avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Demo'
        };
        setUser(mockUser);
        return { success: true, error: null };
      } else {
        return { success: false, error: 'Credenciais inválidas. Use: demo@clubmanager.com / demo123456' };
      }
    }
    
    // Login normal com Supabase configurado
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { success: !error, error: error?.message || null };
    } catch (err) {
      console.error('Erro de conexão com Supabase:', err);
      return { success: false, error: 'Erro de conexão. Verifique a configuração do Supabase.' };
    }
  };

  const loginAsDemo = async () => {
    return login('demo@clubmanager.com', 'demo123456');
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
    <AuthContext.Provider value={{ user, login, loginAsDemo, logout, isLoading }}>
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-sm z-50">
          ⚠️ <strong>Modo Desenvolvimento:</strong> Supabase não configurado. 
          Use: demo@clubmanager.com / demo123456
        </div>
      )}
      
      {isLoading ? (
         <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-white font-semibold">Carregando Sessão...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
