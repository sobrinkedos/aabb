import React, { useState } from 'react';
import { X, Printer, CreditCard, DollarSign, Smartphone, Check } from 'lucide-react';
import { BillSplitConfig, BillSplitDetails, ComandaWithItems } from '../../../types/bar-attendance';

interface ComprovantesMultiplosProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaWithItems | null;
  splitConfig: BillSplitConfig;
  onProcessPayments: (payments: PaymentDetails[]) => void;
}

interface PaymentDetails {
  person_name: string;
  amount: number;
  payment_method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  receipt_printed?: boolean;
}

const ComprovantesMultiplos: React.FC<ComprovantesMultiplosProps> = ({
  isOpen,
  onClose,
  comanda,
  splitConfig,
  onProcessPayments
}) => {
  // Early return ANTES de todos os hooks
  if (!isOpen || !comanda) return null;

  const [payments, setPayments] = useState<PaymentDetails[]>(() => 
    splitConfig.splits.map(split => ({
      person_name: split.person_name,
      amount: split.total,
      payment_method: 'dinheiro' as const,
      status: 'pending' as const,
      receipt_printed: false
    }))
  );

  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const updatePaymentMethod = (personName: string, method: PaymentDetails['payment_method']) => {
    setPayments(prev => prev.map(payment => 
      payment.person_name === personName 
        ? { ...payment, payment_method: method }
        : payment
    ));
  };

  const processIndividualPayment = async (personName: string) => {
    setProcessingPayment(personName);
    
    // Simular processamento do pagamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPayments(prev => prev.map(payment => 
      payment.person_name === personName 
        ? { ...payment, status: 'completed' }
        : payment
    ));
    
    setProcessingPayment(null);
  };

  const printReceipt = (personName: string) => {
    const payment = payments.find(p => p.person_name === personName);
    const split = splitConfig.splits.find(s => s.person_name === personName);
    
    if (!payment || !split) return;

    // Gerar conteúdo do comprovante
    const receiptContent = generateReceiptContent(comanda, split, payment);
    
    // Simular impressão (em uma implementação real, isso enviaria para a impressora)
    console.log('Imprimindo comprovante:', receiptContent);
    
    // Marcar como impresso
    setPayments(prev => prev.map(p => 
      p.person_name === personName 
        ? { ...p, receipt_printed: true }
        : p
    ));
    
    // Em uma implementação real, você poderia:
    // - Enviar para uma impressora térmica
    // - Gerar PDF para download
    // - Enviar por email/WhatsApp
    alert(`Comprovante impresso para ${personName}`);
  };

  const generateReceiptContent = (
    comanda: ComandaWithItems, 
    split: BillSplitDetails, 
    payment: PaymentDetails
  ) => {
    const now = new Date();
    
    return `
=====================================
           CLUBE EXEMPLO
=====================================
Data: ${now.toLocaleDateString('pt-BR')}
Hora: ${now.toLocaleTimeString('pt-BR')}
Mesa: ${comanda.table?.number || 'Balcão'}
Comanda: ${comanda.id.slice(-8)}
Cliente: ${split.person_name}
=====================================

${split.items.map(item => 
  `${item.name}\n${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${item.total.toFixed(2)}`
).join('\n\n')}

-------------------------------------
Subtotal:        R$ ${split.subtotal.toFixed(2)}
Taxa Serviço:    R$ ${split.service_charge.toFixed(2)}
${split.discount > 0 ? `Desconto:        R$ ${split.discount.toFixed(2)}\n` : ''}
-------------------------------------
TOTAL:           R$ ${split.total.toFixed(2)}

Forma Pagamento: ${getPaymentMethodLabel(payment.payment_method)}
Status: PAGO

=====================================
        Obrigado pela visita!
=====================================
    `;
  };

  const getPaymentMethodLabel = (method: PaymentDetails['payment_method']) => {
    switch (method) {
      case 'dinheiro': return 'Dinheiro';
      case 'cartao_credito': return 'Cartão de Crédito';
      case 'cartao_debito': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      default: return method;
    }
  };

  const getPaymentMethodIcon = (method: PaymentDetails['payment_method']) => {
    switch (method) {
      case 'dinheiro': return <DollarSign className="w-4 h-4" />;
      case 'cartao_credito': 
      case 'cartao_debito': return <CreditCard className="w-4 h-4" />;
      case 'pix': return <Smartphone className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: PaymentDetails['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PaymentDetails['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'completed': return 'Pago';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const handleConfirmAllPayments = () => {
    onProcessPayments(payments);
  };

  const allPaymentsCompleted = payments.every(p => p.status === 'completed');
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Printer className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Processar Pagamentos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informações da Comanda */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Mesa</div>
              <div className="font-semibold">{comanda.table?.number || 'Balcão'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Comanda</div>
              <div className="font-semibold">#{comanda.id.slice(-8)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tipo de Divisão</div>
              <div className="font-semibold">
                {splitConfig.type === 'equal' ? 'Igual' : 'Por Item'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Geral</div>
              <div className="font-semibold text-green-600">R$ {totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Lista de Pagamentos */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {payments.map((payment, index) => {
              const split = splitConfig.splits.find(s => s.person_name === payment.person_name);
              const isProcessing = processingPayment === payment.person_name;
              
              return (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{payment.person_name}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {payment.amount.toFixed(2)}
                    </div>
                  </div>

                  {/* Detalhes do Split */}
                  {split && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="ml-2 font-medium">R$ {split.subtotal.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Taxa Serviço:</span>
                          <span className="ml-2 font-medium">R$ {split.service_charge.toFixed(2)}</span>
                        </div>
                        {split.discount > 0 && (
                          <div>
                            <span className="text-gray-500">Desconto:</span>
                            <span className="ml-2 font-medium">- R$ {split.discount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Forma de Pagamento */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'] as const).map(method => (
                        <button
                          key={method}
                          onClick={() => updatePaymentMethod(payment.person_name, method)}
                          disabled={payment.status === 'completed'}
                          className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                            payment.payment_method === method
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          } ${payment.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {getPaymentMethodIcon(method)}
                          <span className="text-sm font-medium">
                            {getPaymentMethodLabel(method)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {payment.receipt_printed && (
                        <span className="flex items-center space-x-1 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          <span>Comprovante impresso</span>
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => processIndividualPayment(payment.person_name)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processando...' : 'Processar Pagamento'}
                        </button>
                      )}
                      {payment.status === 'completed' && !payment.receipt_printed && (
                        <button
                          onClick={() => printReceipt(payment.person_name)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Imprimir Comprovante</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {payments.filter(p => p.status === 'completed').length} de {payments.length} pagamentos processados
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAllPayments}
                disabled={!allPaymentsCompleted}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Finalizar Todos os Pagamentos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprovantesMultiplos;