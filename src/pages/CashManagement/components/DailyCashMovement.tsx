import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, TrendingUp, Clock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { CashSessionWithEmployee, CashTransactionWithDetails, formatCurrency, PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from '../../../types/cash-management';
import { getComandaNumber } from '../../../utils/comanda-formatter';

export const DailyCashMovement: React.FC = () => {
  const { getDailyCashMovement, loading: hookLoading } = useCashManagement();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<{
    sessions: CashSessionWithEmployee[];
    transactions: CashTransactionWithDetails[];
    summary: {
      opening_total: number;
      closing_total: number;
      sales_total: number;
      cash_sales: number;
      card_sales: number;
      pix_sales: number;
      adjustments: number;
      discrepancy_total: number;
      transaction_count: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controles de visibilidade das seções
  const [showSessions, setShowSessions] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);
  const [showSummary, setShowSummary] = useState(true);

  const loadData = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDailyCashMovement(date);
      setData(result);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar dados do movimento';
      setError(errorMessage);
      console.error('Erro ao carregar movimento diário:', err);
      // Definir dados padrão em caso de erro
      setData({
        sessions: [],
        transactions: [],
        summary: {
          opening_total: 0,
          closing_total: 0,
          sales_total: 0,
          cash_sales: 0,
          card_sales: 0,
          pix_sales: 0,
          adjustments: 0,
          discrepancy_total: 0,
          transaction_count: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR');
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aberto' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Fechado' },
      reconciled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reconciliado' }
    };
    
    const style = statusMap[status as keyof typeof statusMap] || statusMap.closed;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getTransactionTypeColor = (type: string) => {
    const colorMap = {
      sale: 'text-green-600',
      refund: 'text-red-600', 
      adjustment: 'text-blue-600',
      tip: 'text-purple-600'
    };
    
    return colorMap[type as keyof typeof colorMap] || 'text-gray-600';
  };

  const ToggleButton: React.FC<{ isVisible: boolean; onClick: () => void; title: string }> = ({ isVisible, onClick, title }) => (
    <button
      onClick={onClick}
      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
      title={isVisible ? `Ocultar ${title}` : `Mostrar ${title}`}
    >
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      <span>{isVisible ? 'Ocultar' : 'Mostrar'}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho com seletor de data */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Movimento do Caixa</h2>
            <p className="text-sm text-gray-600">Consulte o movimento detalhado por data</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            aria-label="Selecione a data"
          />
          
          <button
            onClick={() => loadData(selectedDate)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Carregando movimento...</span>
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Resumo do Dia */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Resumo do Dia</h3>
              <ToggleButton 
                isVisible={showSummary} 
                onClick={() => setShowSummary(!showSummary)} 
                title="resumo" 
              />
            </div>
            
            {showSummary && (
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-lg inline-flex">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">Vendas Totais</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.sales_total)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-lg inline-flex">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">Sessões</p>
                    <p className="text-2xl font-bold text-gray-900">{data.sessions.length}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-100 p-3 rounded-lg inline-flex">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">Transações</p>
                    <p className="text-2xl font-bold text-gray-900">{data.summary.transaction_count}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-yellow-100 p-3 rounded-lg inline-flex">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">Discrepâncias</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(Math.abs(data.summary.discrepancy_total))}</p>
                  </div>
                </div>
                
                {/* Resumo por método de pagamento */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Por Método de Pagamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Dinheiro</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(data.summary.cash_sales)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Cartões</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(data.summary.card_sales)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">PIX</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(data.summary.pix_sales)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Ajustes</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(data.summary.adjustments)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sessões do Dia */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Sessões do Dia ({data.sessions.length})</h3>
              <ToggleButton 
                isVisible={showSessions} 
                onClick={() => setShowSessions(!showSessions)} 
                title="sessões" 
              />
            </div>
            
            {showSessions && (
              <div className="p-6">
                {data.sessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma sessão encontrada para esta data</p>
                ) : (
                  <div className="space-y-4">
                    {data.sessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{session.employee?.name || 'Funcionário'}</p>
                              <p className="text-sm text-gray-600">Sessão #{session.id.slice(-8)}</p>
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Abertura</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(session.opening_amount)}</p>
                            <p className="text-xs text-gray-500">{formatTime(session.opened_at)}</p>
                          </div>
                          
                          {session.closed_at && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Fechamento</p>
                              <p className="text-lg font-bold text-red-600">{formatCurrency(session.closing_amount || 0)}</p>
                              <p className="text-xs text-gray-500">{formatTime(session.closed_at)}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm font-medium text-gray-600">Esperado</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(session.expected_amount)}</p>
                          </div>
                          
                          {session.cash_discrepancy !== null && session.cash_discrepancy !== undefined && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Discrepância</p>
                              <p className={`text-lg font-bold ${session.cash_discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(session.cash_discrepancy)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {(session.opening_notes || session.closing_notes) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {session.opening_notes && (
                              <p className="text-sm text-gray-600"><strong>Obs. Abertura:</strong> {session.opening_notes}</p>
                            )}
                            {session.closing_notes && (
                              <p className="text-sm text-gray-600"><strong>Obs. Fechamento:</strong> {session.closing_notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transações do Dia */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Transações do Dia ({data.transactions.length})</h3>
              <ToggleButton 
                isVisible={showTransactions} 
                onClick={() => setShowTransactions(!showTransactions)} 
                title="transações" 
              />
            </div>
            
            {showTransactions && (
              <div className="p-6">
                {data.transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada para esta data</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Horário</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Método</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente/Obs</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Funcionário</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {formatTime(transaction.processed_at)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                                {TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {PAYMENT_METHOD_LABELS[transaction.payment_method] || transaction.payment_method}
                            </td>
                            <td className={`py-3 px-4 text-right text-sm font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {transaction.comanda ? (
                                <div>
                                  <span className="font-medium text-blue-600">
                                    Comanda #{getComandaNumber(transaction.comanda.id)}
                                  </span>
                                  {transaction.comanda.customer_name && (
                                    <div className="text-xs text-gray-500">
                                      {transaction.comanda.customer_name}
                                    </div>
                                  )}
                                  {transaction.comanda.table_number && (
                                    <div className="text-xs text-gray-500">
                                      Mesa {transaction.comanda.table_number}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                transaction.customer_name || transaction.notes || '-'
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {transaction.processed_by_employee?.name || 'Funcionário'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};