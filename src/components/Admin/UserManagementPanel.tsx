import React, { useState, useEffect } from 'react';
import { User, Role, Permission } from '../../types/admin';
import { useUserManagement } from '../../hooks/useUserManagement';
import { PermissionMatrix } from './PermissionMatrix';
import { RoleEditor } from './RoleEditor';
import { AccessLogViewer } from './AccessLogViewer';
import { ValidatedForm, ValidatedInput, ValidatedSelect, ValidatedCheckbox } from './ValidatedForm';
import { UserFormSchema } from '../../schemas/admin.schemas';

interface UserManagementPanelProps {
  className?: string;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ className }) => {
  const {
    users,
    roles,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    updatePermissions
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'logs'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    department: '',
    roleId: '',
    isActive: true
  });

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData);
      setShowUserForm(false);
      setUserForm({ name: '', email: '', department: '', roleId: '', isActive: true });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error; // Re-throw para que o ValidatedForm possa capturar
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUser(userId, updates);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Usuários</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie usuários, funções e permissões do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'users', label: 'Usuários', count: users.length },
            { key: 'roles', label: 'Funções', count: roles.length },
            { key: 'permissions', label: 'Permissões' },
            { key: 'logs', label: 'Logs de Acesso' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'users' && (
          <div>
            {/* Users Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Usuários</h3>
                <p className="text-sm text-gray-600">Gerencie os usuários do sistema</p>
              </div>
              <button
                onClick={() => setShowUserForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Novo Usuário
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <RoleEditor
            roles={roles}
            onCreateRole={createRole}
            onUpdateRole={updateRole}
            onDeleteRole={deleteRole}
          />
        )}

        {activeTab === 'permissions' && (
          <PermissionMatrix
            users={users}
            roles={roles}
            onUpdatePermissions={updatePermissions}
          />
        )}

        {activeTab === 'logs' && (
          <AccessLogViewer />
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Usuário</h3>
              
              <ValidatedForm
                schema={UserFormSchema}
                initialData={userForm}
                onSubmit={handleCreateUser}
              >
                {({ data, updateField, getFieldError, isSubmitting, handleSubmit }) => (
                  <>
                    <ValidatedInput
                      label="Nome"
                      required
                      value={data.name}
                      onChange={(value) => updateField('name', value)}
                      error={getFieldError('name')}
                      placeholder="Digite o nome completo"
                    />
                    
                    <ValidatedInput
                      label="Email"
                      type="email"
                      required
                      value={data.email}
                      onChange={(value) => updateField('email', value)}
                      error={getFieldError('email')}
                      placeholder="Digite o email"
                    />
                    
                    <ValidatedInput
                      label="Departamento"
                      value={data.department}
                      onChange={(value) => updateField('department', value)}
                      error={getFieldError('department')}
                      placeholder="Digite o departamento"
                    />
                    
                    <ValidatedSelect
                      label="Função"
                      required
                      value={data.roleId}
                      onChange={(value) => updateField('roleId', value)}
                      error={getFieldError('roleId')}
                      options={roles.map(role => ({ value: role.id, label: role.name }))}
                      placeholder="Selecione uma função"
                    />
                    
                    <ValidatedCheckbox
                      label="Usuário ativo"
                      description="Usuário pode fazer login no sistema"
                      checked={data.isActive || false}
                      onChange={(checked) => updateField('isActive', checked)}
                      error={getFieldError('isActive')}
                    />
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowUserForm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                      </button>
                    </div>
                  </>
                )}
              </ValidatedForm>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};