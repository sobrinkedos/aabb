import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  User,
  Receipt,
  Filter,
  Download,
  Plus,
  Minus,
  ArrowRightLeft
} from 'lucide-react';
import { 
  formatCurrency, 
  TRANSACTION_TYPE_LABELS, 
  PAYMENT_METHOD_LABELS,
  CashTransactionWithDetails,
  TransactionType,
  PaymentMethod
} from '../../../types/cash-management';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getComandaNumber } from '../../../utils/comanda-formatter';

interface DailyTransactionsProps {
  transactions: CashTransactionWithDetails[];
  onAddWithdrawal: () => void;
  onExportReport: () => void;
}

const DailyTransactions: React.FC<DailyTransactionsProps> = ({
  transactions,
  onAddWithdrawal,
  onExportReport
}) => {
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | 'all'>('all');

  // Identificar tipo real da transação baseado nas notas (para contornar limitação do banco)
  const getRealTransactionType = (transaction: CashTransactionWithDetails): TransactionType => {
    if (transaction.notes?.includes('[SAÍDA]')) {
      return 'cash_withdrawal';
    }
    if (transaction.notes?.includes('[TRANSFERÊNCIA TESOURARIA]')) {
      return 'treasury_transfer';
    }
    return transaction.transaction_type;
  };

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const realType = getRealTransactionType(transaction);
    const matchesType = filterType === 'all' || realType === filterType;
    const matchesPayment = filterPayment === 'all' || transaction.payment_method === filterPayment;
    return matchesType && matchesPayment;
  });

  // Calcular totais (considerando tipos reais)
  const totals = {
    entradas: transactions
      .filter(t => {
        const realType = getRealTransactionType(t);
        return ['sale', 'adjustment'].includes(realType) && t.amount > 0;
      })
      .reduce((sum, t) => sum + t.amount, 0),
    saidas: transactions
      .filter(t => {
        const realType = getRealTransactionType(t);
        return ['refund', 'cash_withdrawal', 'treasury_transfer'].includes(realType) || 
               (realType === 'adjustment' && t.amount < 0);
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    saldo: 0
  };
  totals.saldo = totals.entradas - totals.saidas;

  // Ícone por tipo de transação
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'sale': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'refund': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment': return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'cash_withdrawal': return <Minus className="h-4 w-4 text-orange-600" />;
      case 'treasury_transfer': return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  // Cor por tipo de transação
  const getTransactionColor = (type: TransactionType, amount: number) => {
    if (type === 'sale' || (type === 'adjustment' && amount > 0)) {
      return 'text-green-600';
    } else if (['refund', 'cash_withdrawal', 'treasury_transfer'].includes(type) || (type === 'adjustment' && amount < 0)) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Movimentação do Dia</h3>
          <p className="text-sm text-gray-600">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onAddWithdrawal}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2 text-sm"
          >
            <Minus className="h-4 w-4" />
            <span>Saída de Dinheiro</span>
          </button>
          <button
            onClick={onExportReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Entradas</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.entradas)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Saídas</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totals.saidas)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`border rounded-lg p-4 ${
            totals.saldo >= 0 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                totals.saldo >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}>
                Saldo
              </p>
              <p className={`text-2xl font-bold ${
                totals.saldo >= 0 ? 'text-blue-900' : 'text-orange-900'
              }`}>
                {formatCurrency(Math.abs(totals.saldo))}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${
              totals.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`} />
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            title="Filtrar por tipo de transação"
            aria-label="Filtro por tipo de transação"
          >
            <option value="all">Todos os Tipos</option>
            <option value="sale">Vendas</option>
            <option value="refund">Estornos</option>
            <option value="adjustment">Ajustes</option>
            <option value="cash_withdrawal">Saídas de Dinheiro</option>
            <option value="treasury_transfer">Transferências</option>
          </select>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as PaymentMethod | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            title="Filtrar por método de pagamento"
            aria-label="Filtro por método de pagamento"
          >
            <option value="all">Todos os Métodos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="pix">PIX</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {filteredTransactions.length} de {transactions.length} transações
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma transação encontrada</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const realType = getRealTransactionType(transaction);
            return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getTransactionIcon(realType)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {TRANSACTION_TYPE_LABELS[realType] || 'Transação'}
                    {transaction.comanda && (
                      <span className="ml-2 text-blue-600">
                        - Comanda #{getComandaNumber(transaction.comanda.id)}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(transaction.processed_at), 'HH:mm', { locale: ptBR })}</span>
                    <span>•</span>
                    <span>{PAYMENT_METHOD_LABELS[transaction.payment_method]}</span>
                    {transaction.comanda?.customer_name && (
                      <>
                        <span>•</span>
                        <span>{transaction.comanda.customer_name}</span>
                      </>
                    )}
                    {transaction.comanda?.table_number && (
                      <>
                        <span>•</span>
                        <span>Mesa {transaction.comanda.table_number}</span>
                      </>
                    )}
                    {transaction.processed_by_employee && (
                      <>
                        <span>•</span>
                        <User className="h-3 w-3" />
                        <span>{transaction.processed_by_employee.name}</span>
                      </>
                    )}
                  </div>
                  {transaction.notes && (
                    <p className="text-xs text-gray-500 mt-1">{transaction.notes.replace(/\[[^\]]+\]\s*/g, '')}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className={`text-sm font-bold ${getTransactionColor(realType, transaction.amount)}`}>
                  {(['refund', 'cash_withdrawal', 'treasury_transfer'].includes(realType) || 
                    (realType === 'adjustment' && transaction.amount < 0)) ? '-' : '+'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </p>
                {transaction.reference_number && (
                  <p className="text-xs text-gray-500">Ref: {transaction.reference_number}</p>
                )}
              </div>
            </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DailyTransactions;