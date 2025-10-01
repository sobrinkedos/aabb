import React, { useState } from 'react';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useComandas } from '../../hooks/useComandas';

const ComandasPendentesPanel: React.FC = () => {
  const { comandas, finalizarComandasPagas } = useComandas();
  const [processando, setProcessando] = useState<string | null>(null);

  // Filtrar comandas pendentes de pagamento
  const comandasPendentes = comandas.filter(comanda => comanda.status === 'pending_payment');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleConfirmarPagamento = async (comanda: any) => {
    setProcessando(comanda.id);
    
    try {
      // Finalizar comanda como paga
      await finalizarComandasPagas([comanda.id], comanda.payment_method || 'dinheiro');
      
      console.log('Pagamento confirmado para comanda:', comanda.id);
      alert(`Pagamento confirmado!\n\nComanda: ${comanda.customer_name || 'Cliente'}\nTotal: ${formatCurrency(comanda.total || 0)}\nMétodo: ${comanda.payment_method || 'Não informado'}`);
      
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setProcessando(null);
    }
  };

  if (comandasPendentes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma Comanda Pendente
          </h3>
          <p className="text-gray-500">
            Todas as comandas foram pagas ou não há comandas no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Comandas Pendentes de Pagamento
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {comandasPendentes.length} comanda{comandasPendentes.length !== 1 ? 's' : ''} aguardando pagamento
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            <span className="text-lg font-semibold text-yellow-600">
              {formatCurrency(comandasPendentes.reduce((sum, c) => sum + (c.total || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Comandas */}
      <div className="divide-y divide-gray-200">
        {comandasPendentes.map((comanda) => (
          <div key={comanda.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      Mesa {(comanda as any).bar_tables?.number || 'N/A'}
                    </span>
                  </div>
                  {comanda.customer_name && (
                    <span className="text-sm text-gray-600">
                      • {comanda.customer_name}
                    </span>
                  )}
                  {comanda.people_count && (
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {comanda.people_count} pessoas
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Finalizada em:</span>
                    <br />
                    {comanda.updated_at ? formatDateTime(comanda.updated_at) : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Método de Pagamento:</span>
                    <br />
                    <span className="capitalize">
                      {comanda.payment_method?.replace('_', ' ') || 'Não informado'}
                    </span>
                  </div>
                </div>

                {/* Itens da Comanda */}
                {(comanda as any).comanda_items && (comanda as any).comanda_items.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 mb-2 block">
                      Itens ({(comanda as any).comanda_items.length}):
                    </span>
                    <div className="space-y-1">
                      {(comanda as any).comanda_items.map((item: any, index: number) => (
                        <div key={item.id || index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">{item.quantity}x</span>
                            <span className="text-gray-900">
                              {item.menu_items?.name || 'Item sem nome'}
                            </span>
                          </div>
                          <span className="text-gray-600">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="ml-6 flex flex-col items-end space-y-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(comanda.total || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Total da Comanda
                  </div>
                </div>

                <button
                  onClick={() => handleConfirmarPagamento(comanda)}
                  disabled={processando === comanda.id}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>
                    {processando === comanda.id ? 'Processando...' : 'Confirmar Pagamento'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer com Resumo */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>{comandasPendentes.length}</strong> comanda{comandasPendentes.length !== 1 ? 's' : ''} pendente{comandasPendentes.length !== 1 ? 's' : ''}
          </div>
          <div className="text-lg font-semibold text-green-600">
            Total: {formatCurrency(comandasPendentes.reduce((sum, c) => sum + (c.total || 0), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComandasPendentesPanel;