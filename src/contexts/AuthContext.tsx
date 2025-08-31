import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    // Pega a sessão inicial para parar o carregamento o mais rápido possível.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false); // <-- PONTO CRÍTICO: resolve o carregamento infinito.
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
    if (session) {
      // Se há uma sessão, buscamos o perfil do usuário.
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile, error }) => {
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
            setUser(appUser);
          }
        });
    } else {
      // Se não há sessão, não há usuário.
      setUser(null);
    }
  }, [session]); // Depende apenas da sessão.

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message || null };
  };

  const loginAsDemo = async () => {
    return login('demo@clubmanager.com', 'demo123456');
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsDemo, logout, isLoading }}>
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
