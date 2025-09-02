import React, { useState } from 'react';
import NovaComandaModal from './NovaComandaModal';
import { useComandas } from '../../../hooks/useComandas';

const ComandasView: React.FC = () => {
  const { comandas, loading } = useComandas();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);

  const handleNewComanda = () => {
    setShowNovaComandaModal(true);
  };

  const filteredComandas = comandas.filter(comanda => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      comanda.customer_name?.toLowerCase().includes(searchLower) ||
      comanda.table?.number?.toLowerCase().includes(searchLower) ||
      comanda.employee?.name?.toLowerCase().includes(searchLower)
    );
  });

  const openComandas = filteredComandas.filter(c => c.status === 'open');
  const pendingPaymentComandas = filteredComandas.filter(c => c.status === 'pending_payment');
  const overdueComandas = filteredComandas.filter(c => {
    if (c.status !== 'open') return false;
    const openedAt = new Date(c.opened_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 2; // Considera atrasado após 2 horas
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberta';
      case 'pending_payment': return 'Aguardando Pagamento';
      case 'closed': return 'Fechada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="comandas-container">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Comandas Abertas</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por mesa, cliente ou funcionário..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              onClick={handleNewComanda}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Nova Comanda
            </button>
          </div>
        </div>
        
        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{openComandas.length}</div>
            <div className="text-sm text-gray-600">Comandas Abertas</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{pendingPaymentComandas.length}</div>
            <div className="text-sm text-gray-600">Aguardando Pagamento</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{overdueComandas.length}</div>
            <div className="text-sm text-gray-600">Com Atraso</div>
          </div>
        </div>

        {/* Lista de comandas */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Carregando comandas...</span>
            </div>
          ) : filteredComandas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? `Nenhuma comanda encontrada para "${searchTerm}"` : 'Nenhuma comanda encontrada'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aberta em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pessoas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComandas.map(comanda => (
                    <tr key={comanda.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comanda.table?.number || 'Balcão'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comanda.customer?.name || comanda.customer_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comanda.employee?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comanda.status)}`}>
                          {getStatusLabel(comanda.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        R$ {comanda.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(comanda.opened_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comanda.people_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <NovaComandaModal 
        isOpen={showNovaComandaModal}
        onClose={() => setShowNovaComandaModal(false)}
      />
    </div>
  );
};

export default ComandasView;