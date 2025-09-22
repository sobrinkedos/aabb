import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

interface PasswordChangeRequiredProps {
  userEmail: string;
  onPasswordChanged: () => void;
  onCancel?: () => void;
}

const PasswordChangeRequired: React.FC<PasswordChangeRequiredProps> = ({
  userEmail,
  onPasswordChanged,
  onCancel
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Deve conter pelo menos um caractere especial');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validações
    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`Senha inválida:\n• ${passwordErrors.join('\n• ')}`);
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Atualizar senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // 2. Atualizar flag senha_provisoria na tabela usuarios_empresa
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: updateUserError } = await supabase
          .from('usuarios_empresa')
          .update({
            senha_provisoria: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (updateUserError) {
          console.warn('Erro ao atualizar flag senha_provisoria:', updateUserError);
          // Não falhar por causa disso
        }
      }
      
      setSuccess('Senha alterada com sucesso! Redirecionando...');
      
      // Aguardar um pouco e chamar callback
      setTimeout(() => {
        onPasswordChanged();
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setError(error.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password: string): { score: number; label: string; color: string } => {
    const errors = validatePassword(password);
    const score = Math.max(0, 5 - errors.length);
    
    if (score === 0) return { score, label: 'Muito fraca', color: '#f44336' };
    if (score === 1) return { score, label: 'Fraca', color: '#ff9800' };
    if (score === 2) return { score, label: 'Regular', color: '#ff9800' };
    if (score === 3) return { score, label: 'Boa', color: '#2196f3' };
    if (score === 4) return { score, label: 'Forte', color: '#4caf50' };
    return { score, label: 'Muito forte', color: '#4caf50' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Alteração de Senha Obrigatória</h1>
          <p className="text-gray-600">Sua senha temporária deve ser alterada</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-800 mb-1">Primeira vez no sistema</h3>
              <p className="text-sm text-orange-700">
                Por segurança, você deve criar uma nova senha antes de acessar o sistema.
                Esta senha será usada em todos os seus próximos logins.
              </p>
              <p className="text-sm text-orange-600 mt-2">
                <strong>Usuário:</strong> {userEmail}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Força da senha:</span>
                  <span style={{ color: strength.color }} className="font-medium">
                    {strength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      backgroundColor: strength.color
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Confirme sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {confirmPassword && newPassword && (
              <div className="mt-2 flex items-center space-x-2">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm text-green-600">Senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="text-red-500" />
                    <span className="text-sm text-red-600">Senhas não coincidem</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Requisitos da senha:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center space-x-2">
                <span className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                  {newPassword.length >= 8 ? '✓' : '○'}
                </span>
                <span>Pelo menos 8 caracteres</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>Uma letra maiúscula</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                  {/[a-z]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>Uma letra minúscula</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                  {/[0-9]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>Um número</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>Um caractere especial</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 whitespace-pre-line">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200 flex items-center space-x-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="flex space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Alterando...</span>
                </div>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Após alterar a senha, você terá acesso completo ao sistema
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeRequired;