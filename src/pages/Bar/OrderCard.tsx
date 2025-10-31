import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, MapPin, Printer } from 'lucide-react';
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
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map((item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      const itemName = menuItem?.name || item.menuItem?.name || `Item ${item.menuItemId.slice(-4)}`;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}x</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${itemName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido ${orderNumber || order.id.slice(-6)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 20px;
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background-color: #f0f0f0;
              padding: 10px;
              text-align: left;
              border-bottom: 2px solid #333;
            }
            .total {
              text-align: right;
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 2px solid #333;
            }
            .notes {
              background-color: #fff9e6;
              padding: 10px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
            .status {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-weight: bold;
            }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-preparing { background-color: #cfe2ff; color: #084298; }
            .status-ready { background-color: #d1e7dd; color: #0f5132; }
            .status-delivered { background-color: #e2e3e5; color: #41464b; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>ClubManager - Pedido</h1>
          <div class="header">
            <div class="info">
              <strong>${order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}</strong>
              <span>Pedido #${orderNumber || order.id.slice(-6)}</span>
            </div>
            <div class="info">
              <span>Data: ${format(order.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              <span class="status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            ${isBalcaoOrder(order) ? '<div style="color: green; font-weight: bold;">✓ PAGO</div>' : ''}
            ${isComandaOrder(order) ? '<div style="color: orange; font-weight: bold;">AGUARDANDO PAGAMENTO</div>' : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Item</th>
                <th style="text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          ${order.notes ? `<div class="notes"><strong>Observações:</strong><br>${order.notes}</div>` : ''}
          
          <div class="total">
            Total: R$ ${order.total.toFixed(2)}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
        hasMultipleOrders ? 'ring-2 ring-orange-300 ring-offset-2' : ''
      } ${
        isBalcaoOrder(order) ? 'border-green-400 bg-green-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-gray-400" />
          <span className="font-medium text-gray-800">
            {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'}
          </span>
          
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
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

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span>{format(order.createdAt, 'HH:mm', { locale: ptBR })}</span>
        </div>
        <span className="font-medium text-gray-800">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-2">
        {/* Botão de Imprimir */}
        <button
          onClick={handlePrint}
          className="w-full py-2 rounded-lg text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700 flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Imprimir Pedido
        </button>

        {/* Botão de Ação Principal */}
        {nextStatus && (
          <button
            onClick={() => updateOrderStatus(order.id, nextStatus)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              isBalcaoOrder(order)
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
      </div>
    </motion.div>
  );
};

export default OrderCard;
