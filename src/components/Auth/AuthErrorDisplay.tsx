import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Mail, HelpCircle, X } from 'lucide-react';
import { processAuthError } from '../../utils/authErrors';

interface AuthErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  context?: string;
}

export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  context = 'auth'
}) => {
  if (!error) return null;

  const errorInfo = processAuthError(error);

  const getIcon = () => {
    switch (errorInfo.code) {
      case 'NETWORK_ERROR':
        return <RefreshCw className="w-5 h-5" />;
      case 'EMAIL_NOT_CONFIRMED':
        return <Mail className="w-5 h-5" />;
      case 'PROFILE_NOT_FOUND':
      case 'UNKNOWN_ERROR':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColorClasses = () => {
    switch (errorInfo.code) {
      case 'NETWORK_ERROR':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'RATE_LIMIT':
        return {
          container: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          text: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      default:
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={`rounded-lg border p-4 ${colors.container}`}
      >
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${colors.text}`}>
              {errorInfo.code === 'NETWORK_ERROR' && 'Problema de Conexão'}
              {errorInfo.code === 'INVALID_CREDENTIALS' && 'Credenciais Inválidas'}
              {errorInfo.code === 'EMAIL_NOT_CONFIRMED' && 'Email Não Confirmado'}
              {errorInfo.code === 'RATE_LIMIT' && 'Muitas Tentativas'}
              {errorInfo.code === 'USER_NOT_FOUND' && 'Usuário Não Encontrado'}
              {errorInfo.code === 'INVALID_REFRESH_TOKEN' && 'Sessão Expirada'}
              {errorInfo.code === 'PROFILE_NOT_FOUND' && 'Erro de Configuração'}
              {errorInfo.code === 'INSUFFICIENT_PERMISSIONS' && 'Acesso Negado'}
              {errorInfo.code === 'UNKNOWN_ERROR' && 'Erro Inesperado'}
            </h3>
            
            <p className={`mt-1 text-sm ${colors.text}`}>
              {errorInfo.userMessage}
            </p>

            {/* Ações baseadas no tipo de erro */}
            <div className="mt-3 flex items-center space-x-3">
              {errorInfo.retryable && onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md ${colors.button} transition-colors`}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Tentar Novamente
                </button>
              )}

              {errorInfo.action === 'contact_support' && (
                <a
                  href="mailto:suporte@clubmanager.com"
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md ${colors.button} transition-colors`}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Contatar Suporte
                </a>
              )}

              {errorInfo.code === 'EMAIL_NOT_CONFIRMED' && (
                <button
                  onClick={() => {
                    // Aqui você pode implementar reenvio de email de confirmação
                    console.log('Reenviar email de confirmação');
                  }}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md ${colors.button} transition-colors`}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Reenviar Email
                </button>
              )}
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`flex-shrink-0 ${colors.icon} hover:opacity-70 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Componente simplificado para erros inline
export const InlineAuthError: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;

  const errorInfo = processAuthError(error);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center space-x-2 text-red-600 text-sm mt-2"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{errorInfo.userMessage}</span>
    </motion.div>
  );
};

export default AuthErrorDisplay;