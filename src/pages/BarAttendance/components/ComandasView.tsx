import React, { useState, useMemo } from 'react';
import { Eye } from 'lucide-react';
import NovaComandaModal from './NovaComandaModal';
import ComandaDetailsModal from './ComandaDetailsModal';
import ComandaAlerts from './ComandaAlerts';
import ComandaFilters from './ComandaFilters';
import { useComandas } from '../../../hooks/useComandas';
import { useBarTables } from '../../../hooks/useBarTables';
import { Comanda, ComandaStatus } from '../../../types/bar-attendance';

const ComandasView: React.FC = () => {
  const { comandas, loading, refetch } = useComandas();
  const { tables } = useBarTables();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComandaStatus | 'all'>('all');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent' | 'overdue' | 'critical'>('all');
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const handleNewComanda = () => {
    setShowNovaComandaModal(true);
  };

  const handleComandaClick = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setShowDetailsModal(true);
  };

  const handleDismissAlert = (comandaId: string) => {
    setDismissedAlerts(prev => new Set([...prev, comandaId]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setEmployeeFilter('');
    setTableFilter('');
    setTimeFilter('all');
  };

  // Extrair funcionários únicos das comandas
  const employees = useMemo(() => {
    const uniqueEmployees = new Map();
    comandas.forEach(comanda => {
      if (comanda.employee?.id && comanda.employee?.name) {
        uniqueEmployees.set(comanda.employee.id, {
          id: comanda.employee.id,
          name: comanda.employee.name
        });
      }
    });
    return Array.from(uniqueEmployees.values());
  }, [comandas]);

  const filteredComandas = useMemo(() => {
    return comandas.filter(comanda => {
      // Filtro por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          comanda.customer_name?.toLowerCase().includes(searchLower) ||
          comanda.table?.number?.toLowerCase().includes(searchLower) ||
          comanda.employee?.name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por status
      if (statusFilter !== 'all' && comanda.status !== statusFilter) {
        return false;
      }

      // Filtro por funcionário
      if (employeeFilter && comanda.employee_id !== employeeFilter) {
        return false;
      }

      // Filtro por mesa
      if (tableFilter) {
        if (tableFilter === 'balcao' && comanda.table_id) {
          return false;
        } else if (tableFilter !== 'balcao' && comanda.table_id !== tableFilter) {
          return false;
        }
      }

      // Filtro por tempo
      if (timeFilter !== 'all') {
        const now = new Date();
        const openedAt = new Date(comanda.opened_at);
        const hoursDiff = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);

        switch (timeFilter) {
          case 'recent':
            if (hoursDiff >= 1) return false;
            break;
          case 'overdue':
            if (hoursDiff <= 2) return false;
            break;
          case 'critical':
            if (hoursDiff <= 4) return false;
            break;
        }
      }

      return true;
    });
  }, [comandas, searchTerm, statusFilter, employeeFilter, tableFilter, timeFilter]);

  const openComandas = filteredComandas.filter(c => c.status === 'open');
  const pendingPaymentComandas = filteredComandas.filter(c => c.status === 'pending_payment');
  const overdueComandas = filteredComandas.filter(c => {
    if (c.status !== 'open') return false;
    const openedAt = new Date(c.opened_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 2; // Considera atrasado após 2 horas
  });

  // Filtrar alertas não dispensados
  const alertComandas = overdueComandas.filter(c => !dismissedAlerts.has(c.id));

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
      {/* Alertas de Comandas com Tempo Excessivo */}
      <ComandaAlerts 
        comandas={alertComandas}
        onComandaClick={handleComandaClick}
        onDismissAlert={handleDismissAlert}
      />

      {/* Filtros */}
      <ComandaFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        employeeFilter={employeeFilter}
        onEmployeeFilterChange={setEmployeeFilter}
        tableFilter={tableFilter}
        onTableFilterChange={setTableFilter}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        employees={employees}
        tables={tables.map(t => ({ id: t.id, number: t.number }))}
        onClearFilters={clearFilters}
      />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Comandas {statusFilter !== 'all' ? `(${getStatusLabel(statusFilter)})` : ''}
          </h2>
          <button 
            onClick={handleNewComanda}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Nova Comanda
          </button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComandas.map(comanda => {
                    const timeElapsed = getTimeElapsed(comanda.opened_at);
                    const isOverdue = new Date().getTime() - new Date(comanda.opened_at).getTime() > (2 * 60 * 60 * 1000);
                    
                    return (
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
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comanda.status)}`}>
                              {getStatusLabel(comanda.status)}
                            </span>
                            {isOverdue && comanda.status === 'open' && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                ⚠️ Atrasada
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          R$ {comanda.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {formatDate(comanda.opened_at)}
                            <div className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              {timeElapsed} decorrido
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {comanda.people_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleComandaClick(comanda)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <NovaComandaModal 
        isOpen={showNovaComandaModal}
        onClose={() => setShowNovaComandaModal(false)}
        onComandaCreated={() => {
          refetch();
        }}
      />

      <ComandaDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedComanda(null);
        }}
        comanda={selectedComanda}
        onComandaUpdated={async () => {
          await refetch();
          // Atualizar a comanda selecionada com os dados mais recentes
          if (selectedComanda) {
            // Buscar a comanda atualizada após o refetch
            const updatedComanda = comandas.find(c => c.id === selectedComanda.id);
            if (updatedComanda) {
              setSelectedComanda(updatedComanda);
            }
          }
        }}
      />
    </div>
  );

  function getTimeElapsed(openedAt: string) {
    const opened = new Date(openedAt);
    const now = new Date();
    const diffMs = now.getTime() - opened.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }
};

export default ComandasView;