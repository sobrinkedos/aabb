/**
 * Modal de Remoção de Funcionários
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RemovalModalProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const RemovalModal: React.FC<RemovalModalProps> = ({
  employee,
  isOpen,
  onClose,
  onComplete
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');

  const handleRemoval = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Verificar confirmação
      if (confirmText !== 'REMOVER') {
        throw new Error('Digite REMOVER para confirmar');
      }

      // Remover funcionário
      const { error: removeError } = await supabase
        .from('bar_employees')
        .delete()
        .eq('id', employee.id);

      if (removeError) throw removeError;

      // Remover usuário se existir
      if (employee.employee_id) {
        const { error: userError } = await supabase
          .from('usuarios_empresa')
          .delete()
          .eq('user_id', employee.employee_id);

        if (userError) console.error('Erro ao remover usuário:', userError);
      }

      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na remoção');
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
        <div className="flex items-center space-x-3 mb-6">
          <Trash2 className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Remover Funcionário</h2>
            <p className="text-gray-600">{name}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Ação Irreversível</span>
          </div>
          <p className="text-sm text-red-700">
            Esta ação removerá permanentemente o funcionário do sistema.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Remoção *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um motivo</option>
              <option value="demissao_justa_causa">Demissão por Justa Causa</option>
              <option value="fim_contrato">Fim de Contrato</option>
              <option value="falecimento">Falecimento</option>
              <option value="limpeza_dados">Limpeza de Dados</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Digite "REMOVER" para confirmar *
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="REMOVER"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleRemoval}
            disabled={processing || !reason || confirmText !== 'REMOVER'}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemovalModal;