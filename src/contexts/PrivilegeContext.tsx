import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { PapelUsuario, PrivilegiosAdmin, PRIVILEGIOS_POR_PAPEL } from '../types/multitenant';
import { AdminService } from '../services/adminService';
import { PrivilegeUtils } from '../utils/privilegeUtils';
import { usePermissoesCache } from '../hooks/usePermissoesCache';

interface PrivilegeContextType {
  // Estado
  privilegios: PrivilegiosAdmin;
  papel: PapelUsuario | null;
  isPrimeiroUsuario: boolean;
  isLoading: boolean;
  
  // Métodos de verificação
  verificarPrivilegio: (privilegio: keyof PrivilegiosAdmin) => boolean;
  podeGerenciarUsuario: (papelAlvo: PapelUsuario) => boolean;
  podeAcessarConfiguracao: (categoria: string) => boolean;
  podeExecutarOperacao: (papelAlvo: PapelUsuario, operacao: 'criar' | 'editar' | 'excluir' | 'visualizar') => boolean;
  
  // Métodos utilitários
  getDescricaoPapel: (papel: PapelUsuario) => string;
  getCorPapel: (papel: PapelUsuario) => string;
  getIconePapel: (papel: PapelUsuario) => string;
  getPapeisGerenciaveis: () => PapelUsuario[];
  getCategoriasAcessiveis: () => string[];
  
  // Ações
  recarregarPrivilegios: () => Promise<void>;
}

const PrivilegeContext = createContext<PrivilegeContextType | undefined>(undefined);

export function PrivilegeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [privilegios, setPrivilegios] = useState<PrivilegiosAdmin>(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
  const [papel, setPapel] = useState<PapelUsuario | null>(null);
  const [isPrimeiroUsuario, setIsPrimeiroUsuario] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const carregarPrivilegios = async () => {
    if (!isAuthenticated || !user) {
      setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
      setPapel(null);
      setIsPrimeiroUsuario(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Carregar dados do usuário
      const dadosUsuario = await AdminService.obterDadosUsuarioAtual();
      
      if (!dadosUsuario) {
        setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
        setPapel(PapelUsuario.USER);
        setIsPrimeiroUsuario(false);
        return;
      }

      const userRole = dadosUsuario.papel as PapelUsuario;
      const isFirst = dadosUsuario.is_primeiro_usuario || false;

      setPapel(userRole);
      setIsPrimeiroUsuario(isFirst);
      setPrivilegios(PrivilegeUtils.getPrivilegiosPorPapel(userRole));

    } catch (error) {
      console.error('Erro ao carregar privilégios:', error);
      setPrivilegios(PRIVILEGIOS_POR_PAPEL[PapelUsuario.USER]);
      setPapel(PapelUsuario.USER);
      setIsPrimeiroUsuario(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPrivilegios();
  }, [isAuthenticated, user]);

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

  const getIconePapel = (papel: PapelUsuario): string => {
    return PrivilegeUtils.getIconePapel(papel);
  };

  const getPapeisGerenciaveis = (): PapelUsuario[] => {
    if (!papel) return [];
    return PrivilegeUtils.getPapeisGerenciaveis(papel);
  };

  const getCategoriasAcessiveis = (): string[] => {
    if (!papel) return [];
    return PrivilegeUtils.getCategoriasAcessiveis(papel);
  };

  const recarregarPrivilegios = async (): Promise<void> => {
    await carregarPrivilegios();
  };

  const value: PrivilegeContextType = {
    // Estado
    privilegios,
    papel,
    isPrimeiroUsuario,
    isLoading,
    
    // Métodos de verificação
    verificarPrivilegio,
    podeGerenciarUsuario,
    podeAcessarConfiguracao,
    podeExecutarOperacao,
    
    // Métodos utilitários
    getDescricaoPapel,
    getCorPapel,
    getIconePapel,
    getPapeisGerenciaveis,
    getCategoriasAcessiveis,
    
    // Ações
    recarregarPrivilegios
  };

  return (
    <PrivilegeContext.Provider value={value}>
      {children}
    </PrivilegeContext.Provider>
  );
}

export function usePrivileges(): PrivilegeContextType {
  const context = useContext(PrivilegeContext);
  if (context === undefined) {
    throw new Error('usePrivileges deve ser usado dentro de um PrivilegeProvider');
  }
  return context;
}

// Hook para verificação rápida de privilégios
export function usePrivilegeCheck() {
  const { verificarPrivilegio, podeGerenciarUsuario, podeAcessarConfiguracao, papel } = usePrivileges();

  return {
    // Verificações de privilégios específicos
    podeConfigurarEmpresa: () => verificarPrivilegio('configuracoes_empresa'),
    podeGerenciarUsuarios: () => verificarPrivilegio('gerenciar_usuarios'),
    podeConfigurarSeguranca: () => verificarPrivilegio('configuracoes_seguranca'),
    podeIntegracaoExterna: () => verificarPrivilegio('integracao_externa'),
    podeBackupRestauracao: () => verificarPrivilegio('backup_restauracao'),
    podeRelatoriosAvancados: () => verificarPrivilegio('relatorios_avancados'),
    podeAuditoriaCompleta: () => verificarPrivilegio('auditoria_completa'),
    podeConfigurarSistema: () => verificarPrivilegio('configuracoes_sistema'),
    
    // Verificações de papel
    isSuperAdmin: () => papel === PapelUsuario.SUPER_ADMIN,
    isAdmin: () => papel === PapelUsuario.ADMIN,
    isManager: () => papel === PapelUsuario.MANAGER,
    isUser: () => papel === PapelUsuario.USER,
    
    // Verificações de gerenciamento
    podeGerenciarUsuario,
    podeAcessarConfiguracao,
    
    // Papel atual
    papel
  };
}