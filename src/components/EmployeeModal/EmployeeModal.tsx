import React, { useEffect } from 'react';
import { X, Save, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Employee } from '../../types/employee.types';
import { useEmployeeForm } from '../../hooks/useEmployeeForm';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { PersonalInfoSection } from './PersonalInfoSection';
import { RoleSection } from './RoleSection';
import { PermissionsSection } from './PermissionsSection';
import { CredentialsSection } from './CredentialsSection';
import { SavingProgress } from './SavingProgress';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => Promise<void>;
  employee?: Employee;
  mode: 'create' | 'edit';
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee: initialEmployee,
  mode
}) => {
  const {
    employee,
    state,
    updateField,
    togglePermission,
    handleSave,
    handleCancel,
    resetForm,
    setEmployeeCredentials
  } = useEmployeeForm({
    initialEmployee,
    onSave,
    onClose
  });

  const { isOnline, wasOffline } = useNetworkStatus();

  // Reset form when modal opens for create mode
  useEffect(() => {
    if (isOpen && mode === 'create' && !initialEmployee) {
      resetForm();
    }
  }, [isOpen, mode, initialEmployee, resetForm]);



  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = document.getElementById('employee-modal');
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          id="employee-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-modal-title"
          aria-describedby="employee-modal-description"
          className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header - Sticky */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="employee-modal-title" className="text-xl font-bold text-gray-900">
                  {mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
                </h2>
                <p id="employee-modal-description" className="text-sm text-gray-600 mt-1">
                  {mode === 'create' 
                    ? 'Cadastre um novo funcionário e configure suas permissões'
                    : 'Edite as informações e permissões do funcionário'
                  }
                </p>
              </div>
              
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              {state.isDirty && (
                <div className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Há alterações não salvas</span>
                </div>
              )}
              
              {/* Indicador de conectividade */}
              <div className={`text-xs flex items-center space-x-1 ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Sem conexão</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div 
            className="overflow-y-auto px-6 py-6 space-y-8"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
            data-testid="modal-body"
          >
            {/* Network Status Warning */}
            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <WifiOff className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-orange-800 font-medium">Sem conexão com a internet</p>
                    <p className="text-orange-700 text-sm">
                      Verifique sua conexão antes de tentar salvar o funcionário.
                    </p>
                  </div>
                </div>
              </div>
            )}



            {/* Error Display */}
            {state.errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800">{state.errors.general}</p>
                </div>
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
            />

            {/* Credentials Section - Only for create mode */}
            {mode === 'create' && (
              <CredentialsSection
                employee={employee}
                onCredentialsGenerated={setEmployeeCredentials}
                mode={mode}
              />
            )}
          </div>

          {/* Footer - Sticky */}
          <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
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
                  onClick={handleCancel}
                  disabled={state.saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={state.saving || !state.isValid || state.errors.fields.length > 0}
                  className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                    !isOnline 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title={!isOnline ? 'Salvará offline e sincronizará quando a conexão for restaurada' : ''}
                >
                  {state.saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{mode === 'edit' ? 'Salvando alterações...' : 'Cadastrando funcionário...'}</span>
                    </>
                  ) : !isOnline ? (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Salvar Offline</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{mode === 'create' ? 'Cadastrar' : 'Salvar'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saving Progress Overlay */}
      <SavingProgress 
        isVisible={state.saving}
        mode={mode}
        isOnline={isOnline}
      />
    </div>
  );
};