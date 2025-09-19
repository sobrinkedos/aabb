import React, { useState } from 'react';
import { User, Role, Permission } from '../../types/admin';
import { ModuloSistema, PermissaoModulo } from '../../types/multitenant';

interface PermissionMatrixProps {
  users: User[];
  roles: Role[];
  onUpdatePermissions: (userId: string, permissions: Permission[]) => Promise<void>;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  users,
  roles,
  onUpdatePermissions
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<ModuloSistema, PermissaoModulo>>({} as any);
  const [isLoading, setIsLoading] = useState(false);

  const modules = Object.values(ModuloSistema);
  const actions: (keyof PermissaoModulo)[] = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Converter permissões do usuário para o formato da matriz
    const userPermissions: Record<ModuloSistema, PermissaoModulo> = {} as any;
    
    modules.forEach(module => {
      const userPermission = user.permissions.find(p => p.module === module);
      userPermissions[module] = {
        visualizar: userPermission?.actions.includes('visualizar') || false,
        criar: userPermission?.actions.includes('criar') || false,
        editar: userPermission?.actions.includes('editar') || false,
        excluir: userPermission?.actions.includes('excluir') || false,
        administrar: userPermission?.actions.includes('administrar') || false
      };
    });
    
    setPermissions(userPermissions);
  };

  const handlePermissionChange = (module: ModuloSistema, action: keyof PermissaoModulo, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      // Converter permissões da matriz para o formato do usuário
      const userPermissions: Permission[] = modules.map(module => ({
        module,
        actions: actions.filter(action => permissions[module]?.[action]),
        restrictions: {}
      }));

      await onUpdatePermissions(selectedUser.id, userPermissions);
      
      // Atualizar o usuário selecionado
      const updatedUser = { ...selectedUser, permissions: userPermissions };
      setSelectedUser(updatedUser);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
    } finally {
      setIsLoading(false);
    }
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
      <div>
        <h3 className="text-lg font-medium text-gray-900">Matriz de Permissões</h3>
        <p className="text-sm text-gray-600">
          Configure permissões específicas por usuário e módulo
        </p>
      </div>

      {/* User Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Usuário
        </label>
        <select
          value={selectedUser?.id || ''}
          onChange={(e) => {
            const user = users.find(u => u.id === e.target.value);
            if (user) handleUserSelect(user);
          }}
          className="block w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione um usuário</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* User Info */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{selectedUser.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedUser.email} • {selectedUser.role.name} • {selectedUser.department}
                </p>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Salvando...' : 'Salvar Permissões'}
              </button>
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  {actions.map(action => (
                    <th key={action} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getActionDisplayName(action)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modules.map(module => (
                  <tr key={module} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getModuleDisplayName(module)}
                    </td>
                    {actions.map(action => (
                      <td key={action} className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={permissions[module]?.[action] || false}
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

          {/* Permission Summary */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Resumo das Permissões</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="font-medium">Módulos com acesso total:</span>
                <span className="ml-1 text-green-600">
                  {modules.filter(m => permissions[m]?.administrar).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Módulos com escrita:</span>
                <span className="ml-1 text-blue-600">
                  {modules.filter(m => permissions[m]?.criar || permissions[m]?.editar).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Módulos somente leitura:</span>
                <span className="ml-1 text-yellow-600">
                  {modules.filter(m => permissions[m]?.visualizar && !permissions[m]?.criar && !permissions[m]?.editar).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Sem acesso:</span>
                <span className="ml-1 text-red-600">
                  {modules.filter(m => !permissions[m]?.visualizar).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedUser && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário selecionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecione um usuário acima para configurar suas permissões
            </p>
          </div>
        </div>
      )}
    </div>
  );
};