import React, { useState, useEffect } from 'react';
import { Clock, Wifi } from 'lucide-react';

interface SavingProgressProps {
  isVisible: boolean;
  mode: 'create' | 'edit';
  isOnline: boolean;
  retryCount?: number;
  isRetrying?: boolean;
}

export const SavingProgress: React.FC<SavingProgressProps> = ({ 
  isVisible, 
  mode, 
  isOnline, 
  retryCount = 0, 
  isRetrying = false 
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsed(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const maxTime = mode === 'edit' ? 60 : 45;
  const progress = Math.min((elapsed / maxTime) * 100, 100);
  
  const getStatusMessage = () => {
    if (isRetrying) return `Tentativa ${retryCount + 1} - Tentando novamente...`;
    if (retryCount > 0) return `Tentativa ${retryCount + 1} em andamento...`;
    if (elapsed < 5) return mode === 'edit' ? 'Salvando alterações...' : 'Cadastrando funcionário...';
    if (elapsed < 15) return 'Processando dados...';
    if (elapsed < 30) return 'Aguarde, operação em andamento...';
    if (elapsed < maxTime) return 'Operação está demorando mais que o esperado...';
    return 'Timeout em breve. Verifique sua conexão.';
  };

  const getProgressColor = () => {
    if (elapsed < 15) return 'bg-blue-500';
    if (elapsed < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          
          {/* Status Message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getStatusMessage()}
          </h3>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Time and Connection Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{elapsed}s / {maxTime}s</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              <Wifi className="h-4 w-4" />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          
          {/* Warning for slow operations */}
          {elapsed > 20 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ A operação está demorando mais que o normal. 
                Isso pode indicar lentidão na conexão ou no servidor.
              </p>
            </div>
          )}
          
          {/* Timeout warning */}
          {elapsed > maxTime - 10 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                🚨 Timeout em {maxTime - elapsed} segundos. 
                A operação pode ter sido processada mesmo assim.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};