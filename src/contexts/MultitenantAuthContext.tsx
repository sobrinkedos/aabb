import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  Empresa,
  UsuarioEmpresa,
  PermissaoModulo,
  ModuloSistema,
  AuthContextMultitenant,
  RegistroEmpresaData,
  ApiResponse
} from '../types/multitenant';

const MultitenantAuthContext = createContext<AuthContextMultitenant | undefined>(undefined);

export const useMultitenantAuth = () => {
  const context = useContext(MultitenantAuthContext);
  if (context === undefined) {
    throw new Error('useMultitenantAuth must be used within a MultitenantAuthProvider');
  }
  return context;
};

interface MultitenantAuthProviderProps {
  children: ReactNode;
}

export const MultitenantAuthProvider: React.FC<MultitenantAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UsuarioEmpresa | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [permissoes, setPermissoes] = useState<Record<ModuloSistema, PermissaoModulo>>({} as Record<ModuloSistema, PermissaoModulo>);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função para carregar dados do usuário e empresa
  const carregarDadosUsuario = async (supabaseUser: SupabaseUser) => {
    try {
      // Buscar dados do usuário na empresa
      const { data: usuarioEmpresa, error: userError } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário da empresa:', userError);
        return;
      }

      // Buscar dados da empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', usuarioEmpresa.empresa_id)
        .single();

      if (empresaError) {
        console.error('Erro ao buscar empresa:', empresaError);
        return;
      }

      setUser(usuarioEmpresa);
      setEmpresa(empresaData);
      setIsAuthenticated(true);

      // Carregar permissões
      await carregarPermissoes(usuarioEmpresa.id);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  // Função para carregar permissões do usuário
  const carregarPermissoes = async (usuarioEmpresaId: string) => {
    try {
      const { data: permissoesData, error } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', usuarioEmpresaId);

      if (error) {
        console.error('Erro ao carregar permissões:', error);
        return;
      }

      // Converter array de permissões em objeto indexado por módulo
      const permissoesMap: Record<ModuloSistema, PermissaoModulo> = {} as Record<ModuloSistema, PermissaoModulo>;
      
      // Inicializar todas as permissões como false
      Object.values(ModuloSistema).forEach(modulo => {
        permissoesMap[modulo] = {
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          administrar: false
        };
      });

      // Aplicar permissões específicas
      permissoesData?.forEach(permissao => {
        permissoesMap[permissao.modulo as ModuloSistema] = permissao.permissoes;
      });

      setPermissoes(permissoesMap);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  };

  // Função de login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await carregarDadosUsuario(data.user);
        
        // Registrar log de login
        await registrarLog('login', 'auth', { email });
        
        // Atualizar último login
        await supabase
          .from('usuarios_empresa')
          .update({ ultimo_login: new Date().toISOString() })
          .eq('user_id', data.user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      // Registrar log de logout
      if (user) {
        await registrarLog('logout', 'auth');
      }

      await supabase.auth.signOut();
      setUser(null);
      setEmpresa(null);
      setPermissoes({} as Record<ModuloSistema, PermissaoModulo>);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Função para registrar nova empresa
  const registrarEmpresa = async (data: RegistroEmpresaData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Validar se senhas coincidem
      if (data.senha !== data.confirmar_senha) {
        return { success: false, error: 'As senhas não coincidem' };
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email_admin,
        password: data.senha,
        options: {
          data: {
            nome_completo: data.nome_admin
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Erro ao criar usuário' };
      }

      // Criar empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          nome: data.nome_empresa,
          cnpj: data.cnpj,
          email_admin: data.email_admin,
          telefone: data.telefone_empresa,
          endereco: data.endereco,
          status: 'ativo',
          plano: 'basico'
        })
        .select()
        .single();

      if (empresaError) {
        // Se falhou ao criar empresa, remover usuário criado
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: empresaError.message };
      }

      // Criar usuário da empresa como administrador
      const { error: userEmpresaError } = await supabase
        .from('usuarios_empresa')
        .insert({
          user_id: authData.user.id,
          empresa_id: empresaData.id,
          nome_completo: data.nome_admin,
          email: data.email_admin,
          telefone: data.telefone_admin,
          tipo_usuario: 'administrador',
          status: 'ativo',
          senha_provisoria: false
        });

      if (userEmpresaError) {
        return { success: false, error: userEmpresaError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar empresa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar permissão específica
  const verificarPermissao = (modulo: ModuloSistema, acao: keyof PermissaoModulo): boolean => {
    if (!user || !permissoes[modulo]) {
      return false;
    }

    // Administradores têm acesso total
    if (user.tipo_usuario === 'administrador') {
      return true;
    }

    return permissoes[modulo][acao] === true;
  };

  // Função para atualizar permissões
  const atualizarPermissoes = async (): Promise<void> => {
    if (user) {
      await carregarPermissoes(user.id);
    }
  };

  // Função para registrar logs de auditoria
  const registrarLog = async (acao: string, recurso?: string, detalhes?: Record<string, any>) => {
    if (!empresa || !user) return;

    try {
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresa.id,
        p_usuario_id: user.user_id,
        p_acao: acao,
        p_recurso: recurso,
        p_detalhes: detalhes
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  // Effect para monitorar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      
      if (session?.user) {
        await carregarDadosUsuario(session.user);
      } else {
        setUser(null);
        setEmpresa(null);
        setPermissoes({} as Record<ModuloSistema, PermissaoModulo>);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextMultitenant = {
    user,
    empresa,
    permissoes,
    isLoading,
    isAuthenticated,
    login,
    logout,
    registrarEmpresa,
    verificarPermissao,
    atualizarPermissoes
  };

  return (
    <MultitenantAuthContext.Provider value={value}>
      {children}
    </MultitenantAuthContext.Provider>
  );
};