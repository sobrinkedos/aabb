import React, { useState } from 'react';
import { X, Save, User, Key, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Employee } from '../../types/employee.types';
import { useEmployeeForm } from '../../hooks/useEmployeeForm';
import { PersonalInfoSection } from './PersonalInfoSection';
import { RoleSection } from './RoleSection';
import { PermissionsSection } from './PermissionsSection';
import { CredentialsSection } from './CredentialsSection';

interface TwoStepEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee, credentials?: any) => Promise<void>;
  mode: 'create' | 'edit';
}

type Step = 'employee' | 'credentials';

export const TwoStepEmployeeModal: React.FC<TwoStepEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('employee');
  const [savedEmployee, setSavedEmployee] = useState<Employee | null>(null);
  const [employeeCredentials, setEmployeeCredentials] = useState<any>(null);

  const {
    employee,
    state,
    updateField,
    togglePermission,
    resetForm,
    setEmployeeCredentials: setCredentials
  } = useEmployeeForm({
    initialEmployee: undefined,
    onSave: async (emp: Employee) => {
      // No passo 1, apenas salvar localmente
      setSavedEmployee(emp);
      setCurrentStep('credentials');
    },
    onClose
  });

  const handleEmployeeSave = async () => {
    if (!state.isValid || state.errors.fields.length > 0) {
      return;
    }

    // Salvar funcionário e ir para próxima etapa
    setSavedEmployee(employee);
    setCurrentStep('credentials');
  };

  const handleCredentialsSave = async () => {
    if (!savedEmployee) return;

    try {
      // Chamar o onSave original com funcionário e credenciais
      await onSave(savedEmployee, employeeCredentials);
      
      // Resetar e fechar
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      alert('Erro ao salvar funcionário. Tente novamente.');
    }
  };

  const handleSkipCredentials = async () => {
    if (!savedEmployee) return;

    try {
      // Salvar funcionário sem credenciais
      await onSave(savedEmployee, null);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      alert('Erro ao salvar funcionário. Tente novamente.');
    }
  };

  const handleClose = () => {
    setCurrentStep('employee');
    setSavedEmployee(null);
    setEmployeeCredentials(null);
    resetForm();
    onClose();
  };

  const handleBackToEmployee = () => {
    setCurrentStep('employee');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentStep === 'employee' ? 'Novo Funcionário' : 'Configurar Credenciais'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {currentStep === 'employee' 
                    ? 'Cadastre os dados básicos do funcionário'
                    : 'Configure as credenciais de acesso (opcional)'
                  }
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-4 mt-4">
              <div className={`flex items-center space-x-2 ${
                currentStep === 'employee' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {currentStep === 'employee' ? (
                  <User className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">1. Dados do Funcionário</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-gray-400" />
              
              <div className={`flex items-center space-x-2 ${
                currentStep === 'credentials' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <Key className="h-5 w-5" />
                <span className="text-sm font-medium">2. Credenciais (Opcional)</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div 
            className="overflow-y-auto px-6 py-6 space-y-8"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {currentStep === 'employee' ? (
              <>
                {/* Error Display */}
                {state.errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{state.errors.general}</p>
                  </div>
                )}

                {/* Personal Info Section */}
                <PersonalInfoSection
                  employee={employee}
                  onUpdate={updateField}
                  errors={state.errors}
                />

                {/* Role Section */}
                <RoleSection
                  employee={employee}
                  onUpdate={updateField}
                  errors={state.errors}
                />

                {/* Permissions Section */}
                <PermissionsSection
                  employee={employee}
                  onTogglePermission={togglePermission}
                  mode={mode}
                />
              </>
            ) : (
              <>
                {/* Employee Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">Funcionário Configurado</h3>
                      <p className="text-green-700 text-sm">
                        {savedEmployee?.name} - {savedEmployee?.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Sobre as Credenciais</h3>
                  <p className="text-blue-700 text-sm">
                    Você pode criar credenciais de acesso agora ou fazer isso mais tarde. 
                    Se pular esta etapa, o funcionário será cadastrado apenas para controle interno, 
                    sem capacidade de fazer login no sistema.
                  </p>
                </div>

                {/* Credentials Section */}
                <CredentialsSection
                  employee={savedEmployee || {}}
                  onCredentialsGenerated={setEmployeeCredentials}
                  mode="create"
                  showCredentialsStep={true}
                />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
            {currentStep === 'employee' ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {state.errors.fields.length > 0 && (
                    <span className="text-red-600">
                      {state.errors.fields.length} erro(s) encontrado(s)
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleEmployeeSave}
                    disabled={!state.isValid || state.errors.fields.length > 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <span>Próximo</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToEmployee}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSkipCredentials}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Pular Credenciais
                  </button>
                  
                  <button
                    onClick={handleCredentialsSave}
                    disabled={!employeeCredentials}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Finalizar Cadastro</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};