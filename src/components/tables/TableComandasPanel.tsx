import React, { useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BarTable, Comanda } from '../../types/bar-attendance';
import { useComandas } from '../../hooks/useComandas';
import { useAuth } from '../../contexts/AuthContextSimple';

interface TableComandasPanelProps {
  table: BarTable;
  onClose: () => void;
  onCreateComanda?: (comanda: Comanda) => void;
}

const TableComandasPanel: React.FC<TableComandasPanelProps> = ({
  table,
  onClose,
  onCreateComanda
}) => {
  const { user } = useAuth();
  const { 
    getComandasByTableId, 
    getOpenComandasByTableId,
    createComandaForTable,
    closeComanda,
    deleteComanda,
    transferComandaToTable
  } = useComandas();
  
  const [customerName, setCustomerName] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const allComandas = getComandasByTableId(table.id);
  const openComandas = getOpenComandasByTableId(table.id);

  // Debug: verificar estrutura dos dados
  console.log('TableComandasPanel - Comandas da mesa:', table.id, allComandas);
  if (allComandas.length > 0) {
    console.log('Primeira comanda com itens:', allComandas[0]);
  }

  const handleCreateComanda = async () => {
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    try {
      setIsCreating(true);
      const newComanda = await createComandaForTable(
        table.id,
        user.id,
        customerName || undefined,
        peopleCount
      );
      
      console.log('Nova comanda criada:', newComanda);
      
      // Limpar formulário
      setCustomerName('');
      setPeopleCount(1);
      
      if (onCreateComanda) {
        onCreateComanda(newComanda);
      }
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
      alert('Erro ao criar comanda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseComanda = async (comandaId: string) => {
    const paymentMethod = prompt('Método de pagamento (opcional):');
    
    try {
      await closeComanda(comandaId, paymentMethod || undefined);
      console.log('Comanda fechada:', comandaId);
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      alert('Erro ao fechar comanda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleDeleteComanda = async (comandaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta comanda?')) {
      return;
    }

    try {
      await deleteComanda(comandaId);
      console.log('Comanda excluída:', comandaId);
    } catch (error) {
      console.error('Erro ao excluir comanda:', error);
      alert('Erro ao excluir comanda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'pending_payment':
        return 'Aguardando Pagamento';
      case 'closed':
        return 'Fechada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Indefinido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Comandas - Mesa {table.number}
              </h3>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>Capacidade: {table.capacity}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{allComandas.length} comandas</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{openComandas.length} abertas</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Nova Comanda */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-3">Nova Comanda</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente (opcional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pessoas
              </label>
              <input
                type="number"
                min="1"
                max={table.capacity}
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateComanda}
                disabled={isCreating}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{isCreating ? 'Criando...' : 'Criar Comanda'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Comandas */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {allComandas.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma comanda encontrada
              </h3>
              <p className="text-gray-500">
                Crie a primeira comanda para esta mesa
              </p>
            </div>
          ) : (
            <div className="px-6 py-4 space-y-3">
              {allComandas.map((comanda) => (
                <div
                  key={comanda.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comanda.status || 'open')}`}>
                          {getStatusText(comanda.status || 'open')}
                        </span>
                        {comanda.customer_name && (
                          <span className="text-sm font-medium text-gray-900">
                            {comanda.customer_name}
                          </span>
                        )}
                        {comanda.people_count && (
                          <span className="text-sm text-gray-600">
                            {comanda.people_count} pessoas
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Aberta em:</span>
                          <br />
                          {comanda.opened_at ? formatDateTime(comanda.opened_at) : 'N/A'}
                        </div>
                        {comanda.closed_at && (
                          <div>
                            <span className="font-medium">Fechada em:</span>
                            <br />
                            {formatDateTime(comanda.closed_at)}
                          </div>
                        )}
                      </div>

                      {comanda.total && (
                        <div className="mt-2 flex items-center space-x-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(comanda.total)}
                          </span>
                        </div>
                      )}

                      {/* Itens da Comanda */}
                      {(comanda as any).comanda_items && (comanda as any).comanda_items.length > 0 && (
                        <div className="mt-3 border-t pt-3">
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

                      {comanda.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Observações:</span> {comanda.notes}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {comanda.status === 'open' && (
                        <button
                          onClick={() => handleCloseComanda(comanda.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Fechar</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteComanda(comanda.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com Resumo */}
        {allComandas.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{allComandas.length}</div>
                <div className="text-gray-600">Total de Comandas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{openComandas.length}</div>
                <div className="text-gray-600">Comandas Abertas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">
                  {formatCurrency(
                    allComandas
                      .filter(c => c.status === 'closed')
                      .reduce((sum, c) => sum + (c.total || 0), 0)
                  )}
                </div>
                <div className="text-gray-600">Total Faturado</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableComandasPanel;