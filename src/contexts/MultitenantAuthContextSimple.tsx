import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Empresa,
  UsuarioEmpresa,
  PermissaoModulo,
  ModuloSistema,
  AuthContextMultitenant,
  RegistroEmpresaData,
  ApiResponse
} from '../types/multitenant';

// Versão simplificada do MultitenantAuthContext
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
  const [isLoading, setIsLoading] = useState(false); // Começar como false para não travar
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Funções mock para não quebrar a interface
  const carregarDadosUsuario = async () => {
    console.log('🔧 Modo simplificado - carregarDadosUsuario mock');
  };

  const carregarPermissoes = async () => {
    console.log('🔧 Modo simplificado - carregarPermissoes mock');
  };

  const login = async (email: string, password: string): Promise<ApiResponse<UsuarioEmpresa>> => {
    console.log('🔧 Modo simplificado - login mock');
    return { success: false, error: 'Use o login principal' };
  };

  const registrarEmpresa = async (dados: RegistroEmpresaData): Promise<ApiResponse<{ empresa: Empresa; usuario: UsuarioEmpresa }>> => {
    console.log('🔧 Modo simplificado - registrarEmpresa mock');
    return { success: false, error: 'Registro não disponível no modo simplificado' };
  };

  const logout = async () => {
    setUser(null);
    setEmpresa(null);
    setPermissoes({} as Record<ModuloSistema, PermissaoModulo>);
    setIsAuthenticated(false);
  };

  const hasPermission = (modulo: ModuloSistema, acao: string): boolean => {
    return true; // Permitir tudo no modo simplificado
  };

  const getModulePermissions = (modulo: ModuloSistema): PermissaoModulo | null => {
    return {
      modulo,
      pode_ler: true,
      pode_criar: true,
      pode_editar: true,
      pode_excluir: true,
      pode_gerenciar: true
    };
  };

  const refreshUserData = async () => {
    console.log('🔧 Modo simplificado - refreshUserData mock');
  };

  return (
    <MultitenantAuthContext.Provider value={{
      user,
      empresa,
      permissoes,
      isLoading,
      isAuthenticated,
      login,
      registrarEmpresa,
      logout,
      hasPermission,
      getModulePermissions,
      refreshUserData
    }}>
      {children}
    </MultitenantAuthContext.Provider>
  );
};