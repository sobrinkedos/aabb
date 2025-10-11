import React from 'react';
import { BalcaoOrderWithDetails, PaymentMethod } from '../../../types/balcao-orders';
import { formatCurrency } from '../../../types/cash-management';

interface PaymentReceiptData {
  order: BalcaoOrderWithDetails;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  cashierName: string;
  referenceNumber?: string;
  timestamp: Date;
}

interface PaymentReceiptProps {
  receiptData: PaymentReceiptData;
  onPrint?: () => void;
}

/**
 * Componente para impressão do comprovante de pagamento (segunda impressão no caixa)
 * Contém informações completas do pedido e dados do pagamento processado
 * É o comprovante final que o cliente recebe
 */
const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ receiptData, onPrint }) => {
  const { order, paymentMethod, amountPaid, cashierName, referenceNumber, timestamp } = receiptData;

  // Função para traduzir método de pagamento
  const getPaymentMethodName = (method: PaymentMethod): string => {
    const methods: Record<PaymentMethod, string> = {
      'dinheiro': 'Dinheiro',
      'cartao_debito': 'Cartão Débito',
      'cartao_credito': 'Cartão Crédito',
      'pix': 'PIX',
      'transferencia': 'Transferência'
    };
    return methods[method] || method;
  };

  // Função para imprimir
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePaymentHTML());
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  // Gerar HTML do comprovante de pagamento
  const generatePaymentHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante - ${order.order_number.toString().padStart(4, '0')}</title>
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
          .payment-status {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
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
          <div class="section-title">COMPROVANTE DE PAGAMENTO</div>
          <div>Pedido: #${order.order_number.toString().padStart(4, '0')}</div>
          <div>Data Pedido: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
          <div>Hora Pedido: ${new Date(order.created_at).toLocaleTimeString('pt-BR')}</div>
          <div>Data Pagto: ${timestamp.toLocaleDateString('pt-BR')}</div>
          <div>Hora Pagto: ${timestamp.toLocaleTimeString('pt-BR')}</div>
          <div>Atendente: ${order.employee_name || 'N/A'}</div>
          <div>Caixa: ${cashierName}</div>
          ${order.customer_name ? `<div>Cliente: ${order.customer_name}</div>` : ''}
          ${order.customer_phone ? `<div>Telefone: ${order.customer_phone}</div>` : ''}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">ITENS VENDIDOS</div>
          ${order.items?.map(item => `
            <div class="item-row">
              <div class="item-name">${item.menu_item?.name || 'Item'}</div>
              <div class="item-qty">${item.quantity}x</div>
              <div class="item-price">R$ ${(item.unit_price * item.quantity).toFixed(2)}</div>
            </div>
            ${item.notes ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">Obs: ${item.notes}</div>` : ''}
          `).join('') || '<div>Nenhum item encontrado</div>'}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="item-row">
            <div>Subtotal:</div>
            <div>R$ ${order.total_amount.toFixed(2)}</div>
          </div>
          ${order.discount_amount && order.discount_amount > 0 ? `
            <div class="item-row" style="color: #666;">
              <div>Desconto:</div>
              <div>-R$ ${order.discount_amount.toFixed(2)}</div>
            </div>
          ` : ''}
          <div class="total-row">
            <div>TOTAL PAGO:</div>
            <div>R$ ${amountPaid.toFixed(2)}</div>
          </div>
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">INFORMAÇÕES DE PAGAMENTO</div>
          <div>Forma de Pagamento: ${getPaymentMethodName(paymentMethod)}</div>
          <div>Valor Pago: R$ ${amountPaid.toFixed(2)}</div>
          ${referenceNumber ? `<div>Ref. Transação: ${referenceNumber}</div>` : ''}
          <div>Status: PAGO ✓</div>
        </div>

        ${order.notes ? `
          <div class="dashed-line"></div>
          <div class="section">
            <div class="section-title">OBSERVAÇÕES DO PEDIDO</div>
            <div>${order.notes}</div>
          </div>
        ` : ''}

        ${order.customer_notes ? `
          <div class="dashed-line"></div>
          <div class="section">
            <div class="section-title">OBSERVAÇÕES DO CLIENTE</div>
            <div>${order.customer_notes}</div>
          </div>
        ` : ''}

        <div class="payment-status">
          <div>✅ PAGAMENTO APROVADO ✅</div>
          <div style="margin-top: 5px; font-size: 10px;">
            Transação processada com sucesso
          </div>
        </div>

        <div class="footer">
          <div>Obrigado pela preferência!</div>
          <div>Volte sempre!</div>
          <div style="margin-top: 10px;">
            ${order.customer_name ? `Pontos acumulados: +${Math.floor(order.final_amount / 10)}` : 'Cadastre-se e ganhe pontos!'}
          </div>
          <div style="margin-top: 10px;">
            ID: ${order.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="payment-receipt">
      {/* Preview do comprovante de pagamento */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-sm mx-auto font-mono text-sm">
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="font-bold text-lg">CLUBE SOCIAL</div>
          <div className="text-xs text-gray-600">Bar & Restaurante</div>
          <div className="text-xs text-gray-600">CNPJ: 12.345.678/0001-90</div>
        </div>

        <div className="mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">COMPROVANTE DE PAGAMENTO</div>
          <div>Pedido: #{order.order_number.toString().padStart(4, '0')}</div>
          <div>Data Pedido: {new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
          <div>Hora Pedido: {new Date(order.created_at).toLocaleTimeString('pt-BR')}</div>
          <div>Data Pagto: {timestamp.toLocaleDateString('pt-BR')}</div>
          <div>Hora Pagto: {timestamp.toLocaleTimeString('pt-BR')}</div>
          <div>Atendente: {order.employee_name || 'N/A'}</div>
          <div>Caixa: {cashierName}</div>
          {order.customer_name && <div>Cliente: {order.customer_name}</div>}
          {order.customer_phone && <div>Telefone: {order.customer_phone}</div>}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">ITENS VENDIDOS</div>
          {order.items?.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <span className="flex-1">{item.menu_item?.name || 'Item'}</span>
                <span className="w-8 text-center">{item.quantity}x</span>
                <span className="w-16 text-right">R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
              {item.notes && (
                <div className="text-xs text-gray-600 ml-2">Obs: {item.notes}</div>
              )}
            </div>
          )) || (
            <div className="text-gray-500 text-center py-2">Nenhum item encontrado</div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>R$ {order.total_amount.toFixed(2)}</span>
          </div>
          {order.discount_amount && order.discount_amount > 0 && (
            <div className="flex justify-between mb-1 text-gray-600">
              <span>Desconto:</span>
              <span>-R$ {order.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-black pt-2">
            <span>TOTAL PAGO:</span>
            <span>R$ {amountPaid.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">INFORMAÇÕES DE PAGAMENTO</div>
          <div>Forma: {getPaymentMethodName(paymentMethod)}</div>
          <div>Valor Pago: {formatCurrency(amountPaid)}</div>
          {referenceNumber && <div>Ref.: {referenceNumber}</div>}
          <div>Status: PAGO ✓</div>
        </div>

        {order.notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2">OBSERVAÇÕES DO PEDIDO</div>
            <div>{order.notes}</div>
          </div>
        )}

        {order.customer_notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2">OBSERVAÇÕES DO CLIENTE</div>
            <div>{order.customer_notes}</div>
          </div>
        )}

        <div className="bg-green-100 border border-green-300 text-green-800 p-3 text-center font-bold mb-4">
          <div>✅ PAGAMENTO APROVADO ✅</div>
          <div className="text-xs mt-1">
            Transação processada com sucesso
          </div>
        </div>

        <div className="text-center border-t-2 border-black pt-3 text-xs">
          <div>Obrigado pela preferência!</div>
          <div>Volte sempre!</div>
          <div className="mt-2">
            {order.customer_name 
              ? `Pontos acumulados: +${Math.floor(order.final_amount / 10)}`
              : 'Cadastre-se e ganhe pontos!'
            }
          </div>
          <div className="mt-2">
            ID: {order.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Botão de impressão */}
      <div className="text-center mt-4">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Imprimir Comprovante
        </button>
      </div>
    </div>
  );
};

export default PaymentReceipt;