import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../types/cash-management';

interface DailyMovement {
  id: string;
  date: string;
  payment_method: string;
  opening_balance: number;
  total_sales: number;
  sales_count: number;
  total_refunds: number;
  refunds_count: number;
  total_transfers_out: number;
  closing_balance: number;
  sessions_count: number;
  transfers_count: number;
  total_to_cofre: number;
  total_to_banco: number;
  total_to_tesouraria: number;
}

interface TreasuryTransfer {
  id: string;
  transfer_date: string;
  transfer_time: string;
  amount: number;
  payment_method: string;
  destination: string;
  destination_account: string;
  receipt_number: string;
  status: string;
  transferred_by_name: string;
  received_by_name: string;
  authorized_by_name: string;
  notes: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
  pix: 'PIX',
  transferencia: 'Transferência'
};

const DESTINATION_LABELS: Record<string, string> = {
  cofre: 'Cofre',
  banco: 'Banco',
  tesouraria_central: 'Tesouraria Central'
};

export const DailyPaymentMovements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movements' | 'transfers'>('movements');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [movements, setMovements] = useState<DailyMovement[]>([]);
  const [transfers, setTransfers] = useState<TreasuryTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');

  useEffect(() => {
    loadData();
  }, [selectedDate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'movements') {
        await loadMovements();
      } else {
        await loadTransfers();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    const { data, error } = await supabase
      .from('v_daily_financial_summary')
      .select('*')
      .eq('date', selectedDate)
      .order('payment_method');

    if (error) {
      console.error('Erro ao carregar movimentações:', error);
      return;
    }

    setMovements(data || []);
  };

  const loadTransfers = async () => {
    const { data, error } = await supabase
      .from('v_treasury_transfers_history')
      .select('*')
      .eq('transfer_date', selectedDate)
      .order('transfer_time', { ascending: false });

    if (error) {
      console.error('Erro ao carregar transferências:', error);
      return;
    }

    setTransfers(data || []);
  };

  const getTotals = () => {
    return movements.reduce((acc, mov) => ({
      opening: acc.opening + mov.opening_balance,
      sales: acc.sales + mov.total_sales,
      transfers: acc.transfers + mov.total_transfers_out,
      closing: acc.closing + mov.closing_balance
    }), { opening: 0, sales: 0, transfers: 0, closing: 0 });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'dinheiro': return '💵';
      case 'cartao_debito': return '💳';
      case 'cartao_credito': return '💳';
      case 'pix': return '📱';
      case 'transferencia': return '🏦';
      default: return '💰';
    }
  };

  const exportToCSV = () => {
    if (activeTab === 'movements') {
      const csv = [
        ['Data', 'Forma de Pagamento', 'Saldo Inicial', 'Vendas', 'Transferências', 'Saldo Final'],
        ...movements.map(m => [
          m.date,
          PAYMENT_METHOD_LABELS[m.payment_method],
          m.opening_balance,
          m.total_sales,
          m.total_transfers_out,
          m.closing_balance
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimentacoes_${selectedDate}.csv`;
      a.click();
    } else {
      const csv = [
        ['Data', 'Hora', 'Valor', 'Forma', 'Destino', 'Transferido por', 'Recebido por'],
        ...transfers.map(t => [
          t.transfer_date,
          new Date(t.transfer_time).toLocaleTimeString('pt-BR'),
          t.amount,
          PAYMENT_METHOD_LABELS[t.payment_method],
          DESTINATION_LABELS[t.destination],
          t.transferred_by_name,
          t.received_by_name
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transferencias_${selectedDate}.csv`;
      a.click();
    }
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Movimentação Diária</h2>
          <p className="text-sm text-gray-500">Controle de pagamentos e transferências</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setDateRange('today');
                setSelectedDate(new Date().toISOString().split('T')[0]);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'today'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => {
                setDateRange('week');
                const date = new Date();
                date.setDate(date.getDate() - 7);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'week'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Última Semana
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Saldo Inicial</span>
            <Wallet className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.opening)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Vendas</span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.sales)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Transferências</span>
            <ArrowUpRight className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.transfers)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Saldo Final</span>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(totals.closing)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveTab('movements')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'movements'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Movimentações por Forma de Pagamento
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'transfers'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Transferências para Tesouraria
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : activeTab === 'movements' ? (
            <div className="space-y-4">
              {movements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma movimentação encontrada para esta data</p>
                </div>
              ) : (
                movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getPaymentMethodIcon(movement.payment_method)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {PAYMENT_METHOD_LABELS[movement.payment_method]}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {movement.sales_count} vendas • {movement.sessions_count} sessões
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Saldo Final</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(movement.closing_balance)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Saldo Inicial</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(movement.opening_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Vendas</p>
                        <p className="font-medium text-green-600">
                          +{formatCurrency(movement.total_sales)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Transferências</p>
                        <p className="font-medium text-orange-600">
                          -{formatCurrency(movement.total_transfers_out)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Distribuição</p>
                        <div className="text-xs space-y-1">
                          {movement.total_to_cofre > 0 && (
                            <p>Cofre: {formatCurrency(movement.total_to_cofre)}</p>
                          )}
                          {movement.total_to_banco > 0 && (
                            <p>Banco: {formatCurrency(movement.total_to_banco)}</p>
                          )}
                          {movement.total_to_tesouraria > 0 && (
                            <p>Tesouraria: {formatCurrency(movement.total_to_tesouraria)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma transferência encontrada para esta data</p>
                </div>
              ) : (
                transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {formatCurrency(transfer.amount)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {PAYMENT_METHOD_LABELS[transfer.payment_method]} → {DESTINATION_LABELS[transfer.destination]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(transfer.transfer_time).toLocaleTimeString('pt-BR')}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          transfer.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transfer.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transfer.status === 'completed' ? 'Concluída' : 
                           transfer.status === 'pending' ? 'Pendente' : 'Cancelada'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-3">
                      <div>
                        <p className="text-gray-500 mb-1">Transferido por</p>
                        <p className="font-medium text-gray-900">{transfer.transferred_by_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Recebido por</p>
                        <p className="font-medium text-gray-900">{transfer.received_by_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Comprovante</p>
                        <p className="font-medium text-gray-900">{transfer.receipt_number || '-'}</p>
                      </div>
                    </div>

                    {transfer.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{transfer.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
