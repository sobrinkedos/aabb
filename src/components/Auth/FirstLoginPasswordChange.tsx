/**
 * Componente para Alteração de Senha no Primeiro Login
 * 
 * Força o usuário a alterar a senha temporária no primeiro acesso,
 * garantindo segurança e conformidade com políticas de senha.
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Key, Lock } from 'lucide-react';
import { validatePasswordStrength, GeneratedPassword } from '../../utils/secure-password-generator';

// ============================================================================
// INTERFACES
// ============================================================================

interface FirstLoginPasswordChangeProps {
  isOpen: boolean;
  userEmail: string;
  temporaryPassword: string;
  onPasswordChanged: (newPassword: string) => Promise<void>;
  onCancel?: () => void;
  allowCancel?: boolean;
}

interface PasswordValidation {
  isValid: boolean;
  strength: any;
  errors: string[];
  suggestions: string[];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FirstLoginPasswordChange: React.FC<FirstLoginPasswordChangeProps> = ({
  isOpen,
  userEmail,
  temporaryPassword,
  onPasswordChanged,
  onCancel,
  allowCancel = false
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<PasswordValidation | null>(null);

  // Validar nova senha em tempo real
  useEffect(() => {
    if (!newPassword) {
      setValidation(null);
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validações básicas
    if (newPassword.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }

    if (newPassword === temporaryPassword) {
      errors.push('A nova senha deve ser diferente da senha temporária');
    }

    if (newPassword.toLowerCase().includes(userEmail.split('@')[0].toLowerCase())) {
      errors.push('A senha não deve conter seu nome de usuário');
    }

    // Verificar padrões comuns
    const commonPatterns = ['123456', 'password', 'senha123', 'admin', 'qwerty'];
    if (commonPatterns.some(pattern => newPassword.toLowerCase().includes(pattern))) {
      errors.push('Evite usar padrões comuns de senha');
    }

    // Sugestões baseadas na força
    if (strength.level === 'weak' || strength.level === 'very-weak') {
      suggestions.push('Use uma combinação de letras maiúsculas e minúsculas');
      suggestions.push('Inclua números e símbolos');
      suggestions.push('Considere usar uma frase-senha');
    }

    setValidation({
      isValid: errors.length === 0 && strength.level !== 'very-weak',
      strength,
      errors,
      suggestions
    });
  }, [newPassword, temporaryPassword, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation?.isValid) {
      setError('Por favor, corrija os erros antes de continuar');
      return;
    }

    if (currentPassword !== temporaryPassword) {
      setError('Senha atual incorreta');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsChanging(true);
    setError(null);

    try {
      await onPasswordChanged(newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setIsChanging(false);
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-strong': return 'text-green-600 bg-green-100';
      case 'strong': return 'text-green-600 bg-green-100';
      case 'good': return 'text-yellow-600 bg-yellow-100';
      case 'fair': return 'text-orange-600 bg-orange-100';
      case 'weak': return 'text-red-600 bg-red-100';
      case 'very-weak': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStrengthText = (level: string) => {
    switch (level) {
      case 'very-strong': return 'Muito Forte';
      case 'strong': return 'Forte';
      case 'good': return 'Boa';
      case 'fair': return 'Razoável';
      case 'weak': return 'Fraca';
      case 'very-weak': return 'Muito Fraca';
      default: return 'Desconhecida';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
                <p className="text-blue-100 text-sm">Primeiro acesso - Senha obrigatória</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Alteração Obrigatória</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Por segurança, você deve alterar sua senha temporária antes de continuar.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual (Temporária)
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua senha temporária"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength */}
              {validation && (
                <div className="mt-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getStrengthColor(validation.strength.level)
                  }`}>
                    <Key className="h-3 w-3 mr-1" />
                    Força: {getStrengthText(validation.strength.level)} ({validation.strength.score}/100)
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        validation.strength.level === 'very-strong' || validation.strength.level === 'strong' 
                          ? 'bg-green-500' 
                          : validation.strength.level === 'good' 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${validation.strength.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validation?.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validation.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{error}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {validation?.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validation.suggestions.map((suggestion, index) => (
                    <p key={index} className="text-xs text-blue-600 flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>{suggestion}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirme sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>As senhas não coincidem</span>
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            {/* Security Tips */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Dicas de Segurança</span>
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Use pelo menos 8 caracteres</li>
                <li>• Combine letras, números e símbolos</li>
                <li>• Evite informações pessoais</li>
                <li>• Não reutilize senhas de outros sites</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              {allowCancel && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isChanging}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              )}
              
              <button
                type="submit"
                disabled={isChanging || !validation?.isValid || newPassword !== confirmPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isChanging ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Alterando...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Alterar Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;