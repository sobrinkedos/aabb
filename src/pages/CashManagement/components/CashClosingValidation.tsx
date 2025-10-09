import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../types/cash-management';

interface ValidationItem {
  label: string;
  isValid: boolean;
  status: string;
  severity: 'success' | 'warning' | 'error';
}

interface CashClosingValidationProps {
  pendingOrders: number;
  cashAmount: number;
  transferEnabled: boolean;
  transferAmount: number;
  recipientName?: string;
  discrepancy: number;
  notes?: string;
}

export const CashClosingValidation: React.FC<CashClosingValidationProps> = ({
  pendingOrders,
  cashAmount,
  transferEnabled,
  transferAmount,
  recipientName,
  discrepancy,
  notes
}) => {
  const validations: ValidationItem[] = [
    // Validação 1: Pedidos Pendentes
    {
      label: 'Pedidos/Comandas',
      isValid: pendingOrders === 0,
      status: pendingOrders === 0 ? 'Nenhum pendente' : `${pendingOrders} pendente(s)`,
      severity: pendingOrders === 0 ? 'success' : 'warning'
    },
    // Validação 2: Transferência de Dinheiro
    {
      label: 'Transferência de Dinheiro',
      isValid: cashAmount === 0 || (transferEnabled && transferAmount === cashAmount && !!recipientName),
      status: cashAmount === 0 
        ? 'Sem dinheiro' 
        : (transferEnabled && transferAmount === cashAmount && recipientName)
          ? `${formatCurrency(cashAmount)} transferido` 
          : `${formatCurrency(cashAmount)} pendente`,
      severity: cashAmount === 0 || (transferEnabled && transferAmount === cashAmount && recipientName)
        ? 'success' 
        : 'error'
    },
    // Validação 3: Reconciliação
    {
      label: 'Reconciliação',
      isValid: Math.abs(discrepancy) < 5,
      status: Math.abs(discrepancy) < 0.01 
        ? 'Exato' 
        : `Diferença: ${formatCurrency(Math.abs(discrepancy))}`,
      severity: Math.abs(discrepancy) < 0.01 
        ? 'success'
        : Math.abs(discrepancy) < 5
          ? 'warning'
          : 'error'
    }
  ];

  // Validação 4: Justificativa (condicional)
  if (Math.abs(discrepancy) >= 5) {
    const minLength = Math.abs(discrepancy) >= 50 ? 10 : 5;
    validations.push({
      label: 'Justificativa',
      isValid: !!notes && notes.length >= minLength,
      status: notes && notes.length >= minLength ? 'Preenchida' : 'Obrigatória',
      severity: notes && notes.length >= minLength ? 'success' : 'error'
    });
  }

  const getSeverityColors = (severity: 'success' | 'warning' | 'error') => {
    switch (severity) {
      case 'success':
        return {
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        };
      case 'warning':
        return {
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'error':
        return {
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800'
        };
    }
  };

  const allValid = validations.every(v => v.isValid);
  const hasErrors = validations.some(v => v.severity === 'error');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Status de Validação</h3>
        {allValid ? (
          <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800">
            ✓ Pronto para fechar
          </span>
        ) : hasErrors ? (
          <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800">
            ✗ Pendências obrigatórias
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 text-yellow-800">
            ⚠ Atenção necessária
          </span>
        )}
      </div>
      
      {validations.map((validation, index) => {
        const colors = getSeverityColors(validation.severity);
        return (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className={`h-5 w-5 ${colors.icon}`} />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${colors.icon}`} />
              )}
              <span className="text-sm text-gray-700">{validation.label}</span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${colors.badge}`}>
              {validation.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};
