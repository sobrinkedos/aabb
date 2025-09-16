import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContext';
import { supabase } from '../../lib/supabase';

interface SenhaProvisionariaGuardProps {
  children: React.ReactNode;
}

/**
 * Componente que verifica se o usuário tem senha provisória
 * e força o redirecionamento para alteração de senha
 */
export const SenhaProvisionariaGuard: React.FC<SenhaProvisionariaGuardProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useMultitenantAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [temSenhaProvisoria, setTemSenhaProvisoria] = useState(false);

  // Rotas que não precisam de verificação de senha provisória
  const rotasExcluidas = [
    '/alterar-senha-provisoria',
    '/login',
    '/logout',
    '/registro-empresa'
  ];

  useEffect(() => {
    const verificarSenhaProvisoria = async () => {
      // Se ainda está carregando a autenticação, aguardar
      if (authLoading) {
        return;
      }

      // Se não há usuário logado, não verificar
      if (!user?.user_id) {
        setIsChecking(false);
        return;
      }

      // Se está em uma rota excluída, não verificar
      if (rotasExcluidas.some(rota => location.pathname.startsWith(rota))) {
        setIsChecking(false);
        return;
      }

      try {
        // Buscar informações do usuário na empresa
        const { data: usuarioEmpresa, error } = await supabase
          .from('usuarios_empresa')
          .select('senha_provisoria, status')
          .eq('user_id', user.user_id)
          .single();

        if (error) {
          console.error('Erro ao verificar senha provisória:', error);
          setIsChecking(false);
          return;
        }

        // Verificar se tem senha provisória
        if (usuarioEmpresa?.senha_provisoria === true) {
          setTemSenhaProvisoria(true);
          
          // Registrar tentativa de acesso com senha provisória
          await supabase.rpc('registrar_log_auditoria', {
            p_empresa_id: user.empresa_id,
            p_usuario_id: user.user_id,
            p_acao: 'ACCESS_ATTEMPT_TEMP_PASSWORD',
            p_recurso: 'sistema',
            p_detalhes: {
              rota_tentativa: location.pathname,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent
            }
          });

          // Redirecionar para alteração de senha
          navigate('/alterar-senha-provisoria', { 
            replace: true,
            state: { from: location.pathname }
          });
          return;
        }

        // Verificar se usuário está ativo
        if (usuarioEmpresa?.status !== 'ativo') {
          console.warn('Usuário não está ativo:', usuarioEmpresa?.status);
          // Aqui você pode implementar lógica adicional para usuários inativos
        }

        setTemSenhaProvisoria(false);
      } catch (error) {
        console.error('Erro ao verificar senha provisória:', error);
      } finally {
        setIsChecking(false);
      }
    };

    verificarSenhaProvisoria();
  }, [user, authLoading, location.pathname, navigate]);

  // Mostrar loading enquanto verifica
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="mt-6 text-center text-lg font-medium text-gray-900">
            Verificando credenciais...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Aguarde enquanto validamos suas informações de acesso
          </p>
        </div>
      </div>
    );
  }

  // Se tem senha provisória, não renderizar o conteúdo
  // (o redirecionamento já foi feito)
  if (temSenhaProvisoria) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-lg font-medium text-gray-900">
            Redirecionando...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Você será redirecionado para alterar sua senha provisória
          </p>
        </div>
      </div>
    );
  }

  // Renderizar o conteúdo normalmente
  return <>{children}</>;
};

/**
 * Hook para verificar status de senha provisória
 */
export const useSenhaProvisoria = () => {
  const { user } = useMultitenantAuth();
  const [temSenhaProvisoria, setTemSenhaProvisoria] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verificarStatus = async () => {
      if (!user?.user_id) {
        setTemSenhaProvisoria(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('usuarios_empresa')
          .select('senha_provisoria')
          .eq('user_id', user.user_id)
          .single();

        if (error) {
          console.error('Erro ao verificar senha provisória:', error);
          setTemSenhaProvisoria(null);
        } else {
          setTemSenhaProvisoria(data?.senha_provisoria === true);
        }
      } catch (error) {
        console.error('Erro ao verificar senha provisória:', error);
        setTemSenhaProvisoria(null);
      } finally {
        setIsLoading(false);
      }
    };

    verificarStatus();
  }, [user?.user_id]);

  const marcarSenhaAlterada = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.user_id) {
      return { success: false, error: 'Usuário não identificado' };
    }

    try {
      const { error } = await supabase
        .from('usuarios_empresa')
        .update({ 
          senha_provisoria: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (error) {
        throw new Error(error.message);
      }

      setTemSenhaProvisoria(false);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status';
      return { success: false, error: errorMessage };
    }
  };

  return {
    temSenhaProvisoria,
    isLoading,
    marcarSenhaAlterada
  };
};

/**
 * Componente para mostrar aviso de senha provisória
 */
interface AvisoSenhaProvisionariaProps {
  onAlterarSenha: () => void;
  onFechar?: () => void;
}

export const AvisoSenhaProvisoria: React.FC<AvisoSenhaProvisionariaProps> = ({ 
  onAlterarSenha, 
  onFechar 
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
            Senha Provisória Detectada
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Por segurança, você deve alterar sua senha provisória antes de continuar usando o sistema.
            </p>
          </div>
          <div className="items-center px-4 py-3">
            <button
              onClick={onAlterarSenha}
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Alterar Senha Agora
            </button>
            {onFechar && (
              <button
                onClick={onFechar}
                className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Lembrar Mais Tarde
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para indicador de senha provisória na interface
 */
export const IndicadorSenhaProvisoria: React.FC = () => {
  const { temSenhaProvisoria, isLoading } = useSenhaProvisoria();
  const navigate = useNavigate();

  if (isLoading || !temSenhaProvisoria) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <strong>Atenção:</strong> Você está usando uma senha provisória. 
            <button
              onClick={() => navigate('/alterar-senha-provisoria')}
              className="font-medium underline text-yellow-700 hover:text-yellow-600"
            >
              Clique aqui para alterá-la
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
};