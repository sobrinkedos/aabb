import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { formatCurrency, PaymentMethod } from '../../../types/cash-management';
import { getTodayString } from '../../../utils/date-helpers';

export const CashReports: React.FC = () => {
  const { getDailySummary, todaysSummary, loading } = useCashManagement();
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  useEffect(() => {
    // Carregar dados do dia selecionado
    const loadData = async () => {
      if (selectedDate) {
        await getDailySummary(new Date(selectedDate));
      }
    };
    loadData();
  }, [selectedDate, getDailySummary]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios de Caixa</h1>
        
        <div className="flex space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todaysSummary.total_sales)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transações</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todaysSummary.total_transactions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todaysSummary.avg_ticket)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sessões</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todaysSummary.total_sessions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendas por Método de Pagamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Vendas por Método de Pagamento
            </h3>
            <div className="space-y-4">
              {todaysSummary.by_payment_method.map((method) => (
                <div key={method.payment_method} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">{method.payment_method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(method.amount)}</p>
                    <p className="text-sm text-gray-500">{method.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance por Funcionário */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance por Funcionário
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Funcionário</th>
                    <th className="text-right py-2">Vendas</th>
                    <th className="text-right py-2">Transações</th>
                    <th className="text-right py-2">Ticket Médio</th>
                    <th className="text-right py-2">Discrepância</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysSummary.by_employee.map((emp) => (
                    <tr key={emp.employee_id} className="border-b">
                      <td className="py-2">{emp.employee_name}</td>
                      <td className="text-right py-2">{formatCurrency(emp.total_sales)}</td>
                      <td className="text-right py-2">{emp.transaction_count}</td>
                      <td className="text-right py-2">{formatCurrency(emp.avg_ticket)}</td>
                      <td className={`text-right py-2 ${emp.cash_discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(emp.cash_discrepancy)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};