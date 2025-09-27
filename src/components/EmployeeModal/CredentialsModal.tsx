import React, { useState } from 'react';
import { X, Key, Shield, Save } from 'lucide-react';

interface CredentialsData {
  tem_acesso_sistema: boolean;
  permissoes_modulos: {
    [key: string]: {
      visualizar: boolean;
      criar: boolean;
      editar: boolean;
      excluir: boolean;
      administrar: boolean;
    };
  };
}

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credentials: CredentialsData) => Promise<void>;
  employeeName: string;
  employeeRole: string;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeName,
  employeeRole
}) => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsData>({
    tem_acesso_sistema: true,
    permissoes_modulos: {}
  });

  // Definir permissões padrão baseadas no role
  const getDefaultPermissions = (role: string) => {
    const rolePermissions: Record<string, any> = {
      'atendente': {
        gestao_caixa: { visualizar: true, criar: true, editar: true, excluir: true, administrar: false }
      },
      'garcom': {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
        atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false },
        clientes: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
      },
      'cozinheiro': {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false },
        monitor_cozinha: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
      },
      'gerente': {
        dashboard: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        monitor_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        atendimento_bar: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        monitor_cozinha: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        gestao_caixa: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        clientes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        funcionarios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true },
        relatorios: { visualizar: true, criar: true, editar: true, excluir: true, administrar: true }
      }
    };

    return rolePermissions[role] || {
      dashboard: { visualizar: true, criar: false, editar: false, excluir: false, administrar: false }
    };
  };

  // Inicializar com permissões padrão quando o modal abrir
  React.useEffect(() => {
    if (isOpen) {
      const defaultPermissions = getDefaultPermissions(employeeRole);
      setCredentials({
        tem_acesso_sistema: true,
        permissoes_modulos: defaultPermissions
      });
    }
  }, [isOpen, employeeRole]);

  const modules = [
    { key: 'dashboard', name: 'Dashboard', icon: '📊' },
    { key: 'monitor_bar', name: 'Monitor Bar', icon: '🍺' },
    { key: 'atendimento_bar', name: 'Atendimento Bar', icon: '🍽️' },
    { key: 'monitor_cozinha', name: 'Monitor Cozinha', icon: '👨‍🍳' },
    { key: 'gestao_caixa', name: 'Gestão de Caixa', icon: '💰' },
    { key: 'clientes', name: 'Clientes', icon: '👥' },
    { key: 'funcionarios', name: 'Funcionários', icon: '👔' },
    { key: 'relatorios', name: 'Relatórios', icon: '📈' },
    { key: 'configuracoes', name: 'Configurações', icon: '⚙️' }
  ];

  const permissions = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];
  const permissionLabels = {
    visualizar: 'Ver',
    criar: 'Criar',
    editar: 'Editar',
    excluir: 'Excluir',
    administrar: 'Admin'
  };

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setCredentials(prev => ({
      ...prev,
      permissoes_modulos: {
        ...prev.permissoes_modulos,
        [module]: {
          ...prev.permissoes_modulos[module],
          [permission]: value
        }
      }
    }));
  };

  const handleModuleToggle = (module: string, enabled: boolean) => {
    if (enabled) {
      // Adicionar módulo com permissões padrão
      const defaultModulePermissions = getDefaultPermissions(employeeRole)[module] || {
        visualizar: true, criar: false, editar: false, excluir: false, administrar: false
      };
      
      setCredentials(prev => ({
        ...prev,
        permissoes_modulos: {
          ...prev.permissoes_modulos,
          [module]: defaultModulePermissions
        }
      }));
    } else {
      // Remover módulo
      const newPermissions = { ...credentials.permissoes_modulos };
      delete newPermissions[module];
      
      setCredentials(prev => ({
        ...prev,
        permissoes_modulos: newPermissions
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(credentials);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCredentials({
      tem_acesso_sistema: true,
      permissoes_modulos: {}
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Key className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Criar Credenciais de Acesso
                  </h3>
                  <p className="text-sm text-gray-600">
                    {employeeName} - {employeeRole}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                <strong>Etapa 2:</strong> Definir credenciais e permissões de acesso ao sistema.
                As permissões foram pré-configuradas baseadas na função do funcionário.
              </p>
            </div>

            {/* Acesso ao Sistema */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={credentials.tem_acesso_sistema}
                    onChange={(e) => setCredentials(prev => ({ ...prev, tem_acesso_sistema: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Permitir acesso ao sistema
                  </span>
                </label>
              </div>
            </div>

            {/* Permissões por Módulo */}
            {credentials.tem_acesso_sistema && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Permissões por Módulo</h4>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {modules.map(module => {
                    const hasModule = credentials.permissoes_modulos[module.key];
                    
                    return (
                      <div key={module.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{module.icon}</span>
                            <span className="font-medium text-gray-900">{module.name}</span>
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={!!hasModule}
                              onChange={(e) => handleModuleToggle(module.key, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                        
                        {hasModule && (
                          <div className="grid grid-cols-5 gap-2 ml-8">
                            {permissions.map(permission => (
                              <label key={permission} className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={hasModule[permission] || false}
                                  onChange={(e) => handlePermissionChange(module.key, permission, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 text-xs"
                                />
                                <span className="text-xs text-gray-600">
                                  {permissionLabels[permission as keyof typeof permissionLabels]}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full inline-flex justify-center items-center space-x-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Criando...' : 'Criar Credenciais'}</span>
            </button>
            <button
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};