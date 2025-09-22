/**
 * Hook para Gerenciar Fluxo de Primeiro Login
 * 
 * Gerencia o processo de primeiro login, incluindo verificação de senha temporária,
 * alteração obrigatória de senha e atualização de status no banco de dados.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin, isAdminConfigured } from '../lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

interface FirstLoginState {
  isFirstLogin: boolean;
  isLoading: boolean;
  error: string | null;
  user: any | null;
  requiresPasswordChange: boolean;
  passwordExpiresAt: Date | null;
}

interface UseFirstLoginFlowOptions {
  onPasswordChanged?: () => void;
  onFirstLoginComplete?: () => void;
  checkInterval?: number; // ms para verificar status
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useFirstLoginFlow = (options: UseFirstLoginFlowOptions = {}) => {
  const {
    onPasswordChanged,
    onFirstLoginComplete,
    checkInterval = 30000 // 30 segundos
  } = options;

  const [state, setState] = useState<FirstLoginState>({
    isFirstLogin: false,
    isLoading: true,
    error: null,
    user: null,
    requiresPasswordChange: false,
    passwordExpiresAt: null
  });

  // ============================================================================
  // FUNÇÕES DE VERIFICAÇÃO
  // ============================================================================

  /**
   * Verifica se o usuário atual precisa alterar a senha
   */
  const checkPasswordStatus = useCallback(async (userId?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Obter usuário atual se não fornecido
      let currentUser = null;
      if (userId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        currentUser = user;
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        currentUser = user;
      }

      if (!currentUser) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isFirstLogin: false,
          requiresPasswordChange: false
        }));
        return;
      }

      // Verificar status na tabela usuarios_empresa
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios_empresa')
        .select('senha_provisoria, created_at, updated_at, total_logins')
        .eq('user_id', currentUser.id)
        .single();

      if (profileError) {
        console.warn('Erro ao buscar perfil do usuário:', profileError);
        // Se não encontrar o perfil, assumir que não é primeiro login
        setState(prev => ({
          ...prev,
          isLoading: false,
          user: currentUser,
          isFirstLogin: false,
          requiresPasswordChange: false
        }));
        return;
      }

      // Determinar se é primeiro login
      const isFirstLogin = userProfile.total_logins === 0;
      const requiresPasswordChange = userProfile.senha_provisoria === true;

      // Calcular data de expiração (7 dias após criação)
      const createdAt = new Date(userProfile.created_at);
      const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isExpired = new Date() > expiresAt;

      setState(prev => ({
        ...prev,
        isLoading: false,
        user: currentUser,
        isFirstLogin,
        requiresPasswordChange: requiresPasswordChange || isExpired,
        passwordExpiresAt: requiresPasswordChange ? expiresAt : null
      }));

    } catch (error) {
      console.error('Erro ao verificar status da senha:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar status'
      }));
    }
  }, []);

  /**
   * Verifica se a senha está próxima do vencimento
   */
  const isPasswordNearExpiry = useCallback((daysThreshold: number = 2): boolean => {
    if (!state.passwordExpiresAt) return false;
    
    const now = new Date();
    const timeDiff = state.passwordExpiresAt.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    return daysDiff <= daysThreshold && daysDiff > 0;
  }, [state.passwordExpiresAt]);

  // ============================================================================
  // FUNÇÕES DE AÇÃO
  // ============================================================================

  /**
   * Altera a senha do usuário
   */
  const changePassword = useCallback(async (newPassword: string): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuário não encontrado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        throw new Error(`Erro ao atualizar senha: ${authError.message}`);
      }

      // Atualizar status na tabela usuarios_empresa
      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update({
          senha_provisoria: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', state.user.id);

      if (updateError) {
        console.warn('Erro ao atualizar status da senha:', updateError);
        // Não falhar por causa disso, a senha foi alterada com sucesso
      }

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        isLoading: false,
        requiresPasswordChange: false,
        passwordExpiresAt: null
      }));

      // Callbacks
      if (onPasswordChanged) {
        onPasswordChanged();
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar senha'
      }));
      throw error;
    }
  }, [state.user, onPasswordChanged]);

  /**
   * Marca o primeiro login como completo
   */
  const completeFirstLogin = useCallback(async (): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuário não encontrado');
    }

    try {
      // Incrementar contador de logins
      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update({
          total_logins: 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', state.user.id);

      if (updateError) {
        console.warn('Erro ao atualizar contador de logins:', updateError);
      }

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        isFirstLogin: false
      }));

      // Callback
      if (onFirstLoginComplete) {
        onFirstLoginComplete();
      }

    } catch (error) {
      console.error('Erro ao completar primeiro login:', error);
      // Não falhar por causa disso
    }
  }, [state.user, onFirstLoginComplete]);

  /**
   * Força verificação de status
   */
  const refreshStatus = useCallback(() => {
    checkPasswordStatus();
  }, [checkPasswordStatus]);

  /**
   * Limpa erros
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Verificar status inicial
  useEffect(() => {
    checkPasswordStatus();
  }, [checkPasswordStatus]);

  // Verificar status periodicamente
  useEffect(() => {
    if (!checkInterval) return;

    const interval = setInterval(() => {
      if (state.requiresPasswordChange) {
        checkPasswordStatus();
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkPasswordStatus, checkInterval, state.requiresPasswordChange]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          checkPasswordStatus();
        } else if (event === 'SIGNED_OUT') {
          setState({
            isFirstLogin: false,
            isLoading: false,
            error: null,
            user: null,
            requiresPasswordChange: false,
            passwordExpiresAt: null
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkPasswordStatus]);

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  /**
   * Obtém dias restantes até expiração da senha
   */
  const getDaysUntilExpiry = useCallback((): number => {
    if (!state.passwordExpiresAt) return 0;
    
    const now = new Date();
    const timeDiff = state.passwordExpiresAt.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  }, [state.passwordExpiresAt]);

  /**
   * Verifica se a senha expirou
   */
  const isPasswordExpired = useCallback((): boolean => {
    if (!state.passwordExpiresAt) return false;
    return new Date() > state.passwordExpiresAt;
  }, [state.passwordExpiresAt]);

  /**
   * Obtém mensagem de status da senha
   */
  const getPasswordStatusMessage = useCallback((): string => {
    if (!state.requiresPasswordChange) {
      return 'Senha atualizada';
    }

    if (isPasswordExpired()) {
      return 'Senha expirada - alteração obrigatória';
    }

    const daysLeft = getDaysUntilExpiry();
    if (daysLeft <= 1) {
      return 'Senha expira hoje - altere agora';
    } else if (daysLeft <= 2) {
      return `Senha expira em ${daysLeft} dias`;
    }

    return 'Senha temporária - altere quando possível';
  }, [state.requiresPasswordChange, isPasswordExpired, getDaysUntilExpiry]);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  return {
    // Estado
    ...state,
    
    // Funções de ação
    changePassword,
    completeFirstLogin,
    refreshStatus,
    clearError,
    
    // Funções utilitárias
    isPasswordNearExpiry,
    getDaysUntilExpiry,
    isPasswordExpired,
    getPasswordStatusMessage,
    
    // Flags computadas
    shouldShowPasswordWarning: isPasswordNearExpiry(3),
    shouldForcePasswordChange: state.requiresPasswordChange || isPasswordExpired(),
    canSkipPasswordChange: !state.requiresPasswordChange && !isPasswordExpired()
  };
};

export default useFirstLoginFlow;