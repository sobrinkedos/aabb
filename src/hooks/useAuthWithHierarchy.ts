import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import { supabase } from '../lib/supabase';
import { PapelUsuario, UsuarioEmpresa, Empresa, PrivilegiosAdmin, PRIVILEGIOS_POR_PAPEL } from '../types/multitenant';
import { AdminService } from '../services/adminService';

export interface AuthWithHierarchyData {
  // Dados básicos do auth
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Dados específicos da hierarquia
  usuarioEmpresa: UsuarioEmpresa | null;
  empresa: Empresa | null;
  papel: PapelUsuario | null;
  privilegios: PrivilegiosAdmin;
  isPrimeiroUsuario: boolean;
  
  // Métodos de verificação
  verificarPrivilegio: (privilegio: keyof PrivilegiosAdmin) => boolean;
  podeGerenciarUsuario: (papelAlvo: PapelUsuario) => boolean;
  podeAcessarConfiguracao: (categoria: string) => boolean;
  
  // Ações
  recarregarDados: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuthWithHierarchy(): AuthWithHierarchyData {
  const { user, isLoading: authLoading, logout: authLogout } = useAuth();
  
  const [usuarioEmpresa, setUsuarioEmpresa] = useState<UsuarioEmpresa | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [papel, setPapel] = useState<PapelUsuario | null>(null);
  const [privilegios, setPrivilegios] = useState<PrivilegiosAdmin>(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
  const [isPrimeiroUsuario, setIsPrimeiroUsuario] = useState(false);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

  const carregarDadosHierarquia = useCallback(async () => {
    if (!user?.id) {
      setUsuarioEmpresa(null);
      setEmpresa(null);
      setPapel(null);
      setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
      setIsPrimeiroUsuario(false);
      return;
    }

    try {
      setIsLoadingHierarchy(true);

      // Carregar dados do usuário na empresa
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios_empresa')
        .select(`
          *,
          empresas (*)
        `)
        .eq('user_id', user.id)
        .single();

      if (usuarioError) {
        console.error('Erro ao carregar dados do usuário:', usuarioError);
        return;
      }

      if (usuarioData) {
        const userRole = usuarioData.papel as PapelUsuario;
        const isFirst = usuarioData.is_primeiro_usuario || false;

        setUsuarioEmpresa(usuarioData);
        setEmpresa(usuarioData.empresas);
        setPapel(userRole);
        setPrivilegios(PRIVILEGIOS_POR_PAPEL[userRole] || PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
        setIsPrimeiroUsuario(isFirst);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da hierarquia:', error);
    } finally {
      setIsLoadingHierarchy(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarDadosHierarquia();
  }, [carregarDadosHierarquia]);

  const verificarPrivilegio = useCallback((privilegio: keyof PrivilegiosAdmin): boolean => {
    return privilegios[privilegio] || false;
  }, [privilegios]);

  const podeGerenciarUsuario = useCallback((papelAlvo: PapelUsuario): boolean => {
    if (!papel) return false;

    const hierarquia = {
      [PapelUsuario.SUPER_ADMIN]: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.ADMIN]: [PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.MANAGER]: [PapelUsuario.USER],
      [PapelUsuario.USER]: []
    };

    return hierarquia[papel]?.includes(papelAlvo) || false;
  }, [papel]);

  const podeAcessarConfiguracao = useCallback((categoria: string): boolean => {
    if (!papel) return false;

    const acessoConfiguracoes = {
      geral: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
      seguranca: [PapelUsuario.SUPER_ADMIN],
      sistema: [PapelUsuario.SUPER_ADMIN],
      notificacoes: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
      integracao: [PapelUsuario.SUPER_ADMIN]
    };

    return acessoConfiguracoes[categoria as keyof typeof acessoConfiguracoes]?.includes(papel) || false;
  }, [papel]);

  const recarregarDados = useCallback(async () => {
    await carregarDadosHierarquia();
  }, [carregarDadosHierarquia]);

  const logout = useCallback(async () => {
    // Limpar dados locais
    setUsuarioEmpresa(null);
    setEmpresa(null);
    setPapel(null);
    setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
    setIsPrimeiroUsuario(false);
    
    // Fazer logout do auth
    await authLogout();
  }, [authLogout]);

  return {
    // Dados básicos do auth
    user,
    isLoading: authLoading || isLoadingHierarchy,
    isAuthenticated: !!user,
    
    // Dados específicos da hierarquia
    usuarioEmpresa,
    empresa,
    papel,
    privilegios,
    isPrimeiroUsuario,
    
    // Métodos de verificação
    verificarPrivilegio,
    podeGerenciarUsuario,
    podeAcessarConfiguracao,
    
    // Ações
    recarregarDados,
    logout
  };
}