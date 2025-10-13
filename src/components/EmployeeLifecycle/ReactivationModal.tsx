/**
 * Modal de Reativação de Funcionários
 */

import React, { useState } from 'react';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReactivationModalProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ReactivationModal: React.FC<ReactivationModalProps> = ({
  employee,
  isOpen,
  onClose,
  onComplete
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleReactivation = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Reativar funcionário
      const { error: barError } = await supabase
        .from('bar_employees')
        .update({
          is_active: true,
          end_date: null,
          notes: `${employee.notes || ''}\n[REATIVADO em ${new Date().toLocaleDateString('pt-BR')}] ${notes}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (barError) throw barError;

      // Reativar credenciais se existirem
      if (employee.employee_id) {
        const { error: dbError } = await supabase
          .from('usuarios_empresa')
          .update({
            ativo: true,
            tem_acesso_sistema: true,
            status: 'ativo',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', employee.employee_id);

        if (dbError) console.error('Erro ao reativar usuário:', dbError);
      }

      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na reativação');
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
          <UserCheck className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reativar Funcionário</h2>
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações da Reativação
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Motivo da reativação..."
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
            onClick={handleReactivation}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? 'Reativando...' : 'Reativar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactivationModal;