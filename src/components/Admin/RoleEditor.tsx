import React, { useState } from 'react';
import { Role, Permission } from '../../types/admin';
import { ModuloSistema, PermissaoModulo } from '../../types/multitenant';

interface RoleEditorProps {
  roles: Role[];
  onCreateRole: (role: Omit<Role, 'id'>) => Promise<void>;
  onUpdateRole: (roleId: string, updates: Partial<Role>) => Promise<void>;
  onDeleteRole: (roleId: string) => Promise<void>;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole
}) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    defaultPermissions: [] as Permission[]
  });

  const modules = Object.values(ModuloSistema);
  const actions: (keyof PermissaoModulo)[] = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];

  const handleCreateRole = async () => {
    setIsLoading(true);
    try {
      await onCreateRole(roleForm);
      setShowRoleForm(false);
      setRoleForm({ name: '', description: '', defaultPermissions: [] });
    } catch (error) {
      console.error('Erro ao criar função:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await onUpdateRole(selectedRole.id, roleForm);
      setSelectedRole(null);
      setIsEditing(false);
      setRoleForm({ name: '', description: '', defaultPermissions: [] });
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta função? Todos os usuários com esta função perderão suas permissões.')) {
      setIsLoading(true);
      try {
        await onDeleteRole(roleId);
      } catch (error) {
        console.error('Erro ao excluir função:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      defaultPermissions: role.defaultPermissions
    });
    setIsEditing(true);
    setShowRoleForm(true);
  };

  const handlePermissionChange = (module: ModuloSistema, action: keyof PermissaoModulo, value: boolean) => {
    setRoleForm(prev => {
      const permissions = [...prev.defaultPermissions];
      const existingPermissionIndex = permissions.findIndex(p => p.module === module);

      if (existingPermissionIndex >= 0) {
        const existingPermission = permissions[existingPermissionIndex];
        const updatedActions = value
          ? [...existingPermission.actions.filter(a => a !== action), action]
          : existingPermission.actions.filter(a => a !== action);

        if (updatedActions.length > 0) {
          permissions[existingPermissionIndex] = {
            ...existingPermission,
            actions: updatedActions
          };
        } else {
          permissions.splice(existingPermissionIndex, 1);
        }
      } else if (value) {
        permissions.push({
          module,
          actions: [action],
          restrictions: {}
        });
      }

      return { ...prev, defaultPermissions: permissions };
    });
  };

  const hasPermission = (module: ModuloSistema, action: keyof PermissaoModulo): boolean => {
    const permission = roleForm.defaultPermissions.find(p => p.module === module);
    return permission?.actions.includes(action) || false;
  };

  const getModuleDisplayName = (module: ModuloSistema): string => {
    const names: Record<ModuloSistema, string> = {
      [ModuloSistema.ATENDIMENTO_BAR]: 'Atendimento Bar',
      [ModuloSistema.CLIENTES]: 'Clientes',
      [ModuloSistema.FUNCIONARIOS]: 'Funcionários',
      [ModuloSistema.CONFIGURACOES]: 'Configurações',
      [ModuloSistema.RELATORIOS]: 'Relatórios',
      [ModuloSistema.FINANCEIRO]: 'Financeiro',
      [ModuloSistema.ESTOQUE]: 'Estoque',
      [ModuloSistema.COZINHA]: 'Cozinha'
    };
    return names[module] || module;
  };

  const getActionDisplayName = (action: keyof PermissaoModulo): string => {
    const names: Record<keyof PermissaoModulo, string> = {
      visualizar: 'Visualizar',
      criar: 'Criar',
      editar: 'Editar',
      excluir: 'Excluir',
      administrar: 'Administrar'
    };
    return names[action];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Funções e Perfis</h3>
          <p className="text-sm text-gray-600">
            Gerencie as funções do sistema e suas permissões padrão
          </p>
        </div>
        <button
          onClick={() => {
            setShowRoleForm(true);
            setIsEditing(false);
            setRoleForm({ name: '', description: '', defaultPermissions: [] });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Nova Função
        </button>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{role.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditRole(role)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Excluir
                </button>
              </div>
            </div>

            {/* Permission Summary */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Permissões:</div>
              <div className="flex flex-wrap gap-1">
                {role.defaultPermissions.map(permission => (
                  <span
                    key={permission.module}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {getModuleDisplayName(permission.module)}
                  </span>
                ))}
              </div>
              {role.defaultPermissions.length === 0 && (
                <span className="text-xs text-gray-400">Nenhuma permissão configurada</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Editar Função' : 'Nova Função'}
              </h3>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome da Função</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Gerente, Atendente, Administrador"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrição da função"
                    />
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Permissões Padrão</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Módulo
                            </th>
                            {actions.map(action => (
                              <th key={action} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                {getActionDisplayName(action)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {modules.map(module => (
                            <tr key={module}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {getModuleDisplayName(module)}
                              </td>
                              {actions.map(action => (
                                <td key={action} className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={hasPermission(module, action)}
                                    onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRoleForm(false);
                    setIsEditing(false);
                    setSelectedRole(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={isEditing ? handleUpdateRole : handleCreateRole}
                  disabled={isLoading || !roleForm.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar Função' : 'Criar Função')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};