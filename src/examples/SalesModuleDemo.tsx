/**
 * Demonstração Completa do Módulo de Vendas
 * 
 * Integra todos os componentes implementados para teste prático
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Percent,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SalesInterface } from '../components/sales/SalesInterface';
import { CloseAccountModal } from '../components/sales/CloseAccountModal';
import { DiscountPanel } from '../components/sales/DiscountPanel';
import { useCloseAccountModal } from '../hooks/useCloseAccountModal';
import { CashManager } from '../services/cash-manager';
import { CommandManager } from '../services/command-manager';
import { 
  Command, 
  Order, 
  Discount, 
  UserProfile,
  CartItem,
  CloseAccountData,
  AccountClosingResult
} from '../types/sales-management';

const SalesModuleDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'commands' | 'orders'>('sales');
  const [currentUser] = useState<UserProfile>({
    id: 'user-demo',
    name: 'Operador Demo',
    role: 'supervisor',
    permissions: ['apply_discount_basic', 'apply_discount_advanced']
  });

  // Estados
  const [commands, setCommands] = useState<Command[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<Discount[]>([]);
  const [cashSession, setCashSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);

  // Managers
  const cashManager = CashManager.getInstance();
  const commandManager = CommandManager.getInstance();

  // Modal de fechamento
  const {
    isOpen: isCloseModalOpen,
    selectedComanda,
    loading: closeLoading,
    error: closeError,
    openModal: openCloseModal,
    closeModal: closeCloseModal,
    handleConfirm: handleCloseConfirm
  } = useCloseAccountModal({
    onSuccess: (result: AccountClosingResult) => {
      if (result.success) {
        addNotification('Conta fechada com sucesso!', 'success');
        loadCommands();
      }
    },
    onError: (error: Error) => {
      addNotification(error.message, 'error');
    }
  });

  useEffect(() => {
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      // Abrir sessão de caixa
      const session = await cashManager.openCash(200.00, currentUser.id);
      setCashSession(session);
      
      // Carregar comandas existentes
      await loadCommands();
      
      addNotification('Sistema inicializado com sucesso!', 'success');
    } catch (error) {
      addNotification('Erro ao inicializar sistema', 'error');
    }
  };

  const loadCommands = async () => {
    try {
      const openCommands = await commandManager.getOpenCommands();
      setCommands(openCommands);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
    }
  };

  const handleOrderCreated = (order: Order) => {
    setOrders(prev => [...prev, order]);
    addNotification(`Pedido ${order.number} criado com sucesso!`, 'success');
  };

  const handleCreateCommand = async () => {
    try {
      const tableNumber = Math.floor(Math.random() * 20) + 1;
      const command = await commandManager.createCommand({
        mesa: { numero: tableNumber },
        garcom_id: currentUser.id
      });
      
      setCommands(prev => [...prev, command]);
      addNotification(`Comanda criada para Mesa ${tableNumber}`, 'success');
    } catch (error) {
      addNotification('Erro ao criar comanda', 'error');
    }
  };

  const handleAddItemToCommand = async (commandId: string, item: CartItem) => {
    try {
      await commandManager.addItemToCommand(commandId, {
        produto_id: item.product_id,
        nome_produto: item.product_name,
        quantidade: item.quantity,
        preco_unitario: item.unit_price,
        observacoes: item.observations
      });
      
      await loadCommands();
      addNotification('Item adicionado à comanda', 'success');
    } catch (error) {
      addNotification('Erro ao adicionar item', 'error');
    }
  };

  const handleDiscountApplied = (discount: Discount) => {
    setAppliedDiscounts(prev => [...prev, discount]);
    addNotification('Desconto aplicado com sucesso!', 'success');
  };

  const handleDiscountRemoved = (discountId: string) => {
    setAppliedDiscounts(prev => prev.filter(d => d.id !== discountId));
    addNotification('Desconto removido', 'success');
  };

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleError = (error: string) => {
    addNotification(error, 'error');
  };

  // Simular carrinho com alguns itens para teste de desconto
  const mockCartItems: CartItem[] = [
    {
      id: 'cart-1',
      product_id: 'prod-001',
      product_name: 'Hambúrguer Clássico',
      quantity: 2,
      unit_price: 25.90,
      total_price: 51.80,
      category: 'food',
      observations: '',
      added_at: new Date().toISOString()
    },
    {
      id: 'cart-2',
      product_id: 'prod-003',
      product_name: 'Refrigerante Lata',
      quantity: 1,
      unit_price: 5.00,
      total_price: 5.00,
      category: 'beverages',
      observations: '',
      added_at: new Date().toISOString()
    }
  ];

  const mockOrderTotal = mockCartItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Módulo de Gestão de Vendas - Demo
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Usuário: {currentUser.name} ({currentUser.role})
                {cashSession && (
                  <span className="ml-4 text-green-600">
                    Caixa Aberto - Valor Inicial: R$ {cashSession.initial_amount.toFixed(2)}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleCreateCommand}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nova Comanda
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                notification.type === 'success' 
                  ? 'bg-green-100 border border-green-200 text-green-800'
                  : 'bg-red-100 border border-red-200 text-red-800'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'sales', label: 'Interface de Vendas', icon: ShoppingCart },
              { id: 'commands', label: 'Comandas', icon: Users },
              { id: 'orders', label: 'Pedidos', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interface de Vendas */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Interface de Vendas</h2>
                  </div>
                  <div className="h-96">
                    <SalesInterface
                      onOrderCreated={handleOrderCreated}
                      onError={handleError}
                      tableId="table-demo"
                    />
                  </div>
                </div>
              </div>

              {/* Painel de Descontos */}
              <div>
                <DiscountPanel
                  cartItems={mockCartItems}
                  orderTotal={mockOrderTotal}
                  currentUser={currentUser}
                  appliedDiscounts={appliedDiscounts}
                  onDiscountApplied={handleDiscountApplied}
                  onDiscountRemoved={handleDiscountRemoved}
                  onError={handleError}
                  memberId="member-001"
                  membershipType="gold"
                />
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Comandas Abertas ({commands.length})
                </h2>
              </div>

              {commands.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma comanda aberta</h3>
                  <p className="text-gray-500 mb-4">Crie uma nova comanda para começar</p>
                  <button
                    onClick={handleCreateCommand}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Comanda
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {commands.map(command => (
                    <div key={command.id} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {command.mesa?.numero ? `Mesa ${command.mesa.numero}` : 'Balcão'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Comanda #{command.id.slice(-6)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          command.status === 'open' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {command.status === 'open' ? 'Aberta' : 'Fechada'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Itens: </span>
                          <span className="font-medium">{command.itens?.length || 0}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Total: </span>
                          <span className="font-medium text-green-600">
                            R$ {command.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Aberta em: </span>
                          <span>{new Date(command.data_abertura).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>

                      {command.itens && command.itens.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Itens:</h4>
                          <div className="space-y-1">
                            {command.itens.slice(0, 3).map((item, index) => (
                              <div key={index} className="text-xs text-gray-600 flex justify-between">
                                <span>{item.quantidade}x {item.nome_produto}</span>
                                <span>R$ {item.preco_total.toFixed(2)}</span>
                              </div>
                            ))}
                            {command.itens.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{command.itens.length - 3} itens...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => openCloseModal(command)}
                          disabled={command.status !== 'open' || (command.itens?.length || 0) === 0}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          Fechar Conta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pedidos Recentes ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-500">Os pedidos criados aparecerão aqui</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pedido
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Itens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Criado em
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                #{order.number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.table_id && `Mesa ${order.table_id}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                order.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'pending' ? 'Pendente' :
                                 order.status === 'confirmed' ? 'Confirmado' :
                                 order.status === 'preparing' ? 'Preparando' :
                                 order.status === 'ready' ? 'Pronto' :
                                 order.status === 'delivered' ? 'Entregue' :
                                 'Cancelado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              R$ {order.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Fechamento de Conta */}
      {selectedComanda && (
        <CloseAccountModal
          isOpen={isCloseModalOpen}
          comanda={selectedComanda}
          onClose={closeCloseModal}
          onConfirm={handleCloseConfirm}
          loading={closeLoading}
        />
      )}
    </div>
  );
};

export { SalesModuleDemo };