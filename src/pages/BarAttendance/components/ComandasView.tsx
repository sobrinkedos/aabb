import React, { useState, useMemo, useEffect } from 'react';
import { Eye, ArrowLeft, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';
import NovaComandaModal from './NovaComandaModal';
import ComandaAlerts from './ComandaAlerts';
import ComandaFilters from './ComandaFilters';
import { useComandas } from '../../../hooks/useComandas';
import { useBarTables } from '../../../hooks/useBarTables';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { useBarAttendance } from '../../../hooks/useBarAttendance';
import { useApp } from '../../../contexts/AppContext';
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
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  
  // Estados para o carrinho de itens (modo detalhes)
  const [cart, setCart] = useState<Array<{menu_item_id: string; name: string; price: number; quantity: number; notes?: string}>>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTermItems, setSearchTermItems] = useState('');
  
  // Estados para feedback visual
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para fechamento de conta
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosingComanda, setIsClosingComanda] = useState(false);
  
  // Hook para menu items
  const { menuItems, loading: menuLoading } = useMenuItems(true);
  const { adicionarItemComanda, fecharComanda } = useBarAttendance();
  const { refreshBarOrders, refreshKitchenOrders } = useApp();

  // Atualizar comanda selecionada quando as comandas mudarem
  useEffect(() => {
    if (selectedComanda && comandas.length > 0) {
      const updatedComanda = comandas.find(c => c.id === selectedComanda.id);
      if (updatedComanda) {
        console.log('🔄 Atualizando comanda selecionada com novos dados:', updatedComanda);
        setSelectedComanda(updatedComanda);
      }
    }
  }, [comandas, selectedComanda?.id]);

  const handleNewComanda = () => {
    setShowNovaComandaModal(true);
  };

  const handleComandaClick = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedComanda(null);
    setCart([]);
  };

  // Funções do carrinho
  const addToCart = (item: MenuItem) => {
    console.log('Adicionando item ao carrinho:', item);
    const existingIndex = cart.findIndex(cartItem => cartItem.menu_item_id === item.id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
      console.log('Item já existia, quantidade atualizada:', newCart);
    } else {
      const newCartItem = {
        menu_item_id: item.id,
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        quantity: 1,
        notes: ''
      };
      const newCart = [...cart, newCartItem];
      setCart(newCart);
      console.log('Novo item adicionado ao carrinho:', newCart);
    }
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.menu_item_id !== menuItemId));
    } else {
      setCart(cart.map(item => 
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
    console.log('🔥 Botão clicado! Iniciando adição de itens à comanda');
    console.log('Comanda selecionada:', selectedComanda);
    console.log('Itens no carrinho:', cart);
    
    if (!selectedComanda) {
      console.error('❌ Nenhuma comanda selecionada');
      return;
    }
    
    if (cart.length === 0) {
      console.error('❌ Carrinho vazio');
      return;
    }
    
    setIsAddingItems(true);
    
    try {
      console.log('📦 Adicionando', cart.length, 'itens à comanda', selectedComanda.id);
      
      for (const item of cart) {
        console.log('➕ Adicionando item:', item);
        await adicionarItemComanda(
          selectedComanda.id,
          item.menu_item_id,
          item.quantity,
          item.notes || ''
        );
        console.log('✅ Item adicionado com sucesso');
      }
      
      console.log('🧹 Limpando carrinho');
      const itemCount = cart.length;
      setCart([]);
      
      console.log('🔄 Atualizando dados');
      await refetch();
      console.log('📋 Dados atualizados, comanda selecionada será atualizada automaticamente');
      
      // Forçar atualização dos pedidos do bar e cozinha
      console.log('🍺 Forçando atualização dos pedidos do bar e cozinha...');
      await refreshBarOrders();
      await refreshKitchenOrders();
      console.log('✅ Pedidos do bar e cozinha atualizados');
      
      // Mostrar mensagem de sucesso
      setSuccessMessage(`✅ ${itemCount} ${itemCount === 1 ? 'item adicionado' : 'itens adicionados'} com sucesso!`);
      setShowSuccessMessage(true);
      
      // Esconder mensagem após 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      console.log('🎉 Processo concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao adicionar itens à comanda:', error);
      setSuccessMessage('❌ Erro ao adicionar itens à comanda');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } finally {
      setIsAddingItems(false);
    }
  };

  const handleCloseComanda = async (metodoPagamento: string, observacoes?: string) => {
    if (!selectedComanda) return;
    
    setIsClosingComanda(true);
    
    try {
      console.log('💳 Fechando comanda:', selectedComanda.id, 'Método:', metodoPagamento);
      
      await fecharComanda(selectedComanda.id, metodoPagamento, observacoes);
      
      console.log('✅ Comanda fechada com sucesso');
      
      // Atualizar dados
      await refetch();
      await refreshBarOrders();
      await refreshKitchenOrders();
      
      // Voltar para a lista
      setViewMode('list');
      setSelectedComanda(null);
      setCart([]);
      setShowCloseModal(false);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage('✅ Comanda fechada e enviada para o caixa!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erro ao fechar comanda:', error);
      setSuccessMessage('❌ Erro ao fechar comanda');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } finally {
      setIsClosingComanda(false);
    }
  };

  const handleDismissAlert = (comandaId: string) => {
    setDismissedAlerts(prev => new Set([...prev, comandaId]));
  };

  // Filtros aplicados
  const filteredComandas = useMemo(() => {
    return comandas.filter(comanda => {
      // Filtro por termo de busca
      const matchesSearch = !searchTerm || 
        comanda.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comanda.table?.number?.toString().includes(searchTerm) ||
        comanda.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por status
      const matchesStatus = statusFilter === 'all' || comanda.status === statusFilter;

      // Filtro por funcionário
      const matchesEmployee = !employeeFilter || 
        comanda.employee_name?.toLowerCase().includes(employeeFilter.toLowerCase());

      // Filtro por mesa
      const matchesTable = !tableFilter || 
        comanda.table?.number?.toString().includes(tableFilter);

      // Filtro por tempo
      const matchesTime = (() => {
        if (timeFilter === 'all') return true;
        
        const openedAt = new Date(comanda.opened_at);
        const now = new Date();
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
        return true;
      })();

      return matchesSearch && matchesStatus && matchesEmployee && matchesTable && matchesTime;
    });
  }, [comandas, searchTerm, statusFilter, employeeFilter, tableFilter, timeFilter]);

  // Estatísticas das comandas
  const openComandas = filteredComandas.filter(c => c.status === 'open');
  const pendingPaymentComandas = filteredComandas.filter(c => c.status === 'pending_payment');
  const overdueComandas = filteredComandas.filter(c => {
    if (c.status !== 'open') return false;
    const openedAt = new Date(c.opened_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 2;
  });

  // Filtrar alertas não dispensados
  const alertComandas = overdueComandas.filter(c => !dismissedAlerts.has(c.id));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: ComandaStatus) => {
    switch (status) {
      case 'open': return 'Aberta';
      case 'pending_payment': return 'Aguardando Pagamento';
      case 'closed': return 'Fechada';
      default: return status;
    }
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  // Filtrar itens do menu para a visualização de detalhes
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTermItems.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  }); 
  // Debug: verificar estado do carrinho
  console.log('Estado atual do carrinho:', cart);
  console.log('Carrinho tem itens?', cart.length > 0);
  
  // Debug: verificar se botão deve aparecer
  console.log('🔍 Debug botão Fechar Conta:', {
    selectedComanda: !!selectedComanda,
    status: selectedComanda?.status,
    shouldShow: selectedComanda?.status === 'open'
  });

  // Renderização condicional baseada no modo de visualização
  if (viewMode === 'details' && selectedComanda) {
    return (
      <div className="comanda-details-container h-full flex flex-col bg-gray-50">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between p-6 border-b bg-white flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Voltar para Comandas</span>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Mesa {selectedComanda.table?.number || 'N/A'} - {selectedComanda.customer_name || 'Cliente'}
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-sm text-gray-600">
                  Aberta em {formatDate(selectedComanda.opened_at)}
                </p>
                <div className="bg-green-100 px-4 py-2 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-800">Total da Comanda:</span>
                    <span className="text-xl font-bold text-green-900">
                      R$ {selectedComanda.total?.toFixed(2) || '0,00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botão Fechar Conta */}
          {selectedComanda?.status === 'open' && (
            <button
              onClick={() => {
                console.log('🔴 Botão Fechar Conta clicado!');
                console.log('Comanda selecionada:', selectedComanda);
                console.log('Status da comanda:', selectedComanda?.status);
                setShowCloseModal(true);
                console.log('showCloseModal definido como true');
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <CreditCard size={20} />
              <span>Fechar Conta</span>
            </button>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Menu de Itens */}
          <div className="flex-1 flex flex-col p-6">
            {/* Filtros e Busca */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTermItems}
                  onChange={(e) => setSearchTermItems(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Grid de Itens */}
            <div className="flex-1 overflow-y-auto">
              {menuLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">Nenhum item encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMenuItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div className="text-gray-400 text-2xl" style={{ display: item.image_url ? 'none' : 'block' }}>
                          🍺
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          R$ {(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                          title={`Adicionar ${item.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> 
          {/* Carrinho de Pedido */}
          <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pedidos da Comanda</h3>
              </div>
            </div>

            {/* Itens Existentes da Comanda */}
            {selectedComanda?.items && selectedComanda.items.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="p-4 bg-blue-50">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    Itens já pedidos ({selectedComanda.items.length})
                    <span className="text-xs text-gray-500 ml-2">
                      (Debug: {new Date().toLocaleTimeString()})
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedComanda.items.map((item: any) => (
                      <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 text-sm">
                              {item.menu_item?.name || 'Item não encontrado'}
                            </h5>
                            <p className="text-xs text-gray-600">
                              R$ {item.price.toFixed(2)} cada
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'ready' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'pending' ? 'Pendente' :
                             item.status === 'preparing' ? 'Preparando' :
                             item.status === 'ready' ? 'Pronto' :
                             item.status === 'delivered' ? 'Entregue' : item.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Qtd: {item.quantity}</span>
                          <span className="font-medium text-green-600 text-sm">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-1">Obs: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Seção de Novos Itens */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Novos Itens ({cart.length})</h4>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            
            {/* Lista de Novos Itens - Expansível */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-4 h-full flex flex-col items-center justify-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum item novo selecionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.menu_item_id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-green-600">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Botão logo após os itens */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-green-800">Total dos Novos Itens:</span>
                        <span className="text-3xl font-bold text-green-900">
                          R$ {getTotalPrice().toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddItemsToComanda}
                      disabled={isAddingItems}
                      className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        isAddingItems 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isAddingItems ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Adicionando...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          <span>Adicionar à Comanda</span>
                        </>
                      )}
                    </button>

                    {/* Mensagem de Feedback */}
                    {showSuccessMessage && (
                      <div className={`mt-3 p-3 rounded-lg text-sm font-medium text-center transition-all duration-300 ${
                        successMessage.includes('❌') 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {successMessage}
                      </div>
                    )}
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
        employees={[]}
        tables={tables || []}
        onClearFilters={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setEmployeeFilter('');
          setTableFilter('');
          setTimeFilter('all');
        }}
      />

      {/* Header com estatísticas e botão nova comanda */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{openComandas.length}</div>
            <div className="text-sm text-gray-600">Abertas</div>
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
        
        <button 
          onClick={handleNewComanda}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + Nova Comanda
        </button>
      </div>

      {/* Lista de Comandas */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa/Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abertura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
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
                        {comanda.customer_name && (
                          <div className="text-xs text-gray-500">{comanda.customer_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            comanda.status === 'open' ? 'bg-green-100 text-green-800' :
                            comanda.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusLabel(comanda.status)}
                          </span>
                          {isOverdue && comanda.status === 'open' && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              ⚠️ Atrasada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {comanda.employee_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {formatDate(comanda.opened_at)}
                          <div className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                            {timeElapsed} decorrido
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        R$ {comanda.total?.toFixed(2) || '0,00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

      {/* Modal Nova Comanda */}
      <NovaComandaModal
        isOpen={showNovaComandaModal}
        onClose={() => setShowNovaComandaModal(false)}
        onComandaCreated={() => {
          refetch();
        }}
      />

      {/* Modal Fechar Conta */}
      {showCloseModal && selectedComanda && (
        <CloseComandaModal
          isOpen={showCloseModal}
          onClose={() => {
            console.log('🔴 Fechando modal');
            setShowCloseModal(false);
          }}
          comanda={selectedComanda}
          onConfirm={handleCloseComanda}
          isLoading={isClosingComanda}
        />
      )}

      {/* Debug do estado do modal */}
      {console.log('🔍 Debug modal:', { showCloseModal, selectedComanda: !!selectedComanda, viewMode })}

      {/* Mensagem de Feedback Global */}
      {showSuccessMessage && viewMode === 'list' && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            successMessage.includes('❌') 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {successMessage}
          </div>
        </div>
      )}
    </div>
  );

  function getTimeElapsed(openedAt: string) {
    const opened = new Date(openedAt);
    const now = new Date();
    const diffMs = now.getTime() - opened.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}min`;
    }
    return `${diffMinutes}min`;
  }
};

// Modal para fechar comanda
interface CloseComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: Comanda;
  onConfirm: (metodoPagamento: string, observacoes?: string) => void;
  isLoading: boolean;
}

const CloseComandaModal: React.FC<CloseComandaModalProps> = ({
  isOpen,
  onClose,
  comanda,
  onConfirm,
  isLoading
}) => {
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [observacoes, setObservacoes] = useState('');

  console.log('🔴 CloseComandaModal renderizado:', { isOpen, comanda: !!comanda, isLoading });

  if (!isOpen) {
    console.log('🔴 Modal não está aberto, retornando null');
    return null;
  }

  console.log('🔴 Modal está aberto, renderizando interface');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(metodoPagamento, observacoes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fechar Conta</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Mesa {comanda.table?.number || 'N/A'} - {comanda.customer_name || 'Cliente'}
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total da conta:</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {comanda.total?.toFixed(2) || '0,00'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={metodoPagamento}
                onChange={(e) => setMetodoPagamento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="vale_refeicao">Vale Refeição</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre o pagamento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Fechando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Fechar Conta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComandasView;