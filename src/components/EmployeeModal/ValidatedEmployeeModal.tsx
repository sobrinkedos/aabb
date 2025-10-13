/**
 * Modal de Funcionário com Validação Integrada
 * 
 * Versão aprimorada do EmployeeModal com validação em tempo real
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, User, Shield } from 'lucide-react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidatedField, CPFField, PhoneField, CommissionField } from '../Forms/ValidatedField';

// ============================================================================
// INTERFACES
// ============================================================================

interface ValidatedEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => Promise<void>;
  employee?: any;
  mode: 'create' | 'edit';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ValidatedEmployeeModal: React.FC<ValidatedEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
  mode
}) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'role' | 'system'>('personal');

  // Inicializar dados do formulário
  const initialData = employee ? {
    nome_completo: employee.employee?.name || employee.usuario_empresa?.nome_completo || '',
    email: employee.employee?.email || employee.usuario_empresa?.email || '',
    telefone: employee.employee?.phone || employee.usuario_empresa?.telefone || '',
    cpf: employee.employee?.cpf || '',
    bar_role: employee.bar_role || '',
    shift_preference: employee.shift_preference || 'qualquer',
    specialties: employee.specialties || [],
    commission_rate: employee.commission_rate || 0,
    tem_acesso_sistema: employee.usuario_empresa?.tem_acesso_sistema || false,
    observacoes: employee.notes || ''
  } : {};

  const {
    formState,
    isValid,
    isValidating,
    hasErrors,
    hasWarnings,
    errors,
    warnings,
    validateForm,
    getFieldProps,
    getFormData,
    resetForm
  } = useFormValidation(initialData, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300
  });

  // Reset form quando modal abre para criação
  useEffect(() => {
    if (isOpen && mode === 'create' && !employee) {
      resetForm();
    }
  }, [isOpen, mode, employee, resetForm]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      // Validar formulário completo
      const validationResult = await validateForm();
      
      if (!validationResult.isValid) {
        setSaveError('Por favor, corrija os erros antes de salvar');
        return;
      }

      // Preparar dados para salvar
      const formData = getFormData();
      await onSave(formData);
      
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erro ao salvar funcionário');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'create') {
      resetForm();
    }
    onClose();
  };

  if (!isOpen) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {mode === 'create' 
                ? 'Preencha os dados do novo funcionário' 
                : 'Atualize as informações do funcionário'
              }
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Validation Summary */}
        {(hasErrors || hasWarnings || saveError) && (
          <div className="p-4 border-b border-gray-200">
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 text-sm">{saveError}</span>
                </div>
              </div>
            )}

            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800 text-sm">Erros encontrados:</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasWarnings && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 text-sm">Avisos:</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'personal', label: 'Dados Pessoais', icon: User },
              { id: 'role', label: 'Função e Trabalho', icon: User },
              { id: 'system', label: 'Acesso ao Sistema', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Tab: Personal Info */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedField
                  label="Nome Completo"
                  required
                  {...getFieldProps('nome_completo')}
                  placeholder="Digite o nome completo"
                />

                <ValidatedField
                  label="Email"
                  type="email"
                  {...getFieldProps('email')}
                  placeholder="email@exemplo.com"
                />

                <PhoneField
                  label="Telefone"
                  {...getFieldProps('telefone')}
                />

                <CPFField
                  label="CPF"
                  {...getFieldProps('cpf')}
                />
              </div>

              <ValidatedField
                label="Observações"
                type="textarea"
                rows={4}
                {...getFieldProps('observacoes')}
                placeholder="Informações adicionais sobre o funcionário..."
              />
            </div>
          )}

          {/* Tab: Role and Work */}
          {activeTab === 'role' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedField
                  label="Função"
                  type="select"
                  required
                  {...getFieldProps('bar_role')}
                  options={[
                    { value: 'atendente', label: 'Atendente' },
                    { value: 'garcom', label: 'Garçom' },
                    { value: 'cozinheiro', label: 'Cozinheiro' },
                    { value: 'barman', label: 'Barman' },
                    { value: 'gerente', label: 'Gerente' }
                  ]}
                />

                <ValidatedField
                  label="Turno Preferido"
                  type="select"
                  {...getFieldProps('shift_preference')}
                  options={[
                    { value: 'manha', label: 'Manhã' },
                    { value: 'tarde', label: 'Tarde' },
                    { value: 'noite', label: 'Noite' },
                    { value: 'qualquer', label: 'Qualquer' }
                  ]}
                />

                <CommissionField
                  label="Taxa de Comissão (%)"
                  {...getFieldProps('commission_rate')}
                />
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'Drinks Clássicos', 'Coquetéis', 'Vinhos', 'Cervejas Artesanais',
                    'Café Especial', 'Atendimento VIP', 'Eventos', 'Delivery'
                  ].map(specialty => (
                    <label key={specialty} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(getFieldProps('specialties').value || []).includes(specialty)}
                        onChange={(e) => {
                          const current = getFieldProps('specialties').value || [];
                          const updated = e.target.checked
                            ? [...current, specialty]
                            : current.filter((s: string) => s !== specialty);
                          getFieldProps('specialties').onChange(updated);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: System Access */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Acesso ao Sistema</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Configure se este funcionário terá acesso ao sistema de gestão.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={getFieldProps('tem_acesso_sistema').value || false}
                    onChange={(e) => getFieldProps('tem_acesso_sistema').onChange(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Permitir acesso ao sistema</span>
                    <p className="text-sm text-gray-600">
                      O funcionário poderá fazer login e usar o sistema conforme suas permissões
                    </p>
                  </div>
                </label>

                {getFieldProps('tem_acesso_sistema').value && (
                  <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Permissões automáticas baseadas na função:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {getFieldProps('bar_role').value === 'gerente' && (
                        <>
                          <li>• Acesso completo a todos os módulos</li>
                          <li>• Gerenciamento de funcionários</li>
                          <li>• Relatórios e configurações</li>
                        </>
                      )}
                      {getFieldProps('bar_role').value === 'atendente' && (
                        <>
                          <li>• Atendimento e pedidos</li>
                          <li>• Gestão de clientes</li>
                          <li>• Dashboard básico</li>
                        </>
                      )}
                      {getFieldProps('bar_role').value === 'garcom' && (
                        <>
                          <li>• Atendimento de mesas</li>
                          <li>• Visualização de pedidos</li>
                          <li>• Dashboard básico</li>
                        </>
                      )}
                      {getFieldProps('bar_role').value === 'cozinheiro' && (
                        <>
                          <li>• Monitor da cozinha</li>
                          <li>• Gestão de pedidos</li>
                          <li>• Dashboard básico</li>
                        </>
                      )}
                      {getFieldProps('bar_role').value === 'barman' && (
                        <>
                          <li>• Monitor do bar</li>
                          <li>• Atendimento de pedidos</li>
                          <li>• Dashboard básico</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {isValidating && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Validando...</span>
              </div>
            )}
            
            {isValid && !isValidating && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Formulário válido</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValid || isValidating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatedEmployeeModal;