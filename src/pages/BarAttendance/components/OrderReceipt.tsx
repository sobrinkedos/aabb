import React from 'react';
import { CreateBalcaoOrderData } from '../../../types/balcao-orders';

interface OrderItem {
  menu_item_id: string;
  name: string; // Nome do item para exibição
  quantity: number;
  unit_price: number;
  notes?: string;
}

interface OrderReceiptData {
  orderId: string;
  orderNumber: number;
  orderData: CreateBalcaoOrderData;
  orderItems: OrderItem[]; // Itens com nomes para exibição
  timestamp: Date;
  employeeName: string;
}

interface OrderReceiptProps {
  receiptData: OrderReceiptData;
  onPrint?: () => void;
}

/**
 * Componente para impressão do pedido (primeira impressão no balcão)
 * Contém apenas informações do pedido, sem dados de pagamento
 * O cliente leva este comprovante para o caixa
 */
const OrderReceipt: React.FC<OrderReceiptProps> = ({ receiptData, onPrint }) => {
  const { orderId, orderNumber, orderData, orderItems, timestamp, employeeName } = receiptData;

  // Calcular total dos itens
  const subtotal = orderItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  const discountAmount = orderData.discount_amount || 0;
  const finalTotal = subtotal - discountAmount;

  // Função para imprimir
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateOrderHTML());
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  // Gerar HTML do pedido
  const generateOrderHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido - ${orderNumber.toString().padStart(4, '0')}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            width: 300px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 10px;
            color: #666;
          }
          .section {
            margin-bottom: 15px;
          }
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2px;
            margin-bottom: 5px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            width: 30px;
            text-align: center;
          }
          .item-price {
            width: 60px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
            font-size: 10px;
          }
          .dashed-line {
            border-top: 1px dashed #666;
            margin: 10px 0;
          }
          .payment-notice {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            margin: 15px 0;
          }
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CLUBE SOCIAL</div>
          <div class="subtitle">Bar & Restaurante</div>
          <div class="subtitle">CNPJ: 12.345.678/0001-90</div>
        </div>

        <div class="section">
          <div class="section-title">PEDIDO DE BALCÃO</div>
          <div>Pedido: #${orderNumber.toString().padStart(4, '0')}</div>
          <div>Data: ${timestamp.toLocaleDateString('pt-BR')}</div>
          <div>Hora: ${timestamp.toLocaleTimeString('pt-BR')}</div>
          <div>Atendente: ${employeeName}</div>
          ${orderData.customer_name ? `<div>Cliente: ${orderData.customer_name}</div>` : ''}
          ${orderData.customer_phone ? `<div>Telefone: ${orderData.customer_phone}</div>` : ''}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">ITENS DO PEDIDO</div>
          ${orderItems.map(item => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}x</div>
              <div class="item-price">R$ ${(item.unit_price * item.quantity).toFixed(2)}</div>
            </div>
            ${item.notes ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">Obs: ${item.notes}</div>` : ''}
          `).join('')}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="item-row">
            <div>Subtotal:</div>
            <div>R$ ${subtotal.toFixed(2)}</div>
          </div>
          ${discountAmount > 0 ? `
            <div class="item-row" style="color: #666;">
              <div>Desconto:</div>
              <div>-R$ ${discountAmount.toFixed(2)}</div>
            </div>
          ` : ''}
          <div class="total-row">
            <div>TOTAL A PAGAR:</div>
            <div>R$ ${finalTotal.toFixed(2)}</div>
          </div>
        </div>

        ${orderData.notes ? `
          <div class="dashed-line"></div>
          <div class="section">
            <div class="section-title">OBSERVAÇÕES</div>
            <div>${orderData.notes}</div>
          </div>
        ` : ''}

        ${orderData.customer_notes ? `
          <div class="dashed-line"></div>
          <div class="section">
            <div class="section-title">OBSERVAÇÕES DO CLIENTE</div>
            <div>${orderData.customer_notes}</div>
          </div>
        ` : ''}

        <div class="payment-notice">
          <div>🔸 PEDIDO AGUARDANDO PAGAMENTO 🔸</div>
          <div style="margin-top: 5px; font-size: 10px;">
            Dirija-se ao caixa para efetuar o pagamento
          </div>
        </div>

        <div class="footer">
          <div>CLUBE SOCIAL - Bar & Restaurante</div>
          <div style="margin-top: 5px;">
            Este não é um comprovante de pagamento
          </div>
          <div style="margin-top: 5px;">
            ID: ${orderId.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="order-receipt">
      {/* Preview do pedido */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-sm mx-auto font-mono text-sm">
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="font-bold text-lg">CLUBE SOCIAL</div>
          <div className="text-xs text-gray-600">Bar & Restaurante</div>
          <div className="text-xs text-gray-600">CNPJ: 12.345.678/0001-90</div>
        </div>

        <div className="mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">PEDIDO DE BALCÃO</div>
          <div>Pedido: #{orderNumber.toString().padStart(4, '0')}</div>
          <div>Data: {timestamp.toLocaleDateString('pt-BR')}</div>
          <div>Hora: {timestamp.toLocaleTimeString('pt-BR')}</div>
          <div>Atendente: {employeeName}</div>
          {orderData.customer_name && <div>Cliente: {orderData.customer_name}</div>}
          {orderData.customer_phone && <div>Telefone: {orderData.customer_phone}</div>}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">ITENS DO PEDIDO</div>
          {orderItems.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <span className="flex-1">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}x</span>
                <span className="w-16 text-right">R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
              {item.notes && (
                <div className="text-xs text-gray-600 ml-2">Obs: {item.notes}</div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between mb-1 text-gray-600">
              <span>Desconto:</span>
              <span>-R$ {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-black pt-2">
            <span>TOTAL A PAGAR:</span>
            <span>R$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {orderData.notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2">OBSERVAÇÕES</div>
            <div>{orderData.notes}</div>
          </div>
        )}

        {orderData.customer_notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2">OBSERVAÇÕES DO CLIENTE</div>
            <div>{orderData.customer_notes}</div>
          </div>
        )}

        <div className="bg-gray-100 border border-gray-300 p-3 text-center font-bold mb-4">
          <div>🔸 PEDIDO AGUARDANDO PAGAMENTO 🔸</div>
          <div className="text-xs mt-1">
            Dirija-se ao caixa para efetuar o pagamento
          </div>
        </div>

        <div className="text-center border-t-2 border-black pt-3 text-xs">
          <div>CLUBE SOCIAL - Bar & Restaurante</div>
          <div className="mt-1">
            Este não é um comprovante de pagamento
          </div>
          <div className="mt-1">
            ID: {orderId.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Botão de impressão */}
      <div className="text-center mt-4">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Imprimir Pedido
        </button>
      </div>
    </div>
  );
};

export default OrderReceipt;