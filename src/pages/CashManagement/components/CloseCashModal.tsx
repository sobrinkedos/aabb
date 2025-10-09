import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building2, AlertTriangle, Clock, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';
import {
  CashSessionWithEmployee,
  CashClosingData,
  TreasuryTransferData,
  DiscrepancyHandlingData,
  PaymentMethod,
  formatCurrency,
  PAYMENT_METHOD_LABELS
} from '../../../types/cash-management';
import { useBalcaoOrders } from '../../../hooks/useBalcaoOrders';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { useAuth } from '../../../contexts/AuthContextSimple';
import { supabase } from '../../../lib/supabase';

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashSessionWithEmployee;
}

export const CloseCashModal: React.FC<CloseCashModalProps> = ({
  isOpen,
  onClose,
  session
}) => {
  const { preparingOrders, readyOrders } = useBalcaoOrders();
  const { closeCashSessionEnhanced } = useCashManagement();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'reconciliation' | 'transfer' | 'discrepancy'>('reconciliation');
  const [formData, setFormData] = useState<CashClosingData>({
    closing_amount: session.expected_amount,
    closing_notes: '',
    reconciliation: [
      { payment_method: 'dinheiro', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'cartao_debito', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'cartao_credito', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'pix', expected_amount: 0, actual_amount: 0, transaction_count: 0 },
      { payment_method: 'transferencia', expected_amount: 0, actual_amount: 0, transaction_count: 0 }
    ]
  });
  const [enableTransfer, setEnableTransfer] = useState(false);
  const [transferData, setTransferData] = useState<TreasuryTransferData>({
    amount: 0,
    transferred_at: new Date().toISOString(),
    authorized_by: user?.id || '',
    destination: 'cofre',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [pendingCommandaItems, setPendingCommandaItems] = useState<any[]>([]);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  // Carregar dados de reconciliação e validar pedidos pendentes quando a modal abrir
  useEffect(() => {
    if (isOpen && session) {
      loadPaymentBreakdown();
      loadPendingCommandaItems();
    }
  }, [isOpen, session]);

  // Função para carregar breakdown automático de pagamentos
  const loadPaymentBreakdown = async () => {
    setLoadingBreakdown(true);
    try {
      console.log('🔍 Carregando breakdown para sessão:', session.id);

      // Buscar transações diretamente (todas as transações da sessão)
      const { data: transactions, error } = await (supabase as any)
        .from('cash_transactions')
        .select('*')
        .eq('cash_session_id', session.id);

      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        throw error;
      }

      console.log('📊 Transações encontradas:', transactions?.length || 0);
      console.log('📋 Transações:', transactions);

      if (transactions && transactions.length > 0) {
        console.log('🔍 Tipos de transação:', [...new Set(transactions.map((t: any) => t.transaction_type))]);
        console.log('💳 Métodos de pagamento:', [...new Set(transactions.map((t: any) => t.payment_method))]);
      }

      // Agrupar por método de pagamento
      const breakdown: Record<PaymentMethod, { expected_amount: number; transaction_count: number }> = {
        dinheiro: { expected_amount: session.opening_amount, transaction_count: 0 }, // Começa com saldo inicial
        cartao_debito: { expected_amount: 0, transaction_count: 0 },
        cartao_credito: { expected_amount: 0, transaction_count: 0 },
        pix: { expected_amount: 0, transaction_count: 0 },
        transferencia: { expected_amount: 0, transaction_count: 0 }
      };

      // Calcular vendas por método
      transactions?.forEach((transaction: any) => {
        // Considerar apenas vendas (sales) para o cálculo
        if (transaction.transaction_type !== 'sale') {
          console.log('⏭️ Ignorando transação não-venda:', transaction.transaction_type);
          return;
        }

        const method = transaction.payment_method as PaymentMethod;
        const amount = Number(transaction.amount) || 0;

        console.log(`💰 Processando: ${method} = R$ ${amount.toFixed(2)}`);

        if (breakdown[method]) {
          // Para todos os métodos: soma o valor das vendas
          breakdown[method].expected_amount += amount;
          breakdown[method].transaction_count += 1;
        }
      });

      console.log('💰 Breakdown calculado:', breakdown);
      console.log('💵 Dinheiro esperado:', breakdown.dinheiro.expected_amount);
      console.log('💳 Cartão Débito esperado:', breakdown.cartao_debito.expected_amount);
      console.log('📱 PIX esperado:', breakdown.pix.expected_amount);

      setFormData(prev => ({
        ...prev,
        closing_amount: session.expected_amount,
        reconciliation: Object.entries(breakdown).map(([method, data]) => ({
          payment_method: method as PaymentMethod,
          expected_amount: data.expected_amount,
          actual_amount: 0, // Usuário vai preencher
          transaction_count: data.transaction_count
        }))
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar breakdown de pagamentos:', error);
      // Manter valores padrão em caso de erro
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Função para carregar itens de comandas pendentes de entrega do funcionário
  const loadPendingCommandaItems = async () => {
    setLoadingValidation(true);
    try {
      const { data: pendingItems, error } = await (supabase as any)
        .from('comanda_items')
        .select(`
          *,
          comanda:comandas!inner(
            id,
            customer_name,
            table_id,
            employee_id,
            bar_tables(number)
          ),
          menu_item:menu_items(name)
        `)
        .in('status', ['pending', 'preparing', 'ready'])
        .eq('comanda.status', 'open')
        .eq('comanda.employee_id', session.employee_id)
        .order('added_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar itens pendentes:', error);
        setPendingCommandaItems([]);
      } else {
        setPendingCommandaItems(pendingItems || []);
      }
    } catch (error) {
      console.error('Erro ao validar pedidos pendentes:', error);
      setPendingCommandaItems([]);
    } finally {
      setLoadingValidation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. VALIDAÇÃO RIGOROSA: Verificar mesas, comandas e pedidos abertos
    const validationErrors = await validateBeforeClosing();
    if (validationErrors.length > 0) {
      alert(`❌ Não é possível fechar o caixa:\n\n${validationErrors.join('\n')}`);
      return;
    }

    // 2. VALIDAÇÃO: Obrigatoriedade de transferência de dinheiro (saldo zero)
    const cashReconciliation = formData.reconciliation.find(r => r.payment_method === 'dinheiro');
    const cashAmount = cashReconciliation?.actual_amount || 0;
    
    if (cashAmount > 0 && !enableTransfer) {
      alert(`❌ Transferência obrigatória!\n\nExiste R$ ${formatCurrency(cashAmount)} em dinheiro no caixa.\n\nVocê deve transferir o dinheiro para o cofre/tesouraria antes de fechar o caixa.`);
      setActiveTab('transfer');
      return;
    }

    if (enableTransfer && transferData.amount !== cashAmount) {
      alert(`❌ Valor de transferência incorreto!\n\nDinheiro no caixa: ${formatCurrency(cashAmount)}\nValor a transferir: ${formatCurrency(transferData.amount)}\n\nO valor da transferência deve ser igual ao saldo em dinheiro.`);
      setActiveTab('transfer');
      return;
    }

    if (enableTransfer && cashAmount > 0 && !transferData.recipient_name) {
      alert('❌ Informe o nome do responsável que recebeu o dinheiro.');
      setActiveTab('transfer');
      return;
    }

    setLoading(true);

    try {
      const closingData: CashClosingData = {
        ...formData,
        treasury_transfer: enableTransfer ? transferData : undefined,
        discrepancy_handling: getDiscrepancyHandling()
      };

      const receipt = await closeCashSessionEnhanced(closingData);

      // 3. GERAR E EXIBIR COMPROVANTE
      generateAndPrintReceipt(receipt, closingData);

      alert(`✅ Caixa fechado com sucesso!\n\nComprovante: ${receipt.receipt_number}`);
      onClose();
    } catch (error: any) {
      console.error('Erro ao fechar caixa:', error);
      alert(`❌ Erro ao fechar caixa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validação completa antes do fechamento
  const validateBeforeClosing = async (): Promise<string[]> => {
    const errors: string[] = [];

    try {
      // Verificar comandas abertas do funcionário da sessão
      const { data: openComandas, error: comandasError } = await (supabase as any)
        .from('comandas')
        .select('id, customer_name, table_id, bar_tables(number)')
        .eq('status', 'open')
        .eq('employee_id', session.employee_id);

      if (comandasError) throw comandasError;

      if (openComandas && openComandas.length > 0) {
        errors.push(`⚠️ ${openComandas.length} comanda(s) ainda aberta(s):`);
        openComandas.slice(0, 5).forEach((c: any) => {
          const tableInfo = c.bar_tables ? `Mesa ${c.bar_tables.number}` : 'Balcão';
          errors.push(`   • ${tableInfo} - ${c.customer_name || 'Sem nome'}`);
        });
        if (openComandas.length > 5) {
          errors.push(`   ... e mais ${openComandas.length - 5} comanda(s)`);
        }
      }

      // Verificar mesas ocupadas APENAS com comandas abertas deste funcionário
      if (openComandas && openComandas.length > 0) {
        const tableIds = openComandas
          .filter((c: any) => c.table_id)
          .map((c: any) => c.table_id);

        if (tableIds.length > 0) {
          const { data: occupiedTables, error: tablesError } = await (supabase as any)
            .from('bar_tables')
            .select('id, number')
            .in('id', tableIds)
            .eq('status', 'occupied');

          if (tablesError) throw tablesError;

          if (occupiedTables && occupiedTables.length > 0) {
            errors.push(`⚠️ ${occupiedTables.length} mesa(s) com comandas suas ainda ocupada(s):`);
            occupiedTables.slice(0, 5).forEach((t: any) => {
              errors.push(`   • Mesa ${t.number}`);
            });
          }
        }
      }

      // Verificar pedidos de balcão pendentes do funcionário
      const { data: balcaoOrders, error: balcaoError } = await (supabase as any)
        .from('balcao_orders')
        .select('id, order_number, status, employee_id')
        .in('status', ['pending', 'preparing', 'ready'])
        .eq('employee_id', session.employee_id);

      if (balcaoError) throw balcaoError;

      if (balcaoOrders && balcaoOrders.length > 0) {
        errors.push(`⚠️ ${balcaoOrders.length} pedido(s) de balcão seus pendente(s):`);
        balcaoOrders.slice(0, 5).forEach((o: any) => {
          errors.push(`   • Pedido #${o.order_number} - ${o.status}`);
        });
      }

      // Verificar itens de comanda não entregues (já filtrados por funcionário)
      if (pendingCommandaItems.length > 0) {
        errors.push(`⚠️ ${pendingCommandaItems.length} item(ns) de comanda seus não entregue(s)`);
      }

    } catch (error) {
      console.error('Erro na validação:', error);
      errors.push('❌ Erro ao validar pendências. Tente novamente.');
    }

    return errors;
  };

  // Gerar e imprimir comprovante de fechamento
  const generateAndPrintReceipt = (receipt: any, closingData: CashClosingData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('⚠️ Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante de Fechamento - ${receipt.receipt_number}</title>
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 1cm; }
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
          }
          .header p {
            margin: 5px 0;
            font-size: 11px;
          }
          .section {
            margin: 15px 0;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 10px;
          }
          .section h2 {
            font-size: 14px;
            margin: 0 0 8px 0;
            font-weight: bold;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .row.total {
            font-weight: bold;
            font-size: 14px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #000;
          }
          .highlight {
            background: #f0f0f0;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            border-top: 2px dashed #000;
            padding-top: 10px;
          }
          .signature {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COMPROVANTE DE FECHAMENTO</h1>
          <p>Nº ${receipt.receipt_number}</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="section">
          <h2>DADOS DA SESSÃO</h2>
          <div class="row">
            <span>Sessão:</span>
            <span>#${session.id.slice(0, 8)}</span>
          </div>
          <div class="row">
            <span>Funcionário:</span>
            <span>${session.employee?.name || 'N/A'}</span>
          </div>
          <div class="row">
            <span>Abertura:</span>
            <span>${new Date(session.opened_at).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
          <div class="row">
            <span>Fechamento:</span>
            <span>${new Date().toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
          <div class="row">
            <span>Valor Inicial:</span>
            <span>${formatCurrency(session.opening_amount)}</span>
          </div>
        </div>

        <div class="section">
          <h2>RECONCILIAÇÃO POR MÉTODO</h2>
          ${closingData.reconciliation.map(recon => `
            <div style="margin-bottom: 10px;">
              <div class="row" style="font-weight: bold;">
                <span>${PAYMENT_METHOD_LABELS[recon.payment_method]}</span>
                <span>${recon.transaction_count} transações</span>
              </div>
              <div class="row">
                <span>Esperado:</span>
                <span>${formatCurrency(recon.expected_amount)}</span>
              </div>
              <div class="row">
                <span>Contado:</span>
                <span>${formatCurrency(recon.actual_amount)}</span>
              </div>
              ${Math.abs(recon.actual_amount - recon.expected_amount) > 0.01 ? `
                <div class="row" style="color: ${recon.actual_amount > recon.expected_amount ? 'green' : 'red'};">
                  <span>${recon.actual_amount > recon.expected_amount ? 'Sobra:' : 'Falta:'}</span>
                  <span>${formatCurrency(Math.abs(recon.actual_amount - recon.expected_amount))}</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>RESUMO FINANCEIRO</h2>
          <div class="row">
            <span>Total Esperado:</span>
            <span>${formatCurrency(totalExpectedAmount)}</span>
          </div>
          <div class="row">
            <span>Total Contado:</span>
            <span>${formatCurrency(totalActualAmount)}</span>
          </div>
          <div class="row total" style="color: ${Math.abs(cashDiscrepancy) < 0.01 ? 'green' : cashDiscrepancy > 0 ? 'green' : 'red'};">
            <span>Diferença:</span>
            <span>${Math.abs(cashDiscrepancy) < 0.01 ? 'EXATO ✓' : formatCurrency(cashDiscrepancy)}</span>
          </div>
        </div>

        ${enableTransfer && transferData.amount > 0 ? `
          <div class="section">
            <h2>TRANSFERÊNCIA PARA TESOURARIA</h2>
            <div class="highlight">
              <div class="row">
                <span>Valor Transferido:</span>
                <span style="font-weight: bold;">${formatCurrency(transferData.amount)}</span>
              </div>
              <div class="row">
                <span>Destino:</span>
                <span>${transferData.destination === 'cofre' ? 'Cofre' : transferData.destination === 'banco' ? 'Banco' : 'Tesouraria Central'}</span>
              </div>
              <div class="row">
                <span>Recebido por:</span>
                <span>${transferData.recipient_name || 'N/A'}</span>
              </div>
              ${transferData.receipt_number ? `
                <div class="row">
                  <span>Comprovante:</span>
                  <span>${transferData.receipt_number}</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${closingData.closing_notes ? `
          <div class="section">
            <h2>OBSERVAÇÕES</h2>
            <p style="margin: 5px 0; white-space: pre-wrap;">${closingData.closing_notes}</p>
          </div>
        ` : ''}

        <div class="signature">
          <p>_________________________________</p>
          <p>Assinatura do Responsável</p>
          <p style="margin-top: 5px; font-size: 10px;">${session.employee?.name || ''}</p>
        </div>

        <div class="footer">
          <p>Sistema de Gestão - Fechamento de Caixa</p>
          <p>Documento gerado automaticamente</p>
          <p>Guarde este comprovante para auditoria</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // Função para determinar o tratamento de discrepância
  const getDiscrepancyHandling = (): DiscrepancyHandlingData | undefined => {
    const discrepancy = cashDiscrepancy;

    if (Math.abs(discrepancy) < 0.01) {
      return undefined; // Sem discrepância
    }

    // Discrepância < R$ 5,00 - Aceitar automaticamente
    if (Math.abs(discrepancy) < 5) {
      return {
        discrepancy_amount: discrepancy,
        reason: formData.closing_notes || 'Diferença pequena - aceita automaticamente',
        action_taken: 'accepted'
      };
    }

    // Discrepância R$ 5,00 - R$ 50,00 - Requer justificativa
    if (Math.abs(discrepancy) <= 50) {
      if (!formData.closing_notes || formData.closing_notes.length < 5) {
        throw new Error('Para discrepâncias entre R$ 5,00 e R$ 50,00, é necessário informar o motivo (mínimo 5 caracteres)');
      }
      return {
        discrepancy_amount: discrepancy,
        reason: formData.closing_notes,
        action_taken: 'accepted',
        resolution_notes: 'Discrepância média - justificada pelo operador'
      };
    }

    // Discrepância > R$ 50,00 - Requer aprovação de supervisor
    if (!formData.closing_notes || formData.closing_notes.length < 10) {
      throw new Error('Para discrepâncias acima de R$ 50,00, é necessário informar o motivo detalhadamente (mínimo 10 caracteres)');
    }

    // Aqui você pode adicionar um campo para o ID do supervisor
    // Por enquanto, vamos lançar um erro pedindo aprovação
    const supervisorId = prompt('Discrepância alta detectada! Informe o ID do supervisor que aprovou:');
    if (!supervisorId) {
      throw new Error('Aprovação de supervisor é obrigatória para discrepâncias acima de R$ 50,00');
    }

    return {
      discrepancy_amount: discrepancy,
      reason: formData.closing_notes,
      action_taken: 'investigation',
      approved_by: supervisorId,
      resolution_notes: 'Discrepância alta - requer investigação'
    };
  };

  const updateReconciliation = (paymentMethod: PaymentMethod, field: 'actual_amount' | 'transaction_count', value: number) => {
    setFormData(prev => ({
      ...prev,
      reconciliation: prev.reconciliation.map(recon =>
        recon.payment_method === paymentMethod
          ? { ...recon, [field]: value }
          : recon
      )
    }));
  };

  const totalExpectedAmount = formData.reconciliation.reduce((sum, recon) => sum + recon.expected_amount, 0);
  const totalActualAmount = formData.reconciliation.reduce((sum, recon) => sum + recon.actual_amount, 0);
  const cashDiscrepancy = totalActualAmount - totalExpectedAmount;

  // Calcular total de pedidos pendentes
  const totalPendingOrders = preparingOrders.length + readyOrders.length + pendingCommandaItems.length;
  const hasPendingDeliveries = totalPendingOrders > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Fechar Caixa</h2>
              <p className="text-sm text-gray-500">Sessão #{session.id.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'reconciliation'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Reconciliação</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'transfer'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center space-x-2">
              <ArrowRight className="h-4 w-4" />
              <span>Transferência</span>
            </div>
          </button>
          {Math.abs(cashDiscrepancy) > 0.01 && (
            <button
              type="button"
              onClick={() => setActiveTab('discrepancy')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'discrepancy'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-orange-500 hover:text-orange-700'
                }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Discrepância</span>
              </div>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta de Pedidos Pendentes */}
          {hasPendingDeliveries && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    ⚠️ Atenção: Pedidos Pendentes de Entrega
                  </h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    {preparingOrders.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{preparingOrders.length} pedidos de balcão em preparo</span>
                      </div>
                    )}
                    {readyOrders.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span>{readyOrders.length} pedidos de balcão prontos para entrega</span>
                      </div>
                    )}
                    {pendingCommandaItems.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{pendingCommandaItems.length} itens de comandas não entregues</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Recomenda-se entregar todos os pedidos antes de fechar o caixa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 1: RECONCILIAÇÃO */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              {/* Resumo da Sessão */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Resumo da Sessão</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Valor inicial:</span>
                    <span className="font-medium">{formatCurrency(session.opening_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor esperado total:</span>
                    <span className="font-medium">{formatCurrency(totalExpectedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aberta em:</span>
                    <span className="font-medium">{new Date(session.opened_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funcionário:</span>
                    <span className="font-medium">{session.employee?.name}</span>
                  </div>
                </div>
              </div>

              {/* Reconciliação por Método de Pagamento */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Reconciliação por Método de Pagamento</h3>
                  {loadingBreakdown && (
                    <span className="text-sm text-gray-500">Carregando valores...</span>
                  )}
                </div>
                <div className="space-y-4">
                  {formData.reconciliation.map((recon) => {
                    const getIcon = (method: PaymentMethod) => {
                      switch (method) {
                        case 'dinheiro': return <DollarSign className="h-5 w-5" />;
                        case 'cartao_debito':
                        case 'cartao_credito': return <CreditCard className="h-5 w-5" />;
                        case 'pix': return <Smartphone className="h-5 w-5" />;
                        case 'transferencia': return <Building2 className="h-5 w-5" />;
                        default: return <DollarSign className="h-5 w-5" />;
                      }
                    };

                    return (
                      <div key={recon.payment_method} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {getIcon(recon.payment_method)}
                          <h4 className="font-medium text-gray-900">
                            {PAYMENT_METHOD_LABELS[recon.payment_method]}
                          </h4>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Valor Esperado
                            </label>
                            <div className="px-3 py-2 bg-gray-50 rounded text-sm font-medium">
                              {formatCurrency(recon.expected_amount)}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Valor Real *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={recon.actual_amount}
                              onChange={(e) => updateReconciliation(
                                recon.payment_method,
                                'actual_amount',
                                parseFloat(e.target.value) || 0
                              )}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              disabled={loading || loadingBreakdown}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Transações
                            </label>
                            <div className="px-3 py-2 bg-gray-50 rounded text-sm font-medium">
                              {recon.transaction_count}
                            </div>
                          </div>
                        </div>

                        {Math.abs(recon.actual_amount - recon.expected_amount) > 0.01 && (
                          <div className={`mt-2 p-2 rounded text-xs ${recon.actual_amount > recon.expected_amount
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                            }`}>
                            {recon.actual_amount > recon.expected_amount ? 'Sobra' : 'Falta'}:
                            {formatCurrency(Math.abs(recon.actual_amount - recon.expected_amount))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo Final */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Resumo Final</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Total esperado:</span>
                    <span className="font-medium">{formatCurrency(totalExpectedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total contado:</span>
                    <span className="font-medium">{formatCurrency(totalActualAmount)}</span>
                  </div>
                  <div className="flex justify-between col-span-2 pt-2 border-t border-blue-200">
                    <span className="font-medium">Diferença:</span>
                    <span className={`font-bold ${Math.abs(cashDiscrepancy) < 0.01
                      ? 'text-green-600'
                      : cashDiscrepancy > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      }`}>
                      {Math.abs(cashDiscrepancy) < 0.01 ? 'Exato ✓' : formatCurrency(cashDiscrepancy)}
                      {cashDiscrepancy > 0 && ' (Sobra)'}
                      {cashDiscrepancy < 0 && ' (Falta)'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações do Fechamento
                  {Math.abs(cashDiscrepancy) >= 5 && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </label>
                <textarea
                  value={formData.closing_notes || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    closing_notes: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={
                    Math.abs(cashDiscrepancy) >= 50
                      ? "Obrigatório: Descreva detalhadamente o motivo da discrepância (mín. 10 caracteres)"
                      : Math.abs(cashDiscrepancy) >= 5
                        ? "Obrigatório: Informe o motivo da discrepância (mín. 5 caracteres)"
                        : "Observações sobre o fechamento..."
                  }
                  disabled={loading}
                />
                {Math.abs(cashDiscrepancy) >= 5 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.abs(cashDiscrepancy) >= 50
                      ? "⚠️ Discrepância alta - Justificativa detalhada obrigatória"
                      : "⚠️ Justificativa obrigatória para discrepâncias acima de R$ 5,00"
                    }
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: TRANSFERÊNCIA PARA TESOURARIA */}
          {activeTab === 'transfer' && (
            <div className="space-y-6">
              {/* Alerta de Obrigatoriedade */}
              {(() => {
                const cashReconciliation = formData.reconciliation.find(r => r.payment_method === 'dinheiro');
                const cashAmount = cashReconciliation?.actual_amount || 0;
                return cashAmount > 0 ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-800 mb-2">
                          ⚠️ TRANSFERÊNCIA OBRIGATÓRIA
                        </h3>
                        <p className="text-sm text-red-700 mb-2">
                          Existe <span className="font-bold">{formatCurrency(cashAmount)}</span> em dinheiro no caixa.
                        </p>
                        <p className="text-sm text-red-700">
                          O fechamento só será permitido após transferir todo o dinheiro para o cofre/tesouraria.
                          <br />
                          <strong>O caixa deve ser fechado com saldo ZERO em dinheiro.</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-green-800">
                          ✓ Sem dinheiro no caixa
                        </h3>
                        <p className="text-sm text-green-700">
                          Não há valores em dinheiro para transferir.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">Transferência para Tesouraria</h3>
                      <p className="text-sm text-blue-700">
                        {(() => {
                          const cashReconciliation = formData.reconciliation.find(r => r.payment_method === 'dinheiro');
                          const cashAmount = cashReconciliation?.actual_amount || 0;
                          return cashAmount > 0 
                            ? '⚠️ OBRIGATÓRIO: Registre a transferência do dinheiro'
                            : 'Registre a transferência de valores do caixa (opcional)';
                        })()}
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableTransfer}
                      onChange={(e) => {
                        const cashReconciliation = formData.reconciliation.find(r => r.payment_method === 'dinheiro');
                        const cashAmount = cashReconciliation?.actual_amount || 0;
                        
                        if (e.target.checked && cashAmount > 0) {
                          // Auto-preencher com o valor em dinheiro
                          setTransferData(prev => ({
                            ...prev,
                            amount: cashAmount
                          }));
                        }
                        setEnableTransfer(e.target.checked);
                      }}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Registrar transferência</span>
                  </label>
                </div>

                {enableTransfer && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor a Transferir *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalActualAmount}
                          value={transferData.amount}
                          onChange={(e) => setTransferData(prev => ({
                            ...prev,
                            amount: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Saldo disponível: {formatCurrency(totalActualAmount)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destino *
                        </label>
                        <select
                          value={transferData.destination}
                          onChange={(e) => setTransferData(prev => ({
                            ...prev,
                            destination: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          disabled={loading}
                        >
                          <option value="cofre">Cofre</option>
                          <option value="banco">Banco</option>
                          <option value="tesouraria_central">Tesouraria Central</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Responsável pelo Recebimento
                      </label>
                      <input
                        type="text"
                        value={transferData.recipient_name || ''}
                        onChange={(e) => setTransferData(prev => ({
                          ...prev,
                          recipient_name: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Nome de quem recebeu"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número do Comprovante
                      </label>
                      <input
                        type="text"
                        value={transferData.receipt_number || ''}
                        onChange={(e) => setTransferData(prev => ({
                          ...prev,
                          receipt_number: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Ex: COMP-2025-001"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={transferData.notes || ''}
                        onChange={(e) => setTransferData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Detalhes adicionais sobre a transferência..."
                        disabled={loading}
                      />
                    </div>

                    {transferData.amount > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">
                              Saldo restante no caixa: {formatCurrency(totalActualAmount - transferData.amount)}
                            </p>
                            <p className="text-green-700 text-xs">
                              Transferindo {formatCurrency(transferData.amount)} para {transferData.destination}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!enableTransfer && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    Ative a opção acima para registrar uma transferência para tesouraria
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: TRATAMENTO DE DISCREPÂNCIA */}
          {activeTab === 'discrepancy' && Math.abs(cashDiscrepancy) > 0.01 && (
            <div className="space-y-6">
              <div className={`border-l-4 rounded-lg p-4 ${Math.abs(cashDiscrepancy) >= 50
                ? 'bg-red-50 border-red-500'
                : Math.abs(cashDiscrepancy) >= 5
                  ? 'bg-orange-50 border-orange-500'
                  : 'bg-yellow-50 border-yellow-500'
                }`}>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className={`h-6 w-6 mt-0.5 ${Math.abs(cashDiscrepancy) >= 50
                    ? 'text-red-600'
                    : Math.abs(cashDiscrepancy) >= 5
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                    }`} />
                  <div className="flex-1">
                    <h3 className={`text-lg font-medium mb-2 ${Math.abs(cashDiscrepancy) >= 50
                      ? 'text-red-900'
                      : Math.abs(cashDiscrepancy) >= 5
                        ? 'text-orange-900'
                        : 'text-yellow-900'
                      }`}>
                      {Math.abs(cashDiscrepancy) >= 50
                        ? '🚨 Aprovação de Supervisor Necessária'
                        : Math.abs(cashDiscrepancy) >= 5
                          ? '⚠️ Justificativa Necessária'
                          : '✅ Discrepância Aceitável'
                      }
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Valor da Discrepância:</span>
                        <span className={`font-bold ${cashDiscrepancy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(cashDiscrepancy))} ({cashDiscrepancy > 0 ? 'Sobra' : 'Falta'})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Nível de Risco:</span>
                        <span className={`font-bold ${Math.abs(cashDiscrepancy) >= 50
                          ? 'text-red-600'
                          : Math.abs(cashDiscrepancy) >= 5
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                          }`}>
                          {Math.abs(cashDiscrepancy) >= 50
                            ? 'ALTA'
                            : Math.abs(cashDiscrepancy) >= 5
                              ? 'MÉDIA'
                              : 'BAIXA'
                          }
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mt-3 ${Math.abs(cashDiscrepancy) >= 50
                      ? 'text-red-700'
                      : Math.abs(cashDiscrepancy) >= 5
                        ? 'text-orange-700'
                        : 'text-yellow-700'
                      }`}>
                      {Math.abs(cashDiscrepancy) >= 50
                        ? 'A discrepância excede R$ 50,00. É necessária a aprovação de um supervisor para prosseguir com o fechamento.'
                        : Math.abs(cashDiscrepancy) >= 5
                          ? 'Por favor, informe o motivo da discrepância. Uma justificativa detalhada é necessária.'
                          : 'A diferença está dentro do limite aceitável. Você pode aceitar automaticamente ou informar o motivo.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informações Adicionais</h4>
                <p className="text-sm text-gray-600">
                  Volte para a aba "Reconciliação" e preencha o campo "Observações do Fechamento" com:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>Motivo da discrepância</li>
                  <li>Ações tomadas para investigar</li>
                  {Math.abs(cashDiscrepancy) >= 50 && (
                    <li className="text-red-600 font-medium">ID do supervisor que aprovou (será solicitado no fechamento)</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingValidation || loadingBreakdown}
              className={`flex-1 px-4 py-2 text-white rounded-md disabled:opacity-50 transition-colors ${Math.abs(cashDiscrepancy) >= 50
                ? 'bg-red-600 hover:bg-red-700'
                : hasPendingDeliveries
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {loading ? 'Fechando...' :
                loadingValidation ? 'Validando...' :
                  loadingBreakdown ? 'Carregando...' :
                    Math.abs(cashDiscrepancy) >= 50 ? 'Fechar com Aprovação' :
                      hasPendingDeliveries ? 'Fechar Mesmo Assim' : 'Fechar Caixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
