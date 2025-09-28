import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, AuthContextType } from '../types/auth';
import { AUTH_CONFIG } from '../config/auth';
import { Session } from '@supabase/supabase-js';
import AuthLoader from '../components/Auth/AuthLoader';
import { mockAuth, MockUser } from '../services/mockAuth';
import { useEnvironmentContext } from './EnvironmentContext';

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
      
      // Timeout de segurança - força carregamento após 2 segundos
      const safetyTimeout = setTimeout(() => {
        console.log('⏰ Safety timeout - forçando carregamento');
        setIsLoading(false);
      }, 2000);

      try {
        if (!isSupabaseConfigured) {
          console.log('🔧 Modo demo ativo');
          clearTimeout(safetyTimeout);
          setIsLoading(false);
          return;
        }

        // Limpar tokens inválidos primeiro
        await supabase.auth.signOut();
        
        console.log('✅ Sessão limpa, pronto para login');
        clearTimeout(safetyTimeout);
        setIsLoading(false);
        
      } catch (error) {
        console.log('⚠️ Erro na inicialização, continuando...', error);
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Verifica se deve usar sistema mock
    const configured = await isSupabaseConfigured();
    const shouldUseMock = !configured;

    if (shouldUseMock) {
      console.log('🎭 Usando sistema de autenticação mock');
      
      try {
        const { user: mockUser, error } = await mockAuth.signInWithPassword(email, password);
        
        if (error) {
          return { success: false, error: error.message };
        }

        if (mockUser) {
          const appUser: User = {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            department: mockUser.department,
            avatar: mockUser.avatar
          };
          setUser(appUser);
          return { success: true, error: null };
        }
      } catch (error) {
        return { success: false, error: 'Erro no sistema de autenticação mock' };
      }
    }

    // Se chegou aqui, deve usar Supabase real
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
      console.log(`🔐 Registrando usuário:`, email);

      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        console.error('Erro no signup:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log(`✅ Usuário registrado com sucesso`);
        
        // Aguardar um pouco para garantir que o perfil foi criado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Criar empresa e dados complementares
        try {
          console.log('🔄 Iniciando criação da empresa...');
          await createCompanyForUser(data.user.id, name, email);
          console.log(`✅ Empresa criada com sucesso`);
        } catch (companyError) {
          console.error('❌ Erro ao criar empresa:', companyError);
          console.error('Stack trace:', companyError);
          // Não falhar o registro por causa da empresa, mas mostrar o erro
          alert(`Usuário criado, mas houve erro ao criar empresa: ${companyError.message || companyError}`);
        }
        
        return { success: true, error: null };
      }

      return { success: false, error: 'Erro desconhecido no registro' };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para criar empresa após o registro do usuário
  const createCompanyForUser = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🏢 Criando empresa para o usuário...', { userId, userName, userEmail });

      // Gerar CNPJ único
      const timestamp = Date.now();
      const cnpjUnico = String(timestamp).slice(-14).padStart(14, '0');
      console.log('📋 CNPJ gerado:', cnpjUnico);

      // Criar empresa
      console.log('🏭 Inserindo empresa na tabela...');
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert([{
          nome: `Empresa de ${userName}`,
          cnpj: cnpjUnico,
          email_admin: userEmail,
          telefone: '',
          plano: 'premium',
          status: 'ativo'
        }])
        .select()
        .single();

      if (empresaError) {
        console.error('❌ Erro ao criar empresa:', empresaError);
        throw new Error(`Erro ao criar empresa: ${empresaError.message}`);
      }

      console.log('✅ Empresa criada:', empresa);

      // Criar registro na tabela usuarios_empresa
      console.log('👤 Criando registro na tabela usuarios_empresa...');
      const { data: usuarioEmpresa, error: usuarioEmpresaError } = await supabase
        .from('usuarios_empresa')
        .insert([{
          user_id: userId,
          empresa_id: empresa.id,
          nome_completo: userName,
          email: userEmail,
          tipo_usuario: 'administrador',
          papel: 'SUPER_ADMIN',
          is_primeiro_usuario: true,
          ativo: true,
          tem_acesso_sistema: true
        }])
        .select()
        .single();

      if (usuarioEmpresaError) {
        console.error('❌ Erro ao criar usuário empresa:', usuarioEmpresaError);
        throw new Error(`Erro ao criar usuário empresa: ${usuarioEmpresaError.message}`);
      }

      console.log('✅ Usuário empresa criado:', usuarioEmpresa);

      // Criar permissões básicas
      console.log('🔐 Criando permissões básicas...');
      const permissoes = [
        { modulo: 'dashboard', permissoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true } },
        { modulo: 'configuracoes', permissoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true } }
      ];

      const { error: permissoesError } = await supabase
        .from('permissoes_usuario')
        .insert(
          permissoes.map(p => ({
            usuario_empresa_id: usuarioEmpresa.id,
            modulo: p.modulo,
            permissoes: p.permissoes
          }))
        );

      if (permissoesError) {
        console.error('⚠️ Erro ao criar permissões:', permissoesError);
        // Não falhar por causa das permissões
      } else {
        console.log('✅ Permissões criadas com sucesso');
      }

      console.log('✅ Empresa e dados complementares criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      throw error;
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
    const configured = await isSupabaseConfigured();
    const shouldUseMock = !configured;

    if (shouldUseMock) {
      console.log('🎭 Logout do sistema mock');
      await mockAuth.signOut();
    } else {
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