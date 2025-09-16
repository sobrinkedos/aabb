import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Users, 
  Receipt, 
  AlertTriangle,
  Plus,
  BarChart3,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ShoppingCart,
  Minus,
  ArrowRightLeft,
  Bell,
  ShoppingBag,
  Eye,
  X
} from 'lucide-react';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { useBalcaoOrders } from '../../../hooks/useBalcaoOrders';
import { useAuth } from '../../../contexts/AuthContext';
import { OpenCashModal } from './OpenCashModal';
import { CloseCashModal } from './CloseCashModal';
import CashWithdrawalModal from './CashWithdrawalModal';
import TreasuryTransferModal from './TreasuryTransferModal';
import TreasuryTransferReceipt from './TreasuryTransferReceipt';
import CashWithdrawalReceipt from './CashWithdrawalReceipt';
import DailyTransactions from './DailyTransactions';
import PaymentReceipt from '../../BarAttendance/components/PaymentReceipt';
import { PendingComandas } from './PendingComandas';
import { ProcessComandaPaymentModal } from '../../../components/cash/ProcessComandaPaymentModal';
import { useNavigate } from 'react-router-dom';
import { ComandaWithItems } from '../../../types/bar-attendance';
import { BalcaoOrderWithDetails } from '../../../types/balcao-orders';
import { formatCurrency, PAYMENT_METHOD_LABELS } from '../../../types/cash-management';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    currentSession,
    pendingComandas,
    todaysSummary,
    todaysTransactions,
    loading,
    error,
    openCashSession,
    closeCashSession,
    processComandaPayment,
    processCashWithdrawal,
    processTreasuryTransfer
  } = useCashManagement();

  const {
    pendingOrders: pendingBalcaoOrders,
    processPayment: processBalcaoPayment
  } = useBalcaoOrders();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCashWithdrawalModal, setShowCashWithdrawalModal] = useState(false);
  const [showTreasuryTransferModal, setShowTreasuryTransferModal] = useState(false);
  const [showTreasuryReceiptModal, setShowTreasuryReceiptModal] = useState(false);
  const [showCashWithdrawalReceiptModal, setShowCashWithdrawalReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BalcaoOrderWithDetails | null>(null);
  const [selectedComanda, setSelectedComanda] = useState<ComandaWithItems | null>(null);
  const [showComandaPaymentModal, setShowComandaPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'transferencia'>('dinheiro');
  const [processing, setProcessing] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<any>(null);
  const [lastTreasuryTransferData, setLastTreasuryTransferData] = useState<any>(null);
  const [lastCashWithdrawalData, setLastCashWithdrawalData] = useState<any>(null);
  const [showPendingAlert, setShowPendingAlert] = useState(true);
  const [isBlinking, setIsBlinking] = useState(false);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);

  // Função para processar pagamento de pedido de balcão
  const handleBalcaoPayment = async (order: BalcaoOrderWithDetails) => {
    if (!currentSession) {
      alert('É necessário ter uma sessão de caixa aberta para processar pagamentos.');
      return;
    }
    
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  // Função para abrir modal de pagamento de comanda
  const handleComandaPayment = (comanda: ComandaWithItems) => {
    if (!currentSession) {
      alert('É necessário ter uma sessão de caixa aberta para processar pagamentos.');
      return;
    }
    
    setSelectedComanda(comanda);
    setShowComandaPaymentModal(true);
  };

  // Função para processar pagamento de comanda
  const processComandaPaymentWithMethod = async (paymentMethod: string, observations?: string) => {
    if (!selectedComanda || !currentSession) return;
    
    try {
      setProcessing(true);
      await processComandaPayment({
        comanda_id: selectedComanda.id,
        payment_method: paymentMethod,
        amount: selectedComanda.total || 0,
        notes: observations
      });
      
      console.log('✅ Pagamento da comanda processado com sucesso');
      setShowComandaPaymentModal(false);
      setSelectedComanda(null);
    } catch (error) {
      console.error('❌ Erro ao processar pagamento da comanda:', error);
      alert('Erro ao processar pagamento da comanda');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder || !currentSession) return;

    setProcessing(true);
    try {
      await processBalcaoPayment({
        order_id: selectedOrder.id,
        payment_method: selectedPaymentMethod,
        cash_session_id: currentSession.id,
        amount_paid: selectedOrder.final_amount
      });

      // Preparar dados para o comprovante
      setLastPaymentData({
        order: selectedOrder,
        paymentMethod: selectedPaymentMethod,
        amountPaid: selectedOrder.final_amount,
        cashierName: user?.name || user?.email || 'Operador de Caixa',
        timestamp: new Date()
      });

      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Callback após impressão do comprovante
  const handleReceiptPrinted = () => {
    setShowReceiptModal(false);
    setLastPaymentData(null);
  };

  // Função para processar saída de dinheiro
  const handleCashWithdrawal = async (data: any) => {
    try {
      const withdrawalId = await processCashWithdrawal(data);
      
      // Preparar dados para o comprovante
      setLastCashWithdrawalData({
        withdrawalId,
        amount: data.amount,
        reason: data.reason,
        authorizedBy: data.authorized_by,
        recipient: data.recipient,
        purpose: data.purpose,
        cashierName: user?.name || user?.email || 'Operador de Caixa',
        timestamp: new Date(),
        sessionId: currentSession?.id || ''
      });
      
      setShowCashWithdrawalModal(false);
      setShowCashWithdrawalReceiptModal(true);
    } catch (error) {
      console.error('Erro ao processar saída de dinheiro:', error);
      alert('Erro ao processar saída de dinheiro. Tente novamente.');
    }
  };

  // Função para processar transferência para tesouraria
  const handleTreasuryTransfer = async (data: any) => {
    try {
      const transferId = await processTreasuryTransfer(data);
      
      // Preparar dados para o comprovante
      setLastTreasuryTransferData({
        transferId,
        amount: data.amount,
        transferDate: data.transfer_date,
        authorizedBy: data.authorized_by,
        treasuryReceiptNumber: data.treasury_receipt_number,
        notes: data.notes,
        cashierName: user?.name || user?.email || 'Operador de Caixa',
        timestamp: new Date(),
        sessionId: currentSession?.id || ''
      });
      
      setShowTreasuryTransferModal(false);
      setShowTreasuryReceiptModal(true);
    } catch (error) {
      console.error('Erro ao processar transferência:', error);
      alert('Erro ao processar transferência. Tente novamente.');
    }
  };

  // Função para adicionar saída de dinheiro no DailyTransactions
  const handleAddWithdrawal = () => {
    setShowCashWithdrawalModal(true);
  };

  // Função para exportar relatório
  const handleExportReport = () => {
    console.log('Exportando relatório...');
    // TODO: Implementar exportação
  };

  // Callback após impressão do comprovante de tesouraria
  const handleTreasuryReceiptPrinted = () => {
    setShowTreasuryReceiptModal(false);
    setLastTreasuryTransferData(null);
  };

  // Callback após impressão do comprovante de saída de dinheiro
  const handleCashWithdrawalReceiptPrinted = () => {
    setShowCashWithdrawalReceiptModal(false);
    setLastCashWithdrawalData(null);
  };

  // Efeito para detectar novos pedidos e ativar animação
  useEffect(() => {
    const currentPendingCount = pendingBalcaoOrders.length;
    
    if (currentPendingCount > previousPendingCount && previousPendingCount > 0) {
      // Novo pedido detectado - ativar alerta piscante
      setIsBlinking(true);
      setShowPendingAlert(true);
      
      // Parar de piscar após 10 segundos
      const blinkTimer = setTimeout(() => {
        setIsBlinking(false);
      }, 10000);
      
      return () => clearTimeout(blinkTimer);
    }
    
    setPreviousPendingCount(currentPendingCount);
  }, [pendingBalcaoOrders.length, previousPendingCount]);

  // Função para mostrar seção de pedidos pendentes
  const handleViewPendingOrders = () => {
    setShowPendingAlert(false);
    setIsBlinking(false);
    // Scroll para a seção de pedidos pendentes
    const pendingOrdersSection = document.getElementById('pending-orders-section');
    if (pendingOrdersSection) {
      pendingOrdersSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Função para dispensar o alerta
  const handleDismissAlert = () => {
    setShowPendingAlert(false);
    setIsBlinking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Erro no Sistema</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Caixa</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/cash/movement')}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Movimento</span>
          </button>
          {!currentSession ? (
            <button
              onClick={() => setShowOpenModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Abrir Caixa</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowTreasuryTransferModal(true)}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
              >
                <ArrowRightLeft className="h-5 w-5" />
                <span>Transferência</span>
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
              >
                <DollarSign className="h-5 w-5" />
                <span>Fechar Caixa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status do Caixa */}
      {currentSession ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Caixa Aberto</h3>
                <p className="text-green-600">
                  Aberto às {new Date(currentSession.opened_at).toLocaleTimeString('pt-BR')}
                </p>
                <p className="text-sm text-green-600">
                  Valor inicial: {formatCurrency(currentSession.opening_amount)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(currentSession.expected_amount)}
              </p>
              <p className="text-sm text-green-600">Valor esperado</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Caixa Fechado</h3>
              <p className="text-yellow-600">
                É necessário abrir o caixa para processar pagamentos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Pedidos Pendentes - Primeira Dobra */}
      {pendingBalcaoOrders.length > 0 && showPendingAlert && (
        <div className={`mb-8 transition-all duration-300 ${
          isBlinking ? 'animate-pulse' : ''
        }`}>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  isBlinking ? 'bg-red-200 animate-bounce' : 'bg-orange-100'
                }`}>
                  <div className="relative">
                    <ShoppingBag className={`h-8 w-8 ${
                      isBlinking ? 'text-red-600' : 'text-orange-600'
                    }`} />
                    {pendingBalcaoOrders.length > 0 && (
                      <div className={`absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        isBlinking ? 'bg-red-500 animate-ping' : 'bg-orange-500'
                      }`}>
                        {pendingBalcaoOrders.length}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className={`text-xl font-bold flex items-center space-x-2 ${
                    isBlinking ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    <span>Pedidos Aguardando Pagamento</span>
                    {isBlinking && (
                      <Bell className="h-5 w-5 text-red-600 animate-bounce" />
                    )}
                  </h3>
                  <p className={`${
                    isBlinking ? 'text-red-600' : 'text-orange-600'
                  } font-medium`}>
                    {pendingBalcaoOrders.length} {pendingBalcaoOrders.length === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                  </p>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Valor total: <span className="font-semibold text-green-600">
                      {formatCurrency(pendingBalcaoOrders.reduce((total, order) => total + order.final_amount, 0))}
                    </span></p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleViewPendingOrders}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 ${
                    isBlinking 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-105' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  <Eye className="h-5 w-5" />
                  <span>Ver Pedidos</span>
                </button>
                
                <button
                  onClick={handleDismissAlert}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Dispensar alerta"
                  aria-label="Dispensar alerta"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Preview dos últimos 3 pedidos */}
            <div className="mt-4 pt-4 border-t border-orange-200">
              <h4 className="text-sm font-medium text-orange-800 mb-3">Pedidos mais recentes:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pendingBalcaoOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-3 border border-orange-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900">
                        #{order.order_number.toString().padStart(4, '0')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {order.customer_name && (
                      <p className="text-sm text-gray-700 mb-1 truncate">{order.customer_name}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'itens'}
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(order.final_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {pendingBalcaoOrders.length > 3 && (
                <p className="text-sm text-orange-600 mt-3 text-center">
                  +{pendingBalcaoOrders.length - 3} pedidos adicionais aguardando pagamento
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Vendas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(todaysSummary.total_sales)}
              </p>
            </div>
          </div>
        </div>

        {/* Total de Transações */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transações</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaysSummary.total_transactions}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(todaysSummary.avg_ticket)}
              </p>
            </div>
          </div>
        </div>

        {/* Comandas Pendentes */}
        <div className={`bg-white rounded-lg shadow p-6 relative ${
          pendingComandas.length > 0 ? 'ring-2 ring-orange-300' : ''
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${
              pendingComandas.length > 0 ? 'bg-orange-100' : 'bg-orange-100'
            }`}>
              <Clock className={`h-6 w-6 ${
                pendingComandas.length > 0 ? 'text-orange-600' : 'text-orange-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comandas Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingComandas.length}
              </p>
            </div>
            {pendingComandas.length > 0 && (
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold animate-pulse">
                  !
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendas por Método de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Método de Pagamento</h3>
          <div className="space-y-4">
            {todaysSummary.by_payment_method.map((method) => {
              const Icon = method.payment_method === 'dinheiro' ? Banknote :
                          method.payment_method === 'pix' ? Smartphone : CreditCard;
              
              return (
                <div key={method.payment_method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {PAYMENT_METHOD_LABELS[method.payment_method]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(method.amount)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {method.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance por Funcionário */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Funcionário</h3>
          <div className="space-y-4">
            {todaysSummary.by_employee.map((employee) => (
              <div key={employee.employee_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {employee.employee_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {employee.transaction_count} transações
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(employee.total_sales)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Média: {formatCurrency(employee.avg_ticket)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movimentação Diária */}
      <DailyTransactions 
        transactions={todaysTransactions}
        onAddWithdrawal={handleAddWithdrawal}
        onExportReport={handleExportReport}
        isCashSessionOpen={currentSession?.status === 'open'}
      />

      {/* Comandas Pendentes */}
      <div className="mb-8">
        <PendingComandas
          comandas={pendingComandas}
          onPayComanda={handleComandaPayment}
          disabled={!currentSession || processing}
        />
      </div>

      {/* Pedidos de Balcão Pendentes */}
      <div id="pending-orders-section" className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Pedidos de Balcão Aguardando Pagamento</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pendingBalcaoOrders.length}
          </span>
        </div>
        
        {pendingBalcaoOrders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Todos os pedidos foram pagos!</p>
            <p className="text-gray-500 text-sm mt-1">Não há pedidos de balcão aguardando pagamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBalcaoOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      #{order.order_number.toString().padStart(4, '0')}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Aguardando Pagamento
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Informações do Cliente */}
                {order.customer_name && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    {order.customer_phone && (
                      <p className="text-xs text-gray-600">{order.customer_phone}</p>
                    )}
                  </div>
                )}

                {/* Resumo dos Itens */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'itens'}
                  </p>
                  <div className="space-y-1">
                    {(order.items || []).slice(0, 3).map((item, index) => (
                      <p key={index} className="text-xs text-gray-600">
                        {item.quantity}x {item.menu_item?.name || 'Item'}
                      </p>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-xs text-gray-500 italic">
                        +{(order.items || []).length - 3} mais...
                      </p>
                    )}
                  </div>
                </div>

                {/* Observações */}
                {order.customer_notes && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded border">
                    <p className="text-xs text-yellow-800">{order.customer_notes}</p>
                  </div>
                )}

                {/* Total e Botão de Pagamento */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(order.final_amount)}
                  </span>
                  <button
                    onClick={() => handleBalcaoPayment(order)}
                    disabled={!currentSession}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Receber Pagamento
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <OpenCashModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onOpenCash={openCashSession}
      />

      {currentSession && (
        <CloseCashModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          session={currentSession}
          onCloseCash={closeCashSession}
        />
      )}

      {/* Modal de Pagamento de Pedido de Balcão */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Receber Pagamento - #{selectedOrder.order_number.toString().padStart(4, '0')}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Resumo do Pedido */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Pedido</h4>
              {selectedOrder.customer_name && (
                <p className="text-sm text-gray-600 mb-2">
                  Cliente: {selectedOrder.customer_name}
                </p>
              )}
              <div className="space-y-1 text-sm">
                {(selectedOrder.items || []).map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.menu_item?.name}</span>
                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                {(selectedOrder.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-green-600 border-t pt-1">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount || 0)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.final_amount)}</span>
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'transferencia')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Método de pagamento"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={processing || !currentSession}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Processar e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Processamento de Pagamento de Comanda */}
      <ProcessComandaPaymentModal
        isOpen={showComandaPaymentModal}
        comanda={selectedComanda}
        onClose={() => {
          setShowComandaPaymentModal(false);
          setSelectedComanda(null);
        }}
        onConfirm={processComandaPaymentWithMethod}
        loading={processing}
      />

      {/* Modal de Comprovante de Pagamento */}
      {showReceiptModal && lastPaymentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Pagamento Processado!</h3>
              </div>
              <button
                onClick={handleReceiptPrinted}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar modal de comprovante"
                aria-label="Fechar modal de comprovante"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="mb-6 text-center">
              <p className="text-gray-600 mb-2">
                Pagamento de #{lastPaymentData.order.order_number.toString().padStart(4, '0')} processado com sucesso!
              </p>
              <p className="text-sm text-green-600 font-medium">
                Comprovante de pagamento gerado
              </p>
            </div>

            <div className="mb-6">
              <PaymentReceipt
                receiptData={lastPaymentData}
                onPrint={handleReceiptPrinted}
              />
            </div>

            <div className="flex space-x-3 sticky bottom-0 bg-white pt-4 border-t">
              <button
                onClick={handleReceiptPrinted}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  // Reimprimir comprovante
                  console.log('Reimprimindo comprovante de pagamento...');
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                <span>Reimprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Saída de Dinheiro */}
      <CashWithdrawalModal
        isOpen={showCashWithdrawalModal}
        onClose={() => setShowCashWithdrawalModal(false)}
        onProcessWithdrawal={handleCashWithdrawal}
        currentCashBalance={currentSession?.expected_amount || 0}
        loading={processing}
      />

      {/* Modal de Transferência para Tesouraria */}
      <TreasuryTransferModal
        isOpen={showTreasuryTransferModal}
        onClose={() => setShowTreasuryTransferModal(false)}
        onProcessTransfer={handleTreasuryTransfer}
        currentCashBalance={currentSession?.expected_amount || 0}
        loading={processing}
      />

      {/* Modal de Comprovante de Transferência */}
      {showTreasuryReceiptModal && lastTreasuryTransferData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Transferência Processada!</h3>
              </div>
              <button
                onClick={handleTreasuryReceiptPrinted}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Fechar modal de comprovante"
                aria-label="Fechar modal de comprovante"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4 text-center">
                Transferência para tesouraria processada com sucesso!
              </p>
              <p className="text-sm text-green-600 font-medium text-center mb-4">
                Comprovante de transferência gerado
              </p>

              <TreasuryTransferReceipt
                receiptData={lastTreasuryTransferData}
                onPrint={handleTreasuryReceiptPrinted}
              />
            </div>

            <div className="flex space-x-3 p-6 pt-0 border-t border-gray-200">
              <button
                onClick={handleTreasuryReceiptPrinted}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante de Saída de Dinheiro */}
      {showCashWithdrawalReceiptModal && lastCashWithdrawalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Saída de Dinheiro Processada!</h3>
              </div>
              <button
                onClick={handleCashWithdrawalReceiptPrinted}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Fechar modal de comprovante"
                aria-label="Fechar modal de comprovante"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4 text-center">
                Saída de dinheiro processada com sucesso!
              </p>
              <p className="text-sm text-orange-600 font-medium text-center mb-4">
                Comprovante gerado para assinatura
              </p>

              <CashWithdrawalReceipt
                receiptData={lastCashWithdrawalData}
                onPrint={handleCashWithdrawalReceiptPrinted}
              />
            </div>

            <div className="flex space-x-3 p-6 pt-0 border-t border-gray-200">
              <button
                onClick={handleCashWithdrawalReceiptPrinted}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante para Pedidos Pendentes */}
      {pendingBalcaoOrders.length > 0 && !showPendingAlert && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={handleViewPendingOrders}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center space-x-2 animate-bounce"
            title={`${pendingBalcaoOrders.length} pedidos aguardando pagamento`}
          >
            <div className="relative">
              <ShoppingBag className="h-6 w-6" />
              <div className="absolute -top-2 -right-2 h-5 w-5 bg-white rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-xs font-bold">
                  {pendingBalcaoOrders.length}
                </span>
              </div>
            </div>
            <span className="hidden sm:block font-medium">Pedidos Pendentes</span>
          </button>
        </div>
      )}
    </div>
  );
};