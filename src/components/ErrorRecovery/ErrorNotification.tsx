/**
 * Componente de Notificação de Erros
 * 
 * Exibe notificações de erro, recuperação e status de conexão
 */

import React from 'react';
import { 
  AlertCircle, CheckCircle, AlertTriangle, 
  Wifi, WifiOff, RefreshCw, X 
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface ErrorNotificationProps {
  isOnline: boolean;
  isRetrying: boolean;
  pendingOperations: number;
  lastError: string | null;
  lastRecovery: string | null;
  onClearError?: () => void;
  onClearRecovery?: () => void;
  onManualSync?: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  isOnline,
  isRetrying,
  pendingOperations,
  lastError,
  lastRecovery,
  onClearError,
  onClearRecovery,
  onManualSync
}) => {
  // Não mostrar nada se não há nada para exibir
  if (!lastError && !lastRecovery && isOnline && pendingOperations === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Status de Conexão */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Sem conexão</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Operações serão sincronizadas quando a conexão for restaurada
          </p>
        </div>
      )}

      {/* Operações Pendentes */}
      {pendingOperations > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {pendingOperations} operação(ões) pendente(s)
              </span>
            </div>
            {isOnline && onManualSync && (
              <button
                onClick={onManualSync}
                disabled={isRetrying}
                className="text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          {isRetrying && (
            <p className="text-xs text-yellow-600 mt-1">Sincronizando...</p>
          )}
        </div>
      )}

      {/* Erro */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-red-800">Erro</span>
                <p className="text-xs text-red-600 mt-1">{lastError}</p>
              </div>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recuperação */}
      {lastRecovery && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-green-800">Sucesso</span>
                <p className="text-xs text-green-600 mt-1">{lastRecovery}</p>
              </div>
            </div>
            {onClearRecovery && (
              <button
                onClick={onClearRecovery}
                className="text-green-400 hover:text-green-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status de Reconexão */}
      {isOnline && pendingOperations === 0 && !lastError && !lastRecovery && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Conectado</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE DE TOAST SIMPLES
// ============================================================================

interface ToastProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'info':
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className={`border rounded-lg p-3 shadow-lg ${getStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {getIcon()}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CONTAINER DE TOASTS
// ============================================================================

interface ToastContainerProps {
  notifications: Array<{
    id: string;
    type: 'error' | 'warning' | 'success' | 'info';
    message: string;
    timestamp: number;
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onRemove
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

export default ErrorNotification;