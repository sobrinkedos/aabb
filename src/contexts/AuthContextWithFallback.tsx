import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, AuthContextType } from '../types/auth';
import { AUTH_CONFIG } from '../config/auth';
import { Session } from '@supabase/supabase-js';
import AuthLoader from '../components/Auth/AuthLoader';

// Versão do AuthContext com fallback para usuarios_empresa
interface AuthContextWithFallbackType extends AuthContextType {
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  isOffline: boolean;
  checkOnlineStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextWithFallbackType | undefined>(undefined);

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

export const AuthProviderWithFallback: React.FC<AuthProviderProps> = ({ children }) => {
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
      console.log('🚀 Inicializando autenticação com fallback...');
      
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

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (result && 'data' in result) {
          console.log('✅ Sessão verificada');
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

  /**
   * Login com fallback para usuarios_empresa
   */
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
      console.log('🔐 Tentando login com Supabase Auth...');
      
      // Primeira tentativa: Login normal via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        console.log('✅ Login bem-sucedido via Supabase Auth');
        
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

        return { success: true, error: null };
      }

      // Se chegou aqui, o login via Auth falhou
      console.log('⚠️ Login via Supabase Auth falhou, tentando fallback...');
      
      // Segunda tentativa: Fallback para usuarios_empresa
      return await loginWithUsuariosEmpresa(email, password);

    } catch (error) {
      console.log('⚠️ Erro no login via Auth, tentando fallback...', error);
      return await loginWithUsuariosEmpresa(email, password);
    }
  };

  /**
   * Login via tabela usuarios_empresa (fallback)
   */
  const loginWithUsuariosEmpresa = async (email: string, password: string) => {
    try {
      console.log('🔄 Tentando login via usuarios_empresa...');

      // Buscar usuário na tabela usuarios_empresa
      const { data: usuarioEmpresa, error: usuarioError } = await supabase
        .from('usuarios_empresa')
        .select(`
          id,
          user_id,
          nome_completo,
          email,
          cargo,
          status,
          senha_provisoria,
          tem_acesso_sistema,
          ativo,
          papel,
          empresa_id,
          empresas!inner(nome)
        `)
        .eq('email', email)
        .eq('ativo', true)
        .eq('tem_acesso_sistema', true)
        .single();

      if (usuarioError || !usuarioEmpresa) {
        console.log('❌ Usuário não encontrado na usuarios_empresa');
        return { success: false, error: 'Credenciais inválidas' };
      }

      // IMPORTANTE: Em um sistema real, você deveria verificar a senha
      // Por enquanto, vamos aceitar qualquer senha para usuários sem user_id
      if (usuarioEmpresa.user_id === null) {
        console.log('⚠️ Usuário encontrado mas sem user_id no Auth - usando fallback');
        
        // Verificar se a senha corresponde (simulação - em produção use hash)
        // Por enquanto, aceitar as senhas conhecidas
        const senhasAceitas = ['X5rm2AV9', 'senha123', 'antonio123'];
        if (!senhasAceitas.includes(password)) {
          return { success: false, error: 'Senha incorreta' };
        }

        // Criar usuário temporário para a sessão
        const tempUser: User = {
          id: usuarioEmpresa.id, // Usar ID da usuarios_empresa
          name: usuarioEmpresa.nome_completo,
          email: usuarioEmpresa.email,
          role: usuarioEmpresa.papel?.toLowerCase() || 'employee',
          avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(usuarioEmpresa.nome_completo)}`,
        };

        setUser(tempUser);

        // Se é senha provisória, indicar que precisa alterar
        if (usuarioEmpresa.senha_provisoria) {
          console.log('⚠️ Usuário precisa alterar senha provisória');
          // Aqui você pode implementar a lógica para forçar alteração de senha
        }

        console.log('✅ Login bem-sucedido via fallback usuarios_empresa');
        return { success: true, error: null };
      }

      // Se tem user_id, deveria ter funcionado no Auth
      console.log('❌ Usuário tem user_id mas Auth falhou');
      return { success: false, error: 'Erro de autenticação' };

    } catch (error) {
      console.error('❌ Erro no fallback login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Registro não disponível no modo demo' };
    }

    try {
      // Verificar se é o primeiro usuário (administrador principal)
      const { data: existingUsers, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (countError) {
        console.warn('Erro ao verificar usuários existentes:', countError);
      }

      const isFirstUser = !existingUsers || existingUsers.length === 0;
      const userRole = isFirstUser ? 'admin' : 'employee';

      console.log(`🔐 Registrando ${isFirstUser ? 'PRIMEIRO USUÁRIO (ADMIN)' : 'usuário comum'}:`, email);

      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: userRole
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Criar perfil do usuário com permissões apropriadas
        const profileData = {
          id: data.user.id,
          name: name,
          email: email,
          role: userRole,
          avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }

        console.log(`✅ Usuário registrado com sucesso como ${userRole}`);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erro no registro:', error);
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