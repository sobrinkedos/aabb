import React from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Comanda } from '../../../types/bar-attendance';

interface ComandaAlertsProps {
  comandas: Comanda[];
  onComandaClick: (comanda: Comanda) => void;
  onDismissAlert?: (comandaId: string) => void;
}

const ComandaAlerts: React.FC<ComandaAlertsProps> = ({
  comandas,
  onComandaClick,
  onDismissAlert
}) => {
  const getOverdueComandas = () => {
    const now = new Date();
    return comandas.filter(comanda => {
      if (comanda.status !== 'open') return false;
      const openedAt = new Date(comanda.opened_at);
      const hoursDiff = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff > 2; // Considera atrasado após 2 horas
    });
  };

  const getCriticalComandas = () => {
    const now = new Date();
    return comandas.filter(comanda => {
      if (comanda.status !== 'open') return false;
      const openedAt = new Date(comanda.opened_at);
      const hoursDiff = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff > 4; // Crítico após 4 horas
    });
  };

  const getTimeElapsed = (openedAt: string) => {
    const opened = new Date(openedAt);
    const now = new Date();
    const diffMs = now.getTime() - opened.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const overdueComandas = getOverdueComandas();
  const criticalComandas = getCriticalComandas();

  if (overdueComandas.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {/* Alertas Críticos */}
      {criticalComandas.map(comanda => (
        <div
          key={`critical-${comanda.id}`}
          className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h4 className="text-red-800 font-semibold">
                  Comanda Crítica - {comanda.table?.number || 'Balcão'}
                </h4>
                <p className="text-red-700 text-sm">
                  {comanda.customer?.name || comanda.customer_name || 'Cliente não identificado'} • 
                  Aberta há {getTimeElapsed(comanda.opened_at)} • 
                  R$ {comanda.total.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onComandaClick(comanda)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Ver Detalhes
              </button>
              {onDismissAlert && (
                <button
                  onClick={() => onDismissAlert(comanda.id)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Alertas de Atenção */}
      {overdueComandas.filter(c => !criticalComandas.includes(c)).map(comanda => (
        <div
          key={`warning-${comanda.id}`}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <h4 className="text-yellow-800 font-semibold">
                  Atenção - {comanda.table?.number || 'Balcão'}
                </h4>
                <p className="text-yellow-700 text-sm">
                  {comanda.customer?.name || comanda.customer_name || 'Cliente não identificado'} • 
                  Aberta há {getTimeElapsed(comanda.opened_at)} • 
                  R$ {comanda.total.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onComandaClick(comanda)}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Ver Detalhes
              </button>
              {onDismissAlert && (
                <button
                  onClick={() => onDismissAlert(comanda.id)}
                  className="p-1 text-yellow-500 hover:bg-yellow-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Resumo dos Alertas */}
      {overdueComandas.length > 3 && (
        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center">
          <p className="text-gray-600 text-sm">
            {overdueComandas.length} comandas com tempo excessivo • 
            {criticalComandas.length} críticas
          </p>
        </div>
      )}
    </div>
  );
};

export default ComandaAlerts;