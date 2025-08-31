import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  loginAsDemo: () => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = async (session: Session) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        if (error) console.error('Error fetching profile:', error.message);
        if (!profile) console.warn(`Profile not found for user ${session.user.id}. Logging out of app state.`);
        setUser(null);
        return;
      }

      const appUser: User = {
        id: profile.id,
        name: profile.name || session.user.email || 'Usuário',
        email: session.user.email!,
        role: profile.role as User['role'],
        avatar: profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.name || session.user.email}`,
      };
      setUser(appUser);
    } catch (e) {
      console.error("Critical error in fetchAndSetUser:", e);
      setUser(null);
    }
  };
  
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          await fetchAndSetUser(session);
        }
      } catch (error) {
        console.error("Error during initial auth check:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        if (session) {
          await fetchAndSetUser(session);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message || null };
  };

  const loginAsDemo = async () => {
    return login('demo@clubmanager.com', 'demo123456');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Carregando Sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, loginAsDemo, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
