/**
 * Modal de Desativação de Funcionários
 * 
 * Interface para desativar funcionários com soft delete e trilha de auditoria
 */

import React, { useState } from 'react';
import { UserX, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

interface DeactivationModalProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface DeactivationData {
  reason: string;
  effectiveDate: string;
  disableCredentials: boolean;
  notes: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const DeactivationModal: React.FC<DeactivationModalProps> = ({
  employee,
  isOpen,
  onClose,
  onComplete
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DeactivationData>({
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    disableCredentials: true,
    notes: ''
  });

  const handleDeactivation = async () => {
    try {
      setProcessing(true);
      setError(null);

      // 1. Desativar funcionário
      const { error: barError } = await supabase
        .from('bar_employees')
        .update({
          is_active: false,
          end_date: data.effectiveDate,
          notes: `${employee.notes || ''}\n[DESATIVADO em ${new Date().toLocaleDateString('pt-BR')}] Motivo: ${data.reason}. ${data.notes}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (barError) throw barError;

      // 2. Desativar credenciais se solicitado
      if (data.disableCredentials && employee.employee_id) {
        const { error: dbError } = await supabase
          .from('usuarios_empresa')
          .update({
            ativo: false,
            tem_acesso_sistema: false,
            status: 'desativado',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', employee.employee_id);

        if (dbError) console.error('Erro ao desativar usuário:', dbError);
      }

      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na desativação');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const employeeData = employee?.employee || employee?.usuario_empresa;
  const name = employeeData?.name || employeeData?.nome_completo || 'Funcionário';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <UserX className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Desativar Funcionário</h2>
            <p className="text-gray-600">{name}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Desativação *
            </label>
            <select
              value={data.reason}
              onChange={(e) => setData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um motivo</option>
              <option value="demissao">Demissão</option>
              <option value="pedido_demissao">Pedido de Demissão</option>
              <option value="licenca">Licença</option>
              <option value="afastamento">Afastamento</option>
              <option value="suspensao">Suspensão</option>
              <option value="fim_contrato">Fim de Contrato</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Efetiva
            </label>
            <input
              type="date"
              value={data.effectiveDate}
              onChange={(e) => setData(prev => ({ ...prev, effectiveDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.disableCredentials}
                onChange={(e) => setData(prev => ({ ...prev, disableCredentials: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Desativar acesso ao sistema</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={data.notes}
              onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeactivation}
            disabled={processing || !data.reason}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivationModal;