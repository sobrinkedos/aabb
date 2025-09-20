import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { PapelUsuario, PrivilegiosAdmin, UsuarioEmpresa, Empresa } from '../types/multitenant';
import { PrivilegeUtils } from '../utils/privilegeUtils';
import { AdminService } from '../services/adminService';

interface HierarchicalAuthContextType {
  // Estado básico
  user: User | null;
  usuarioEmpresa: UsuarioEmpresa | null;
  empresa: Empresa | null;
  papel: PapelUsuario | null;
  privilegios: PrivilegiosAdmin;
  isPrimeiroUsuario: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Métodos de verificação
  verificarPrivilegio: (privilegio: keyof PrivilegiosAdmin) => boolean;
  podeGerenciarUsuario: (papelAlvo: PapelUsuario) => boolean;
  podeAcessarConfiguracao: (categoria: string) => boolean;
  podeExecutarOperacao: (papelAlvo: PapelUsuario, operacao: 'criar' | 'editar' | 'excluir' | 'visualizar') => boolean;
  
  // Métodos utilitários
  getDescricaoPapel: (papel: PapelUsuario) => string;
  getCorPapel: (papel: PapelUsuario) => string;
  getPapeisGerenciaveis: () => PapelUsuario[];
  getCategoriasAcessiveis: () => string[];
  
  // Ações
  recarregarDados: () => Promise<void>;
  logout: () => Promise<void>;
}

const HierarchicalAuthContext = createContext<HierarchicalAuthContextType | undefined>(undefined);

export function useHierarchicalAuth(): HierarchicalAuthContextType {
  const context = useContext(HierarchicalAuthContext);
  if (context === undefined) {
    throw new Error('useHierarchicalAuth deve ser usado dentro de um HierarchicalAuthProvider');
  }
  return context;
}

interface HierarchicalAuthProviderProps {
  children: ReactNode;
}

export function HierarchicalAuthProvider({ children }: HierarchicalAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [usuarioEmpresa, setUsuarioEmpresa] = useState<UsuarioEmpresa | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [papel, setPapel] = useState<PapelUsuario | null>(null);
  const [privilegios, setPrivilegios] = useState<PrivilegiosAdmin>(
    PrivilegeUtils.getPrivilegiosPorPapel(PapelUsuario.USER)
  );
  const [isPrimeiroUsuario, setIsPrimeiroUsuario] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carregar dados do usuário autenticado
  const carregarDadosUsuario = async () => {
    try {
      setIsLoading(true);

      // Verificar se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Não há sessão, limpar dados
        setUser(null);
        setUsuarioEmpresa(null);
        setEmpresa(null);
        setPapel(null);
        setPrivilegios(PrivilegeUtils.getPrivilegiosPorPapel(PapelUsuario.USER));
        setIsPrimeiroUsuario(false);
        setIsAuthenticated(false);
        return;
      }

      // Carregar perfil básico do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const basicUser: User = {
          id: profile.id,
          name: profile.name || session.user.email || 'Usuário',
          email: session.user.email!,
          role: profile.role || 'employee',
          avatar: profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.name || session.user.email}`
        };
        setUser(basicUser);
      }

      // Carregar dados da empresa do usuário
      const dadosUsuarioEmpresa = await AdminService.obterDadosUsuarioAtual();
      
      if (dadosUsuarioEmpresa) {
        setUsuarioEmpresa(dadosUsuarioEmpresa);
        setPapel(dadosUsuarioEmpresa.papel as PapelUsuario);
        setIsPrimeiroUsuario(dadosUsuarioEmpresa.is_primeiro_usuario || false);
        
        // Definir privilégios baseado no papel
        const userPrivileges = PrivilegeUtils.getPrivilegiosPorPapel(dadosUsuarioEmpresa.papel as PapelUsuario);
        setPrivilegios(userPrivileges);

        // Carregar dados da empresa
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', dadosUsuarioEmpresa.empresa_id)
          .single();

        if (empresaData) {
          setEmpresa(empresaData);
        }

        setIsAuthenticated(true);
      } else {
        // Usuário autenticado mas sem dados de empresa
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para carregar dados quando a sessão mudar
  useEffect(() => {
    carregarDadosUsuario();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          carregarDadosUsuario();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Métodos de verificação
  const verificarPrivilegio = (privilegio: keyof PrivilegiosAdmin): boolean => {
    return privilegios[privilegio] || false;
  };

  const podeGerenciarUsuario = (papelAlvo: PapelUsuario): boolean => {
    if (!papel) return false;
    return PrivilegeUtils.podeGerenciarPapel(papel, papelAlvo);
  };

  const podeAcessarConfiguracao = (categoria: string): boolean => {
    if (!papel) return false;
    return PrivilegeUtils.podeAcessarConfiguracao(papel, categoria);
  };

  const podeExecutarOperacao = (
    papelAlvo: PapelUsuario, 
    operacao: 'criar' | 'editar' | 'excluir' | 'visualizar'
  ): boolean => {
    if (!papel) return false;
    const resultado = PrivilegeUtils.validarOperacao(papel, papelAlvo, operacao);
    return resultado.permitido;
  };

  // Métodos utilitários
  const getDescricaoPapel = (papel: PapelUsuario): string => {
    return PrivilegeUtils.getDescricaoPapel(papel);
  };

  const getCorPapel = (papel: PapelUsuario): string => {
    return PrivilegeUtils.getCorPapel(papel);
  };

  const getPapeisGerenciaveis = (): PapelUsuario[] => {
    if (!papel) return [];
    return PrivilegeUtils.getPapeisGerenciaveis(papel);
  };

  const getCategoriasAcessiveis = (): string[] => {
    if (!papel) return [];
    return PrivilegeUtils.getCategoriasAcessiveis(papel);
  };

  const recarregarDados = async (): Promise<void> => {
    await carregarDadosUsuario();
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // Os dados serão limpos automaticamente pelo listener onAuthStateChange
  };

  const value: HierarchicalAuthContextType = {
    // Estado
    user,
    usuarioEmpresa,
    empresa,
    papel,
    privilegios,
    isPrimeiroUsuario,
    isLoading,
    isAuthenticated,
    
    // Métodos de verificação
    verificarPrivilegio,
    podeGerenciarUsuario,
    podeAcessarConfiguracao,
    podeExecutarOperacao,
    
    // Métodos utilitários
    getDescricaoPapel,
    getCorPapel,
    getPapeisGerenciaveis,
    getCategoriasAcessiveis,
    
    // Ações
    recarregarDados,
    logout
  };

  return (
    <HierarchicalAuthContext.Provider value={value}>
      {children}
    </HierarchicalAuthContext.Provider>
  );
}