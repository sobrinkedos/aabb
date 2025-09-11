import React from 'react';
import { Clock, CreditCard, Users, MapPin, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { ComandaWithItems } from '../../../types/bar-attendance';
import { formatCurrency } from '../../../types/cash-management';

interface PendingComandasProps {
  comandas: ComandaWithItems[];
  onPayComanda: (comanda: ComandaWithItems) => void;
  disabled?: boolean;
}

export const PendingComandas: React.FC<PendingComandasProps> = ({
  comandas,
  onPayComanda,
  disabled = false
}) => {
  const getTimeElapsed = (openedAt: string): string => {
    const now = new Date();
    const opened = new Date(openedAt);
    const diffMins = Math.floor((now.getTime() - opened.getTime()) / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}min`;
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}min`;
  };

  const getStatusColor = (openedAt: string): string => {
    const diffMins = Math.floor((new Date().getTime() - new Date(openedAt).getTime()) / (1000 * 60));
    if (diffMins > 120) return 'text-red-600 bg-red-50';
    if (diffMins > 60) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  if (comandas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Comandas Pendentes de Pagamento</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Todas as comandas foram pagas!</p>
          <p className="text-gray-500 text-sm mt-1">Não há comandas aguardando pagamento no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Comandas Pendentes de Pagamento</h3>
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {comandas.length}
          </span>
        </div>
        
        {disabled && (
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Abra o caixa para processar pagamentos</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comandas.map((comanda) => (
          <div key={comanda.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {comanda.table ? (
                  <><MapPin className="h-4 w-4 text-gray-600" /><span className="text-sm font-medium text-gray-900">Mesa {comanda.table.number}</span></>
                ) : (
                  <><CreditCard className="h-4 w-4 text-gray-600" /><span className="text-sm font-medium text-gray-900">Balcão</span></>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comanda.opened_at)}`}>
                {getTimeElapsed(comanda.opened_at)}
              </div>
            </div>

            {comanda.customer_name && (
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{comanda.customer_name}</span>
                <span className="text-xs text-gray-500">({comanda.people_count} pessoas)</span>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {new Date(comanda.opened_at).toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">
                {comanda.items.length} {comanda.items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(comanda.total)}</p>
                <p className="text-xs text-gray-600">Total da comanda</p>
              </div>
              <button
                onClick={() => onPayComanda(comanda)}
                disabled={disabled}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Receber
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};