import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  AlertTriangle, 
  Star,
  CheckCircle,
  ArrowUp,
  Timer,
  Bell,
  BellRing,
  X
} from 'lucide-react';
import { useOrderPriority } from '../../../hooks/useOrderPriority';
import { useComandas } from '../../../hooks/useComandas';
import { ComandaItemWithMenu, PriorityLevel } from '../../../types/bar-attendance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderQueueProps {
  onUpdateItemStatus: (itemId: string, status: string) => void;
}

const OrderQueue: React.FC<OrderQueueProps> = ({ onUpdateItemStatus }) => {
  const {
    orderQueue,
    loading,
    error,
    markItemAsPriority,
    updateItemStatus,
    getItemPriority,
    getTimerStatus,
    formatRemainingTime,
    getPriorityStats,
    refreshQueue,
    dismissAlert,
    clearAllAlerts,
    alerts,
    getPriorityLabel,
    getPriorityColor
  } = useOrderPriority();

  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedOrderForPriority, setSelectedOrderForPriority] = useState<string | null>(null);

  // Usar os dados diretamente do hook useOrderPriority
  const activeOrders = orderQueue;







  // Atualizar status do item
  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      if (onUpdateItemStatus) {
        await onUpdateItemStatus(itemId, newStatus);
      } else {
        await updateItemStatus(itemId, newStatus);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Marcar como prioritário
  const handleMarkAsPriority = async (itemId: string, isPriority: boolean) => {
    try {
      await markItemAsPriority(itemId, isPriority);
      setSelectedOrderForPriority(null);
    } catch (error) {
      console.error('Erro ao marcar prioridade:', error);
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'preparing':
        return <Timer className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'preparing':
        return 'text-blue-600 bg-blue-100';
      case 'ready':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      <AnimatePresence>
        {showAlerts && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BellRing className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">
                  Alertas ({alerts.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-red-600 hover:text-red-800"
                title="Fechar alertas"
                aria-label="Fechar alertas"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-white p-3 rounded border"
                >
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{alert.message}</p>
                    <p className="text-xs text-red-600">
                      {format(alert.timestamp, 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                    title="Reconhecer alerta"
                    aria-label="Reconhecer alerta"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header da Fila */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fila de Pedidos</h2>
          <p className="text-gray-600">
            {activeOrders.length} itens na fila, ordenados por prioridade
          </p>
        </div>
        {alerts.length > 0 && !showAlerts && (
          <button
            onClick={() => setShowAlerts(true)}
            className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
            title="Mostrar alertas"
            aria-label="Mostrar alertas"
          >
            <Bell className="h-4 w-4" />
            <span>{alerts.length} alertas</span>
          </button>
        )}
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {activeOrders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum pedido na fila</p>
          </div>
        ) : (
          activeOrders.map((item: any, index: number) => {

            const timerStatus = getTimerStatus(item);
            const priority = getItemPriority(item);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  priority?.isManuallyPrioritized 
                    ? 'border-red-500' 
                    : priority?.level === 'high' 
                      ? 'border-orange-500'
                      : priority?.level === 'medium'
                        ? 'border-yellow-500'
                        : 'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Cabeçalho do Item */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.menu_items?.name || 'Item sem nome'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          x{item.quantity}
                        </span>
                      </div>
                      
                      {priority?.isManuallyPrioritized && (
                        <Star className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    {/* Informações da Comanda */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      {item.table_number && (
                        <span>Mesa {item.table_number}</span>
                      )}
                      {item.customer_name && (
                        <span>Cliente: {item.customer_name}</span>
                      )}
                      <span>
                        Pedido às {format(new Date(item.added_at || ''), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>

                    {/* Prioridade e Timer */}
                    <div className="flex items-center space-x-4 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        getPriorityColor(priority?.level || 'low')
                      }`}>
                        {getPriorityLabel(priority?.level || 'low')}
                      </span>
                      
                      <span className="text-sm text-gray-600">
                        Tempo estimado: {priority?.estimatedTime || 0}min
                      </span>
                      
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                        timerStatus === 'overdue' 
                          ? 'bg-red-100 text-red-800'
                          : timerStatus === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        <Timer className="h-3 w-3" />
                        <span>{formatRemainingTime(item)}</span>
                        {timerStatus === 'overdue' && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                      </div>
                    </div>

                    {/* Status Atual */}
                    <div className="flex items-center space-x-2">
                      <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusColor(item.status || 'pending')
                      }`}>
                        {getStatusIcon(item.status || 'pending')}
                        <span>{getStatusLabel(item.status || 'pending')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Botão de Prioridade */}
                    <button
                      onClick={() => setSelectedOrderForPriority(item.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
                      title="Marcar como prioritário"
                      aria-label="Marcar como prioritário"
                    >
                      <ArrowUp className="h-3 w-3" />
                      <span className="text-xs">Priorizar</span>
                    </button>

                    {/* Botões de Status */}
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'preparing')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}
                    
                    {item.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'ready')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Pronto
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal de Priorização */}
      {selectedOrderForPriority && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Definir Prioridade</h3>
            <div className="space-y-3">
              {(['urgent', 'high', 'medium', 'low'] as PriorityLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => handleMarkAsPriority(selectedOrderForPriority || '', true)}
                  className={`w-full p-3 rounded border-2 text-left transition-colors ${
                    getPriorityColor(level)
                  } hover:opacity-80`}
                >
                  <div className="font-medium">{getPriorityLabel(level)}</div>
                  <div className="text-sm opacity-75">
                    {level === 'urgent' && 'Para pedidos que precisam ser feitos imediatamente'}
                    {level === 'high' && 'Para pedidos importantes com prazo apertado'}
                    {level === 'medium' && 'Para pedidos com prioridade normal'}
                    {level === 'low' && 'Para pedidos que podem aguardar'}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => setSelectedOrderForPriority(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderQueue;