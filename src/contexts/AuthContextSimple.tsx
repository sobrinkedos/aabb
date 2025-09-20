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
          // Não falhar o registro por causa do perfil
        }

        // Se for o primeiro usuário (admin), criar empresa padrão e configurações
        if (isFirstUser) {
          await createDefaultCompanyAndPermissions(data.user.id, name, email);
        }

        console.log(`✅ Usuário registrado com sucesso como ${userRole}`);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para criar empresa padrão e configurações para o primeiro usuário
  const createDefaultCompanyAndPermissions = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🏢 Criando empresa padrão para administrador principal...');

      // Criar empresa padrão
      const empresaData = {
        id: `empresa-${userId}`,
        nome: 'Minha Empresa',
        razao_social: 'Minha Empresa Ltda',
        cnpj: '00.000.000/0001-00',
        email: userEmail,
        telefone: '(11) 99999-9999',
        endereco: 'Endereço da empresa',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '00000-000',
        plano: 'premium',
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: empresaError } = await supabase
        .from('empresas')
        .insert([empresaData]);

      if (empresaError) {
        console.error('Erro ao criar empresa:', empresaError);
      }

      // Criar vínculo usuário-empresa com permissões de admin
      const usuarioEmpresaData = {
        user_id: userId,
        empresa_id: empresaData.id,
        nome: userName,
        email: userEmail,
        cargo: 'Administrador',
        departamento: 'Administração',
        is_admin: true,
        is_active: true,
        permissoes: {
          admin: {
            usuarios: { ler: true, criar: true, editar: true, excluir: true },
            configuracoes: { ler: true, criar: true, editar: true, excluir: true },
            relatorios: { ler: true, criar: true, editar: true, excluir: true },
            integracao: { ler: true, criar: true, editar: true, excluir: true },
            backup: { ler: true, criar: true, editar: true, excluir: true },
            auditoria: { ler: true, criar: true, editar: true, excluir: true }
          },
          bar: { ler: true, criar: true, editar: true, excluir: true },
          cozinha: { ler: true, criar: true, editar: true, excluir: true },
          caixa: { ler: true, criar: true, editar: true, excluir: true },
          estoque: { ler: true, criar: true, editar: true, excluir: true },
          clientes: { ler: true, criar: true, editar: true, excluir: true },
          funcionarios: { ler: true, criar: true, editar: true, excluir: true }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: vinculoError } = await supabase
        .from('usuarios_empresa')
        .insert([usuarioEmpresaData]);

      if (vinculoError) {
        console.error('Erro ao criar vínculo usuário-empresa:', vinculoError);
      }

      // Criar configurações padrão da empresa
      const configuracoesPadrao = [
        {
          empresa_id: empresaData.id,
          categoria: 'geral',
          chave: 'nome_sistema',
          valor: 'ClubManager Pro',
          descricao: 'Nome do sistema',
          tipo: 'string'
        },
        {
          empresa_id: empresaData.id,
          categoria: 'geral',
          chave: 'timezone',
          valor: 'America/Sao_Paulo',
          descricao: 'Fuso horário',
          tipo: 'string'
        },
        {
          empresa_id: empresaData.id,
          categoria: 'seguranca',
          chave: 'senha_min_length',
          valor: '6',
          descricao: 'Tamanho mínimo da senha',
          tipo: 'number'
        },
        {
          empresa_id: empresaData.id,
          categoria: 'backup',
          chave: 'backup_automatico',
          valor: 'true',
          descricao: 'Backup automático habilitado',
          tipo: 'boolean'
        }
      ];

      const { error: configError } = await supabase
        .from('configuracoes_empresa')
        .insert(configuracoesPadrao);

      if (configError) {
        console.error('Erro ao criar configurações padrão:', configError);
      }

      console.log('✅ Empresa padrão e configurações criadas com sucesso!');

    } catch (error) {
      console.error('Erro ao criar empresa padrão:', error);
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