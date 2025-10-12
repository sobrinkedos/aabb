import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Printer } from 'lucide-react';
import { Order, MenuItem } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  menuItems: MenuItem[];
  hasMultipleOrders?: boolean;
  orderNumber?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  menuItems,
  hasMultipleOrders = false,
  orderNumber
}) => {
  const { updateOrderStatus } = useApp();

  // Debug: verificar dados dos itens
  console.log('OrderCard - Order:', order.id, {
    items: order.items,
    menuItemsCount: menuItems.length,
    firstMenuItem: menuItems[0]
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      default: return null;
    }
  };

  const nextStatus = getNextStatus(order.status);

  // Verificar se o pedido é de balcão (já pago)
  const isBalcaoOrder = (order: Order): boolean => {
    return order.id.startsWith('balcao-');
  };

  // Verificar se o pedido é de comanda (aguardando pagamento)
  const isComandaOrder = (order: Order): boolean => {
    return order.id.startsWith('comanda-');
  };

  // Função para imprimir o pedido
  const handlePrintOrder = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 18px;">PEDIDO #${orderNumber}</h2>
          <p style="margin: 5px 0; font-size: 14px;">${order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}</p>
          <p style="margin: 5px 0; font-size: 12px;">${format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ITENS:</h3>
          ${order.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      const itemName = menuItem?.name || item.menuItem?.name || `Item ${item.menuItemId.slice(-4)}`;
      return `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                <span>${item.quantity}x ${itemName}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `;
    }).join('')}
        </div>
        
        ${order.notes ? `
          <div style="margin-bottom: 15px; padding: 8px; background-color: #fff3cd; border: 1px solid #ffeaa7;">
            <strong style="font-size: 12px;">Observações:</strong>
            <p style="margin: 5px 0 0 0; font-size: 11px;">${order.notes}</p>
          </div>
        ` : ''}
        
        <div style="border-top: 2px solid #000; padding-top: 10px; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">TOTAL: R$ ${order.total.toFixed(2)}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Status: ${getStatusText(order.status)}</p>
          ${isBalcaoOrder(order) ? '<p style="margin: 5px 0 0 0; font-size: 12px; color: green; font-weight: bold;">✓ PAGO</p>' : ''}
          ${isComandaOrder(order) ? '<p style="margin: 5px 0 0 0; font-size: 12px; color: orange; font-weight: bold;">AGUARDA PAGAMENTO</p>' : ''}
        </div>
      </div>
    `;

    // Criar uma nova janela com tamanho específico
    const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
    
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pedido #${orderNumber}</title>
            <meta charset="utf-8">
            <style>
              body { 
                margin: 0; 
                font-family: Arial, sans-serif;
                background: white;
                color: black;
              }
              @media print {
                body { margin: 0; }
                @page { margin: 10mm; }
                .no-print { display: none; }
              }
              @media screen {
                body { padding: 20px; }
              }
              .print-buttons {
                text-align: center;
                margin-top: 20px;
                padding: 10px;
                border-top: 1px solid #ccc;
              }
              .btn {
                padding: 10px 20px;
                font-size: 14px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin: 0 5px;
                transition: background-color 0.3s;
              }
              .btn-primary {
                background: #007bff;
                color: white;
              }
              .btn-primary:hover {
                background: #0056b3;
              }
              .btn-secondary {
                background: #6c757d;
                color: white;
              }
              .btn-secondary:hover {
                background: #545b62;
              }
            </style>
          </head>
          <body>
            ${printContent}
            <div class="print-buttons no-print">
              <button class="btn btn-primary" onclick="printOrder()">
                🖨️ Imprimir
              </button>
              <button class="btn btn-secondary" onclick="window.close()">
                ✕ Fechar
              </button>
            </div>
            <script>
              function printOrder() {
                window.print();
              }
              
              // Aguardar carregamento completo
              window.addEventListener('load', function() {
                // Focar na janela
                window.focus();
                
                // Auto-print após um pequeno delay (opcional)
                // setTimeout(function() {
                //   window.print();
                // }, 500);
              });
              
              // Detectar quando a impressão foi concluída ou cancelada
              window.addEventListener('afterprint', function() {
                // Opcional: fechar automaticamente após impressão
                // setTimeout(function() {
                //   window.close();
                // }, 1000);
              });
              
              // Detectar tecla ESC para fechar
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                  window.close();
                }
              });
            </script>
          </body>
        </html>
      `;
      
      // Usar innerHTML ao invés de document.write (método mais moderno)
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Focar na nova janela
      printWindow.focus();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${hasMultipleOrders ? 'ring-2 ring-orange-300 ring-offset-2' : ''
        } ${isBalcaoOrder(order) ? 'border-green-400 bg-green-50 shadow-lg' : ''
        }`}
    >
      {/* Header do Card - Melhorado para telas menores */}
      <div className="mb-3">
        {/* Primeira linha: Mesa/Balcão e Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-800 text-sm sm:text-base">
              {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Botão de impressão */}
            <button
              onClick={handlePrintOrder}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Imprimir pedido"
            >
              <Printer size={16} />
            </button>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        {/* Segunda linha: Badges e indicadores */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {/* Badge do número do pedido */}
            {orderNumber && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                #{orderNumber}
              </span>
            )}

            {/* Indicador de status de pagamento */}
            {isBalcaoOrder(order) && (
              <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                ✓ PAGO
              </span>
            )}

            {isComandaOrder(order) && (
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                AGUARDA PAGTO
              </span>
            )}
          </div>

          {/* Horário do pedido */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>{format(order.createdAt, 'HH:mm', { locale: ptBR })}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          const itemName = menuItem?.name || item.menuItem?.name || `Item ${item.menuItemId.slice(-4)}`;

          return (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {itemName}
              </span>
              <span className="text-gray-800">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {order.notes && (
        <div className="mb-4 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-800">{order.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-end mb-3">
        <span className="font-bold text-gray-800 text-lg">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      {/* Botão de Ação Principal */}
      {nextStatus && (
        <button
          onClick={() => updateOrderStatus(order.id, nextStatus)}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${isBalcaoOrder(order)
            ? order.status === 'pending'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : order.status === 'preparing'
                ? 'bg-green-700 text-white hover:bg-green-800'
                : 'bg-green-800 text-white hover:bg-green-900'
            : isComandaOrder(order)
              ? order.status === 'pending'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : order.status === 'preparing'
                  ? 'bg-yellow-700 text-white hover:bg-yellow-800'
                  : 'bg-yellow-800 text-white hover:bg-yellow-900'
              : order.status === 'pending'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : order.status === 'preparing'
                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                  : 'bg-blue-800 text-white hover:bg-blue-900'
            }`}
        >
          {nextStatus === 'preparing' && 'Iniciar Preparo'}
          {nextStatus === 'ready' && 'Marcar como Pronto'}
          {nextStatus === 'delivered' && 'Marcar como Entregue'}
        </button>
      )}
    </motion.div>
  );
};

export default OrderCard;
