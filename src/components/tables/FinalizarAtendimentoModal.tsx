import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PrinterIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BarTable, Comanda } from '../../types/bar-attendance';
import { useComandas } from '../../hooks/useComandas';
import { useBarTables } from '../../hooks/useBarTables';

interface FinalizarAtendimentoModalProps {
  table: BarTable;
  onClose: () => void;
  onFinalized?: () => void;
}

interface ComandaWithItems extends Comanda {
  comanda_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    menu_items?: {
      name: string;
      category: string;
    };
  }>;
}

const FinalizarAtendimentoModal: React.FC<FinalizarAtendimentoModalProps> = ({
  table,
  onClose,
  onFinalized
}) => {
  const { getOpenComandasByTableId, updateComanda } = useComandas();
  const { updateTableStatus } = useBarTables();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const openComandas = getOpenComandasByTableId(table.id) as ComandaWithItems[];
  
  // Calcular totais
  const totalGeral = openComandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0);
  const totalItens = openComandas.reduce((sum, comanda) => 
    sum + (comanda.comanda_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handlePrintComanda = () => {
    setShowPrintPreview(true);
    
    // Simular impressão
    setTimeout(() => {
      const printContent = generatePrintContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
      setShowPrintPreview(false);
    }, 1000);
  };

  const generatePrintContent = () => {
    const now = new Date().toLocaleString('pt-BR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda - Mesa ${table.number}</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .mesa-info { text-align: center; margin-bottom: 15px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CLUBE AABB</h2>
          <p>Sistema de Atendimento do Bar</p>
        </div>
        
        <div class="mesa-info">
          <h3>MESA ${table.number}</h3>
          <p>Capacidade: ${table.capacity} pessoas</p>
          <p>Data/Hora: ${now}</p>
        </div>

        <h4>ITENS CONSUMIDOS:</h4>
        ${openComandas.map(comanda => `
          <div style="margin-bottom: 15px;">
            <strong>Comanda: ${comanda.customer_name || 'Sem nome'}</strong>
            ${comanda.comanda_items?.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.menu_items?.name || 'Item'}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
              </div>
            `).join('') || ''}
          </div>
        `).join('')}

        <div class="total">
          <div class="item">
            <span>TOTAL DE ITENS: ${totalItens}</span>
            <span></span>
          </div>
          <div class="item">
            <span>TOTAL GERAL:</span>
            <span>${formatCurrency(totalGeral)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Obrigado pela preferência!</p>
          <p>Esta comanda foi enviada para o caixa</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleFinalizarAtendimento = async () => {
    if (!selectedPaymentMethod) {
      alert('Selecione um método de pagamento');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Enviar comandas para pendência de pagamento no caixa
      const updatePromises = openComandas.map(comanda => 
        updateComanda(comanda.id, { 
          status: 'pending_payment',
          payment_method: selectedPaymentMethod 
        })
      );
      
      await Promise.all(updatePromises);

      // 2. Atualizar status da mesa para disponível
      await updateTableStatus(table.id, 'available');

      // 3. Log do processamento
      console.log('Comandas enviadas para o caixa:', {
        mesa: table.number,
        comandas: openComandas.length,
        total: totalGeral,
        paymentMethod: selectedPaymentMethod,
        status: 'pending_payment'
      });

      // 4. Imprimir comanda
      handlePrintComanda();

      // 5. Notificar sucesso
      alert(`Atendimento finalizado com sucesso!\n\nMesa ${table.number} liberada\nTotal: ${formatCurrency(totalGeral)}\nMétodo: ${selectedPaymentMethod}\n\n✅ Comandas enviadas para o CAIXA\n💰 Aguardando pagamento`);

      if (onFinalized) {
        onFinalized();
      }

      onClose();

    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      alert('Erro ao finalizar atendimento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (openComandas.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma Comanda Aberta
            </h3>
            <p className="text-gray-600 mb-4">
              Não há comandas abertas para finalizar nesta mesa.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Finalizar Atendimento - Mesa {table.number}
              </h3>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>Capacidade: {table.capacity}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{openComandas.length} comandas</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span>{formatCurrency(totalGeral)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-4">
            {/* Resumo das Comandas */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Comandas a Finalizar</h4>
              <div className="space-y-3">
                {openComandas.map((comanda) => (
                  <div key={comanda.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {comanda.customer_name || 'Cliente sem nome'}
                        </span>
                        {comanda.people_count && (
                          <span className="text-sm text-gray-600">
                            ({comanda.people_count} pessoas)
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(comanda.total || 0)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      Aberta em: {comanda.opened_at ? formatDateTime(comanda.opened_at) : 'N/A'}
                    </div>

                    {/* Itens da Comanda */}
                    {comanda.comanda_items && comanda.comanda_items.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">
                          Itens ({comanda.comanda_items.length}):
                        </span>
                        <div className="space-y-1">
                          {comanda.comanda_items.map((item, index) => (
                            <div key={item.id || index} className="flex justify-between items-center text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600">{item.quantity}x</span>
                                <span className="text-gray-900">
                                  {item.menu_items?.name || 'Item sem nome'}
                                </span>
                              </div>
                              <span className="text-gray-600">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Método de Pagamento</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                  { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
                  { value: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' },
                  { value: 'pix', label: 'PIX', icon: '📱' },
                  { value: 'credito_socio', label: 'Crédito do Sócio', icon: '👤' },
                  { value: 'misto', label: 'Pagamento Misto', icon: '🔄' }
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setSelectedPaymentMethod(method.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedPaymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Totais e Ações */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {/* Totais */}
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{openComandas.length}</div>
              <div className="text-gray-600">Comandas</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">{totalItens}</div>
              <div className="text-gray-600">Itens</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600 text-lg">
                {formatCurrency(totalGeral)}
              </div>
              <div className="text-gray-600">Total</div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex space-x-3">
            <button
              onClick={handlePrintComanda}
              disabled={showPrintPreview}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <PrinterIcon className="h-5 w-5" />
              <span>{showPrintPreview ? 'Imprimindo...' : 'Imprimir Prévia'}</span>
            </button>
            
            <button
              onClick={handleFinalizarAtendimento}
              disabled={!selectedPaymentMethod || isProcessing}
              className="flex-2 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>
                {isProcessing ? 'Finalizando...' : 'Finalizar Atendimento'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizarAtendimentoModal;