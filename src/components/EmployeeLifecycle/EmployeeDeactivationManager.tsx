/**
 * Gerenciador de Desativação de Funcionários
 * 
 * Sistema completo para desativar funcionários com soft delete,
 * desativação de credenciais e trilha de auditoria
 */

import React, { useState, useEffect } from 'react';
import { 
  UserX, AlertTriangle, CheckCircle, Clock, 
  Shield, Key, FileText, Calendar, User,
  RefreshCw, Archive, Trash2, Eye, EyeOff
} from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { useBarEmployees } from '../../hooks/useBarEmployees';

// ============================================================================
// INTERFACES
// ============================================================================

interface EmployeeDeactivationManagerProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: DeactivationResult) => void;
}

interface DeactivationResult {
  success: boolean;
  employeeId: string;
  deactivationType: 'temporary' | 'permanent';
  reason: string;
  effectiveDate: string;
  credentialsDisabled: boolean;
  dataRetained: boolean;
}

interface DeactivationOptions {
  type: 'temporary' | 'permanent';
  reason: string;
  effectiveDate: string;
  disableCredentials: boolean;
  retainData: boolean;
  notifyEmployee: boolean;
  transferResponsibilities: boolean;
  notes: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  bar_role: string;
  is_active: boolean;
  start_date?: string;
  employee?: {
    name: string;
    email?: string;
  };
  usuario_empresa?: {
    nome_completo: string;
    email: string;
    tem_acesso_sistema: boolean;
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const EmployeeDeactivationManager: React.FC<EmployeeDeactivationManagerProps> = ({
  employeeId,
  isOpen,
  onClose,
  onComplete
}) => {
  const { getEmployeeById } = useBarEmployees();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'confirm' | 'options' | 'processing' | 'complete'>('confirm');
  
  const [options, setOptions] = useState<DeactivationOptions>({
    type: 'temporary',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    disableCredentials: true,
    retainData: true,
    notifyEmployee: false,
    transferResponsibilities: false,
    notes: ''
  });

  const [deactivationResult, setDeactivationResult] = useState<DeactivationResult | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && employeeId) {
      loadEmployeeData();
    }
  }, [isOpen, employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const employeeData = await getEmployeeById(employeeId);
      if (!employeeData) {
        throw new Error('Funcionário não encontrado');
      }
      setEmployee(employeeData);

      // Verificar transações pendentes e turnos ativos
      await checkPendingItems(employeeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingItems = async (employeeData: Employee) => {
    try {
      // Simular verificação de transações pendentes
      // Em um sistema real, isso consultaria tabelas de pedidos, vendas, etc.
      const mockTransactions = [
        {
          id: '1',
          type: 'Pedido em andamento',
          description: 'Mesa 5 - Pedido #123',
          amount: 'R$ 45,90',
          status: 'preparing'
        }
      ];

      // Simular verificação de turnos ativos
      const mockShifts = [
        {
          id: '1',
          date: new Date().toISOString().split('T')[0],
          startTime: '14:00',
          endTime: null,
          status: 'active'
        }
      ];

      setPendingTransactions(mockTransactions);
      setActiveShifts(mockShifts);
    } catch (err) {
      console.error('Erro ao verificar itens pendentes:', err);
    }
  };

  // ============================================================================
  // PROCESSO DE DESATIVAÇÃO
  // ============================================================================

  const handleDeactivation = async () => {
    try {
      setProcessing(true);
      setStep('processing');
      setError(null);

      const result: DeactivationResult = {
        success: false,
        employeeId,
        deactivationType: options.type,
        reason: options.reason,
        effectiveDate: options.effectiveDate,
        credentialsDisabled: false,
        dataRetained: options.retainData
      };

      // 1. Desativar funcionário na tabela bar_employees
      await deactivateBarEmployee();

      // 2. Desativar credenciais se solicitado
      if (options.disableCredentials && employee?.employee_id) {
        await disableUserCredentials();
        result.credentialsDisabled = true;
      }

      // 3. Criar registro de auditoria
      await createAuditLog();

      // 4. Atualizar status baseado no tipo
      if (options.type === 'permanent') {
        await markAsPermanentlyDeactivated();
      }

      result.success = true;
      setDeactivationResult(result);
      setStep('complete');

      onComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na desativação');
      setStep('options');
    } finally {
      setProcessing(false);
    }
  };

  const deactivateBarEmployee = async () => {
    const updateData: any = {
      is_active: false,
      end_date: options.effectiveDate,
      updated_at: new Date().toISOString()
    };

    // Adicionar notas de desativação
    const currentNotes = employee?.notes || '';
    const deactivationNote = `\n[DESATIVADO em ${new Date().toLocaleDateString('pt-BR')}] Motivo: ${options.reason}. Tipo: ${options.type}. ${options.notes ? `Observações: ${options.notes}` : ''}`;
    updateData.notes = currentNotes + deactivationNote;

    const { error } = await supabase
      .from('bar_employees')
      .update(updateData)
      .eq('id', employeeId);

    if (error) throw error;
  };

  const disableUserCredentials = async () => {
    if (!employee?.employee_id) return;

    try {
      // Desativar usuário no Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        employee.employee_id,
        { 
          banned_until: options.type === 'permanent' ? '2099-12-31' : undefined,
          user_metadata: {
            ...employee.usuario_empresa,
            deactivated: true,
            deactivation_date: options.effectiveDate,
            deactivation_reason: options.reason
          }
        }
      );

      if (authError) throw authError;

      // Desativar na tabela usuarios_empresa
      const { error: dbError } = await supabase
        .from('usuarios_empresa')
        .update({
          ativo: false,
          tem_acesso_sistema: false,
          status: options.type === 'permanent' ? 'desativado_permanente' : 'desativado_temporario',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', employee.employee_id);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Erro ao desativar credenciais:', error);
      throw error;
    }
  };

  const createAuditLog = async () => {
    // Em um sistema real, isso criaria um registro na tabela de auditoria
    const auditData = {
      employee_id: employeeId,
      action: 'employee_deactivation',
      details: {
        type: options.type,
        reason: options.reason,
        effective_date: options.effectiveDate,
        credentials_disabled: options.disableCredentials,
        data_retained: options.retainData,
        notes: options.notes
      },
      performed_by: 'current_user', // Em um sistema real, seria o ID do usuário atual
      timestamp: new Date().toISOString()
    };

    console.log('Audit log created:', auditData);
  };

  const markAsPermanentlyDeactivated = async () => {
    // Marcar como permanentemente desativado
    const { error } = await supabase
      .from('bar_employees')
      .update({
        status: 'permanently_deactivated',
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId);

    if (error) throw error;
  };

  // ============================================================================
  // REATIVAÇÃO
  // ============================================================================

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
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (barError) throw barError;

      // Reativar credenciais se existirem
      if (employee?.employee_id) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          employee.employee_id,
          { 
            banned_until: null,
            user_metadata: {
              ...employee.usuario_empresa,
              deactivated: false,
              reactivated_date: new Date().toISOString()
            }
          }
        );

        if (authError) console.error('Erro ao reativar auth:', authError);

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

      // Criar log de auditoria
      await createAuditLog();

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
  const email = employeeData?.email || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserX className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {employee?.is_active ? 'Desativar Funcionário' : 'Reativar Funcionário'}
              </h2>
              <p className="text-gray-600">{name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {!loading && employee && (
            <>
              {/* Se funcionário está ativo - mostrar opções de desativação */}
              {employee.is_active && (
                <>
                  {/* Step 1: Confirmação */}
                  {step === 'confirm' && (
                    <div className="space-y-6">
                      {/* Avisos sobre itens pendentes */}
                      {(pendingTransactions.length > 0 || activeShifts.length > 0) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <h3 className="font-medium text-yellow-800">Atenção: Itens Pendentes</h3>
                          </div>
                          
                          {pendingTransactions.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm text-yellow-700 mb-2">Transações pendentes:</p>
                              {pendingTransactions.map(transaction => (
                                <div key={transaction.id} className="text-sm text-yellow-600 ml-4">
                                  • {transaction.description} - {transaction.amount}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {activeShifts.length > 0 && (
                            <div>
                              <p className="text-sm text-yellow-700 mb-2">Turnos ativos:</p>
                              {activeShifts.map(shift => (
                                <div key={shift.id} className="text-sm text-yellow-600 ml-4">
                                  • Turno iniciado às {shift.startTime} (ainda não finalizado)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-center">
                        <UserX className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Confirmar Desativação
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Você está prestes a desativar o funcionário <strong>{name}</strong>.
                          Esta ação pode ser revertida posteriormente.
                        </p>
                        
                        <div className="flex space-x-3 justify-center">
                          <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => setStep('options')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Continuar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Opções de desativação */}
                  {step === 'options' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">Opções de Desativação</h3>
                      
                      {/* Tipo de desativação */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Desativação
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="temporary"
                              checked={options.type === 'temporary'}
                              onChange={(e) => setOptions(prev => ({ ...prev, type: e.target.value as any }))}
                              className="mr-2"
                            />
                            <span className="text-sm">Temporária (pode ser reativado facilmente)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="permanent"
                              checked={options.type === 'permanent'}
                              onChange={(e) => setOptions(prev => ({ ...prev, type: e.target.value as any }))}
                              className="mr-2"
                            />
                            <span className="text-sm">Permanente (desligamento definitivo)</span>
                          </label>
                        </div>
                      </div>

                      {/* Motivo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motivo da Desativação *
                        </label>
                        <select
                          value={options.reason}
                          onChange={(e) => setOptions(prev => ({ ...prev, reason: e.target.value }))}
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

                      {/* Data efetiva */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data Efetiva
                        </label>
                        <input
                          type="date"
                          value={options.effectiveDate}
                          onChange={(e) => setOptions(prev => ({ ...prev, effectiveDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Opções adicionais */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Opções Adicionais</h4>
                