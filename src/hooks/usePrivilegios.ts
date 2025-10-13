import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import { PapelUsuario, PrivilegiosAdmin, PRIVILEGIOS_POR_PAPEL } from '../types/multitenant';
import { supabase } from '../lib/supabase';

export interface UsePrivilegiosReturn {
  privilegios: PrivilegiosAdmin;
  papel: PapelUsuario | null;
  isPrimeiroUsuario: boolean;
  isLoading: boolean;
  verificarPrivilegio: (privilegio: keyof PrivilegiosAdmin) => boolean;
  podeGerenciarUsuario: (papelAlvo: PapelUsuario) => boolean;
  podeAcessarConfiguracao: (categoria: string) => boolean;
  recarregarPrivilegios: () => Promise<void>;
}

export function usePrivilegios(): UsePrivilegiosReturn {
  const { user } = useAuth();
  const [privilegios, setPrivilegios] = useState<PrivilegiosAdmin>(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
  const [papel, setPapel] = useState<PapelUsuario | null>(null);
  const [isPrimeiroUsuario, setIsPrimeiroUsuario] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const carregarPrivilegios = useCallback(async () => {
    if (!user?.id) {
      setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
      setPapel(null);
      setIsPrimeiroUsuario(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Buscar dados do usuário na empresa
      const { data: usuarioEmpresa, error } = await supabase
        .from('usuarios_empresa')
        .select('papel, is_primeiro_usuario')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar privilégios:', error);
        setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
        setPapel(PapelUsuario.USER);
        setIsPrimeiroUsuario(false);
        return;
      }

      const userRole = usuarioEmpresa.papel as PapelUsuario;
      const isFirst = usuarioEmpresa.is_primeiro_usuario || false;

      setPapel(userRole);
      setIsPrimeiroUsuario(isFirst);
      setPrivilegios(PRIVILEGIOS_POR_PAPEL[userRole] || PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);

    } catch (error) {
      console.error('Erro ao carregar privilégios:', error);
      setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
      setPapel(PapelUsuario.USER);
      setIsPrimeiroUsuario(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarPrivilegios();
  }, [carregarPrivilegios]);

  const verificarPrivilegio = useCallback((privilegio: keyof PrivilegiosAdmin): boolean => {
    return privilegios[privilegio] || false;
  }, [privilegios]);

  const podeGerenciarUsuario = useCallback((papelAlvo: PapelUsuario): boolean => {
    if (!papel) return false;

    // Matriz de permissões para gerenciar usuários
    const permissoes = {
      [PapelUsuario.SUPER_ADMIN]: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.ADMIN]: [PapelUsuario.MANAGER, PapelUsuario.USER],
      [PapelUsuario.MANAGER]: [PapelUsuario.USER],
      [PapelUsuario.USER]: []
    };

    return permissoes[papel]?.includes(papelAlvo) || false;
  }, [papel]);

  const podeAcessarConfiguracao = useCallback((categoria: string): boolean => {
    if (!papel) return false;

    // Mapeamento de acesso por categoria
    const acessoConfiguracoes = {
      geral: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
      seguranca: [PapelUsuario.SUPER_ADMIN],
      sistema: [PapelUsuario.SUPER_ADMIN],
      notificacoes: [PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN],
      integracao: [PapelUsuario.SUPER_ADMIN]
    };

    return acessoConfiguracoes[categoria as keyof typeof acessoConfiguracoes]?.includes(papel) || false;
  }, [papel]);

  const recarregarPrivilegios = useCallback(async () => {
    await carregarPrivilegios();
  }, [carregarPrivilegios]);

  return {
    privilegios,
    papel,
    isPrimeiroUsuario,
    isLoading,
    verificarPrivilegio,
    podeGerenciarUsuario,
    podeAcessarConfiguracao,
    recarregarPrivilegios
  };
}