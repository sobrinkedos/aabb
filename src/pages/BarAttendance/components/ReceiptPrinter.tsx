import React from 'react';
import { BalcaoOrder } from '../../../types/bar-attendance';

interface ReceiptData {
  orderId: string;
  order: BalcaoOrder;
  timestamp: Date;
  employeeName: string;
}

interface ReceiptPrinterProps {
  receiptData: ReceiptData;
  onPrint?: () => void;
}

const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({ receiptData, onPrint }) => {
  const { orderId, order, timestamp, employeeName } = receiptData;

  // Função para imprimir (em produção seria integração com impressora)
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    
    // Simular impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  // Gerar HTML do comprovante
  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante - ${orderId}</title>
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
          <div class="section-title">COMPROVANTE DE VENDA</div>
          <div>Pedido: ${orderId.substring(0, 8).toUpperCase()}</div>
          <div>Data: ${timestamp.toLocaleDateString('pt-BR')}</div>
          <div>Hora: ${timestamp.toLocaleTimeString('pt-BR')}</div>
          <div>Atendente: ${employeeName}</div>
          ${order.customer ? `<div>Cliente: ${order.customer.name}</div>` : ''}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">ITENS</div>
          ${order.items.map(item => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}x</div>
              <div class="item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            ${item.notes ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">Obs: ${item.notes}</div>` : ''}
          `).join('')}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="item-row">
            <div>Subtotal:</div>
            <div>R$ ${order.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</div>
          </div>
          ${order.discount_amount && order.discount_amount > 0 ? `
            <div class="item-row" style="color: #666;">
              <div>Desconto Membro:</div>
              <div>-R$ ${order.discount_amount.toFixed(2)}</div>
            </div>
          ` : ''}
          <div class="total-row">
            <div>TOTAL:</div>
            <div>R$ ${order.total.toFixed(2)}</div>
          </div>
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">PAGAMENTO</div>
          <div>Forma: ${getPaymentMethodName(order.payment_method || 'dinheiro')}</div>
          <div>Status: PAGO</div>
        </div>

        ${order.notes ? `
          <div class="dashed-line"></div>
          <div class="section">
            <div class="section-title">OBSERVAÇÕES</div>
            <div>${order.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>Obrigado pela preferência!</div>
          <div>Volte sempre!</div>
          <div style="margin-top: 10px;">
            ${order.customer ? `Pontos acumulados: +${Math.floor(order.total / 10)}` : 'Cadastre-se e ganhe pontos!'}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'cartao_debito': 'Cartão Débito',
      'cartao_credito': 'Cartão Crédito',
      'pix': 'PIX'
    };
    return methods[method] || method;
  };

  return (
    <div className="receipt-printer">
      {/* Preview do comprovante */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-sm mx-auto font-mono text-sm">
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="font-bold text-lg">CLUBE SOCIAL</div>
          <div className="text-xs text-gray-600">Bar & Restaurante</div>
          <div className="text-xs text-gray-600">CNPJ: 12.345.678/0001-90</div>
        </div>

        <div className="mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">COMPROVANTE DE VENDA</div>
          <div>Pedido: {orderId.substring(0, 8).toUpperCase()}</div>
          <div>Data: {timestamp.toLocaleDateString('pt-BR')}</div>
          <div>Hora: {timestamp.toLocaleTimeString('pt-BR')}</div>
          <div>Atendente: {employeeName}</div>
          {order.customer && <div>Cliente: {order.customer.name}</div>}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">ITENS</div>
          {order.items.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <span className="flex-1">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}x</span>
                <span className="w-16 text-right">R$ {(item.price * item.quantity).toFixed(2)}</span>
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
            <span>R$ {order.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
          </div>
          {order.discount_amount && order.discount_amount > 0 && (
            <div className="flex justify-between mb-1 text-gray-600">
              <span>Desconto Membro:</span>
              <span>-R$ {order.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-black pt-2">
            <span>TOTAL:</span>
            <span>R$ {order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
          <div className="font-bold border-b border-gray-400 pb-1 mb-2">PAGAMENTO</div>
          <div>Forma: {getPaymentMethodName(order.payment_method || 'dinheiro')}</div>
          <div>Status: PAGO</div>
        </div>

        {order.notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2">OBSERVAÇÕES</div>
            <div>{order.notes}</div>
          </div>
        )}

        <div className="text-center border-t-2 border-black pt-3 text-xs">
          <div>Obrigado pela preferência!</div>
          <div>Volte sempre!</div>
          <div className="mt-2">
            {order.customer 
              ? `Pontos acumulados: +${Math.floor(order.total / 10)}`
              : 'Cadastre-se e ganhe pontos!'
            }
          </div>
        </div>
      </div>

      {/* Botão de impressão */}
      <div className="text-center mt-4">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Imprimir Comprovante
        </button>
      </div>
    </div>
  );
};

export default ReceiptPrinter;