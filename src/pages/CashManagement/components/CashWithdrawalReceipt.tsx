import React from 'react';
import { formatCurrency } from '../../../types/cash-management';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashWithdrawalReceiptData {
  withdrawalId: string;
  amount: number;
  reason: string;
  authorizedBy: string;
  recipient?: string;
  purpose: 'change' | 'expense' | 'transfer' | 'other';
  cashierName: string;
  timestamp: Date;
  sessionId: string;
}

interface CashWithdrawalReceiptProps {
  receiptData: CashWithdrawalReceiptData;
  onPrint?: () => void;
}

const purposeLabels = {
  change: 'Troco',
  expense: 'Despesa',
  transfer: 'Transferência',
  other: 'Outros'
};

export const CashWithdrawalReceipt: React.FC<CashWithdrawalReceiptProps> = ({
  receiptData,
  onPrint
}) => {
  const handlePrint = () => {
    const printContent = document.getElementById('cash-withdrawal-receipt');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante de Saída de Dinheiro</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .receipt-title {
              font-size: 14px;
              font-weight: bold;
              margin-top: 10px;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              border-bottom: 1px solid #000;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .row-full {
              margin-bottom: 3px;
            }
            .total {
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              padding: 8px 0;
              margin: 15px 0;
              font-weight: bold;
              font-size: 14px;
            }
            .signatures {
              margin-top: 30px;
              border-top: 1px solid #000;
              padding-top: 20px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              margin: 30px 0 10px 0;
              height: 1px;
            }
            .signature-label {
              text-align: center;
              font-size: 10px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .highlight {
              background-color: #f0f0f0;
              padding: 5px;
              border: 1px solid #000;
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    if (onPrint) {
      onPrint();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <div id="cash-withdrawal-receipt" className="receipt">
        {/* Header */}
        <div className="header">
          <div className="company-name">AABB - SISTEMA DE GESTÃO</div>
          <div>Associação Atlética Banco do Brasil</div>
          <div className="receipt-title">COMPROVANTE DE SAÍDA</div>
          <div className="receipt-title">DE DINHEIRO</div>
        </div>

        {/* Informações da Saída */}
        <div className="section">
          <div className="section-title">Dados da Operação</div>
          <div className="row">
            <span>ID Operação:</span>
            <span>#{receiptData.withdrawalId.slice(-8).toUpperCase()}</span>
          </div>
          <div className="row">
            <span>Data/Hora:</span>
            <span>{format(receiptData.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          </div>
          <div className="row">
            <span>Sessão Caixa:</span>
            <span>#{receiptData.sessionId.slice(-6).toUpperCase()}</span>
          </div>
          <div className="row">
            <span>Finalidade:</span>
            <span>{purposeLabels[receiptData.purpose]}</span>
          </div>
        </div>

        {/* Valor */}
        <div className="total">
          <div className="row">
            <span>VALOR DA SAÍDA:</span>
            <span>{formatCurrency(receiptData.amount)}</span>
          </div>
        </div>

        {/* Motivo */}
        <div className="section">
          <div className="section-title">Justificativa</div>
          <div className="highlight">
            <div className="row-full">{receiptData.reason}</div>
          </div>
        </div>

        {/* Informações de Autorização */}
        <div className="section">
          <div className="section-title">Autorização</div>
          <div className="row-full">
            <strong>Autorizado por:</strong> {receiptData.authorizedBy}
          </div>
          <div className="row-full">
            <strong>Operador de Caixa:</strong> {receiptData.cashierName}
          </div>
          {receiptData.recipient && (
            <div className="row-full">
              <strong>Beneficiário:</strong> {receiptData.recipient}
            </div>
          )}
        </div>

        {/* Informações Legais */}
        <div className="section">
          <div className="section-title">Informações</div>
          <div className="row-full" style={{ fontSize: '10px' }}>
            Este comprovante documenta a saída de dinheiro do caixa operacional.
          </div>
          <div className="row-full" style={{ fontSize: '10px', marginTop: '5px' }}>
            Operação devidamente autorizada e registrada no sistema.
          </div>
          <div className="row-full" style={{ fontSize: '10px', marginTop: '5px' }}>
            Confira os dados e mantenha este comprovante arquivado.
          </div>
        </div>

        {/* Assinaturas */}
        <div className="signatures">
          <div className="section-title">Assinaturas e Confirmações</div>
          
          <div style={{ marginTop: '20px' }}>
            <div className="signature-line"></div>
            <div className="signature-label">OPERADOR DE CAIXA</div>
            <div className="signature-label">{receiptData.cashierName}</div>
          </div>

          <div style={{ marginTop: '25px' }}>
            <div className="signature-line"></div>
            <div className="signature-label">SUPERVISOR/AUTORIZAÇÃO</div>
            <div className="signature-label">{receiptData.authorizedBy}</div>
          </div>

          {receiptData.recipient && (
            <div style={{ marginTop: '25px' }}>
              <div className="signature-line"></div>
              <div className="signature-label">BENEFICIÁRIO/RECEBEDOR</div>
              <div className="signature-label">{receiptData.recipient}</div>
            </div>
          )}

          <div style={{ marginTop: '25px' }}>
            <div className="signature-line"></div>
            <div className="signature-label">TESTEMUNHA (se necessário)</div>
            <div className="signature-label">Nome: ___________________________</div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>AABB - Sistema de Gestão v1.0</div>
          <div>Documento gerado automaticamente</div>
          <div>{format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
          <div style={{ marginTop: '10px', fontSize: '8px' }}>
            ⚠️ Este documento possui valor legal e deve ser arquivado
          </div>
        </div>
      </div>

      {/* Botão de impressão */}
      <div className="flex justify-center mt-6 no-print">
        <button
          onClick={handlePrint}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          <span>Imprimir Comprovante</span>
        </button>
      </div>
    </div>
  );
};

export default CashWithdrawalReceipt;