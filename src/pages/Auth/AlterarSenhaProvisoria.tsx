import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContextSimple';
import { supabase } from '../../lib/supabase';

interface ValidacaoSenha {
  tamanhoMinimo: boolean;
  temMaiuscula: boolean;
  temMinuscula: boolean;
  temNumero: boolean;
  temSimbolo: boolean;
  senhasIguais: boolean;
}

interface ConfiguracaoSenha {
  senha_minima_caracteres: number;
  senha_exigir_maiuscula: boolean;
  senha_exigir_numero: boolean;
  senha_exigir_simbolo: boolean;
}

export const AlterarSenhaProvisoria: React.FC = () => {
  const { user, empresa, logout } = useMultitenantAuth();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [configuracaoSenha, setConfiguracaoSenha] = useState<ConfiguracaoSenha>({
    senha_minima_caracteres: 8,
    senha_exigir_maiuscula: true,
    senha_exigir_numero: true,
    senha_exigir_simbolo: false
  });
  const [validacao, setValidacao] = useState<ValidacaoSenha>({
    tamanhoMinimo: false,
    temMaiuscula: false,
    temMinuscula: false,
    temNumero: false,
    temSimbolo: false,
    senhasIguais: false
  });

  // Carregar configurações de senha da empresa
  useEffect(() => {
    const carregarConfiguracoesSenha = async () => {
      if (!empresa?.id) return;

      try {
        const { data, error } = await supabase
          .from('configuracoes_empresa')
          .select('configuracoes')
          .eq('empresa_id', empresa.id)
          .eq('categoria', 'seguranca')
          .single();

        if (error) {
          console.error('Erro ao carregar configurações:', error);
          return;
        }

        if (data?.configuracoes) {
          setConfiguracaoSenha({
            senha_minima_caracteres: data.configuracoes.senha_minima_caracteres || 8,
            senha_exigir_maiuscula: data.configuracoes.senha_exigir_maiuscula || true,
            senha_exigir_numero: data.configuracoes.senha_exigir_numero || true,
            senha_exigir_simbolo: data.configuracoes.senha_exigir_simbolo || false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    carregarConfiguracoesSenha();
  }, [empresa?.id]);

  // Validar senha em tempo real
  useEffect(() => {
    const validarSenha = () => {
      const novaValidacao: ValidacaoSenha = {
        tamanhoMinimo: novaSenha.length >= configuracaoSenha.senha_minima_caracteres,
        temMaiuscula: configuracaoSenha.senha_exigir_maiuscula ? /[A-Z]/.test(novaSenha) : true,
        temMinuscula: /[a-z]/.test(novaSenha),
        temNumero: configuracaoSenha.senha_exigir_numero ? /[0-9]/.test(novaSenha) : true,
        temSimbolo: configuracaoSenha.senha_exigir_simbolo ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha) : true,
        senhasIguais: novaSenha === confirmarSenha && novaSenha.length > 0
      };

      setValidacao(novaValidacao);
    };

    validarSenha();
  }, [novaSenha, confirmarSenha, configuracaoSenha]);

  // Verificar se todas as validações passaram
  const senhaValida = Object.values(validacao).every(v => v === true);

  // Alterar senha
  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senhaValida) {
      setError('Por favor, atenda a todos os requisitos de senha.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Remover flag de senha provisória
      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update({ 
          senha_provisoria: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.user_id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Registrar log de auditoria
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresa?.id,
        p_usuario_id: user?.user_id,
        p_acao: 'PASSWORD_CHANGE',
        p_recurso: 'usuarios_empresa',
        p_detalhes: {
          tipo: 'senha_provisoria_alterada',
          timestamp: new Date().toISOString()
        }
      });

      // Mostrar sucesso e redirecionar
      alert('Senha alterada com sucesso! Você será redirecionado para o dashboard.');
      
      // Aguardar um momento e redirecionar
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setError(error instanceof Error ? error.message : 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout forçado
  const sairSistema = async () => {
    const confirmacao = window.confirm(
      'Tem certeza que deseja sair? Você precisará alterar sua senha provisória na próxima vez que fizer login.'
    );
    
    if (confirmacao) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Alterar Senha Provisória
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Por segurança, você deve alterar sua senha provisória antes de continuar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Informações da empresa */}
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Bem-vindo à {empresa?.nome}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Usuário: {user?.nome_completo}</p>
                  <p>Email: {user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={alterarSenha}>
            {/* Nova Senha */}
            <div>
              <label htmlFor="nova-senha" className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="nova-senha"
                  name="nova-senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmar-senha" className="block text-sm font-medium text-gray-700">
                Confirmar Nova Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmar-senha"
                  name="confirmar-senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Requisitos de Senha */}
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Requisitos da Senha:</h4>
              <div className="space-y-2">
                <div className={`flex items-center text-sm ${
                  validacao.tamanhoMinimo ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <svg className={`h-4 w-4 mr-2 ${
                    validacao.tamanhoMinimo ? 'text-green-500' : 'text-gray-400'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mínimo de {configuracaoSenha.senha_minima_caracteres} caracteres
                </div>
                
                {configuracaoSenha.senha_exigir_maiuscula && (
                  <div className={`flex items-center text-sm ${
                    validacao.temMaiuscula ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <svg className={`h-4 w-4 mr-2 ${
                      validacao.temMaiuscula ? 'text-green-500' : 'text-gray-400'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Pelo menos uma letra maiúscula
                  </div>
                )}
                
                <div className={`flex items-center text-sm ${
                  validacao.temMinuscula ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <svg className={`h-4 w-4 mr-2 ${
                    validacao.temMinuscula ? 'text-green-500' : 'text-gray-400'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Pelo menos uma letra minúscula
                </div>
                
                {configuracaoSenha.senha_exigir_numero && (
                  <div className={`flex items-center text-sm ${
                    validacao.temNumero ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <svg className={`h-4 w-4 mr-2 ${
                      validacao.temNumero ? 'text-green-500' : 'text-gray-400'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Pelo menos um número
                  </div>
                )}
                
                {configuracaoSenha.senha_exigir_simbolo && (
                  <div className={`flex items-center text-sm ${
                    validacao.temSimbolo ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <svg className={`h-4 w-4 mr-2 ${
                      validacao.temSimbolo ? 'text-green-500' : 'text-gray-400'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Pelo menos um símbolo (!@#$%^&*)
                  </div>
                )}
                
                <div className={`flex items-center text-sm ${
                  validacao.senhasIguais ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <svg className={`h-4 w-4 mr-2 ${
                    validacao.senhasIguais ? 'text-green-500' : 'text-gray-400'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  As senhas devem ser iguais
                </div>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={!senhaValida || isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  senhaValida && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Alterando senha...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </button>
              
              <button
                type="button"
                onClick={sairSistema}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sair do Sistema
              </button>
            </div>
          </form>

          {/* Informações de Segurança */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Informações de Segurança</span>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <ul className="space-y-1">
                <li>• Sua senha será criptografada e armazenada com segurança</li>
                <li>• Você receberá uma confirmação por email após a alteração</li>
                <li>• Esta alteração será registrada nos logs de auditoria</li>
                <li>• Em caso de problemas, contate o administrador do sistema</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};