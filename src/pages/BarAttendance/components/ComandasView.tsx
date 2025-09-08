import React, { useState, useMemo, useEffect } from 'react';
import { Eye, ArrowLeft, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';
import NovaComandaModal from './NovaComandaModal';
import ComandaDetailsModal from './ComandaDetailsModal';
import ComandaAlerts from './ComandaAlerts';
import ComandaFilters from './ComandaFilters';
import { useComandas } from '../../../hooks/useComandas';
import { useBarTables } from '../../../hooks/useBarTables';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { useBarAttendance } from '../../../hooks/useBarAttendance';
import { Comanda, ComandaStatus } from '../../../types/bar-attendance';
import { MenuItem } from '../../../types';

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
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list'); // Novo estado para controlar a visualização
  
  // Estados para o carrinho de itens (modo detalhes)
  const [cart, setCart] = useState<Array<{menu_item_id: string; name: string; price: number; quantity: number; notes?: string}>>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTermItems, setSearchTermItems] = useState('');
  
  // Hook para menu items
  const { menuItems, loading: menuLoading } = useMenuItems(true);
  const { adicionarItemComanda } = useBarAttendance();

  const handleNewComanda = () => {
    setShowNovaComandaModal(true);
  };

  const handleComandaClick = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setViewMode('details'); // Mudar para visualização de detalhes inline
  };

  const handleBackToList = () => {
    setSelectedComanda(null);
    setViewMode('list');
    setCart([]); // Limpar carrinho ao voltar
  };

  // Funções do carrinho
  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menu_item_id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.menu_item_id !== menuItemId));
    } else {
      setCart(prev => prev.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleAddItemsToComanda = async () => {
    if (!selectedComanda || cart.length === 0) return;

    try {
      for (const item of cart) {
        await adicionarItemComanda(selectedComanda.id, {
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        });
      }
      setCart([]);
      refetch(); // Atualizar lista de comandas
    } catch (error) {
      console.error('Erro ao adicionar itens à comanda:', error);
    }
  };

  // Atualizar comanda selecionada quando as comandas mudarem
  useEffect(() => {
    if (selectedComanda && comandas.length > 0) {
      const updatedComanda = comandas.find(c => c.id === selectedComanda.id);
      if (updatedComanda && JSON.stringify(updatedComanda) !== JSON.stringify(selectedComanda)) {
        setSelectedComanda(updatedComanda);
      }
    }
  }, [comandas, selectedComanda]);

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

  // Filtrar itens do menu para a visualização de detalhes
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTermItems.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const categories = [...new Set(menuItems.map(item => item.category))];

  // Renderização condicional baseada no modo de visualização
  if (viewMode === 'details' && selectedComanda) {
    return (
      <div className="comanda-details-container">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Voltar para Comandas</span>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Mesa {selectedComanda.table?.number || 'N/A'} - {selectedComanda.customer_name || 'Cliente'}
              </h2>
              <p className="text-sm text-gray-600">
                Aberta em {formatDate(selectedComanda.opened_at)} • Total: R$ {selectedComanda.total?.toFixed(2) || '0,00'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu de itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Itens</h3>
              
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTermItems}
                  onChange={(e) => setSearchTermItems(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Grid de itens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-900 mb-2">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        R$ {(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center mb-4">
                <ShoppingCart size={20} className="mr-2" />
                <h3 className="text-lg font-medium">Itens Selecionados</h3>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum item selecionado</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.menu_item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {getTotalPrice().toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={handleAddItemsToComanda}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Adicionar à Comanda
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        onComandaUpdated={refetch}
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