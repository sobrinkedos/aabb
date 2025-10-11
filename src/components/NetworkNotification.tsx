import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkNotification: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      // Auto-hide após 5 segundos
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Notificação de reconexão
  if (showReconnected) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <Wifi className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-green-900">Conexão Restaurada</h4>
            <p className="text-sm text-green-700 mt-1">
              Você está online novamente. Pode continuar salvando dados.
            </p>
          </div>
          <button
            onClick={() => setShowReconnected(false)}
            className="text-green-400 hover:text-green-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Notificação de desconexão persistente
  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <WifiOff className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900">Sem Conexão</h4>
            <p className="text-sm text-red-700 mt-1">
              Verifique sua internet. Algumas funcionalidades podem não funcionar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};