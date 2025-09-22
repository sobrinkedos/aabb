import React, { useState, useEffect } from 'react';
import { Badge, Info, Zap, Shield, Users, Settings } from 'lucide-react';
import { Employee, EmployeeRole } from '../../types/employee.types';
import { ROLE_PRESETS, getRoleDisplayName } from '../../utils/permissionPresets';
import { useEmployeeValidation } from '../../hooks/useEmployeeValidation';
import { permissionPresetManager } from '../../services/permission-presets';
import { BarRole } from '../../types/permissions';

interface RoleSectionProps {
  employee: Partial<Employee>;
  onUpdate: (field: keyof Employee, value: any) => void;
  errors: ReturnType<typeof useEmployeeValidation>['errors'];
}

export const RoleSection: React.FC<RoleSectionProps> = ({
  employee,
  onUpdate,
  errors
}) => {
  const getFieldError = (field: string) => {
    return errors.fields.find(error => error.field === field);
  };

  const [selectedRole, setSelectedRole] = useState<EmployeeRole | null>(employee.role || null);
  const [permissionPreview, setPermissionPreview] = useState<any>(null);

  // Mapear EmployeeRole para BarRole
  const mapToBarRole = (role: EmployeeRole): BarRole => {
    const roleMap: Record<EmployeeRole, BarRole> = {
      waiter: 'garcom',
      cook: 'cozinheiro',
      cashier: 'atendente',
      supervisor: 'barman',
      manager: 'gerente',
      admin: 'gerente'
    };
    return roleMap[role] || 'garcom';
  };

  const handleRoleChange = (role: EmployeeRole) => {
    setSelectedRole(role);
    onUpdate('role', role);
    
    // Aplicar preset de permissões automaticamente usando o novo sistema
    try {
      const barRole = mapToBarRole(role);
      const newPermissions = permissionPresetManager.getDefaultPermissions(barRole);
      
      // Converter para formato antigo se necessário
      const legacyPermissions = Object.entries(newPermissions).map(([module, permission]) => ({
        id: module,
        name: module,
        granted: permission.visualizar || permission.criar || permission.editar || permission.excluir || permission.administrar,
        level: permission.administrar ? 'admin' : 
               permission.excluir ? 'full' :
               permission.editar ? 'edit' :
               permission.criar ? 'create' : 'view'
      }));
      
      onUpdate('permissions', legacyPermissions);
      
      // Atualizar preview
      setPermissionPreview({
        role: barRole,
        config: permissionPresetManager.getRoleConfig(barRole),
        permissions: newPermissions
      });
    } catch (error) {
      console.error('Erro ao aplicar preset de permissões:', error);
      // Fallback para sistema antigo
      const preset = ROLE_PRESETS[role];
      if (preset) {
        onUpdate('permissions', [...preset.permissions]);
      }
    }
  };

  // Atualizar preview quando a função mudar
  useEffect(() => {
    if (selectedRole) {
      try {
        const barRole = mapToBarRole(selectedRole);
        const config = permissionPresetManager.getRoleConfig(barRole);
        const permissions = permissionPresetManager.getDefaultPermissions(barRole);
        
        setPermissionPreview({
          role: barRole,
          config,
          permissions
        });
      } catch (error) {
        console.error('Erro ao carregar preview de permissões:', error);
      }
    }
  }, [selectedRole]);

  const getRoleIcon = (role: EmployeeRole) => {
    const icons: Record<EmployeeRole, string> = {
      waiter: '🍽️',
      cook: '👨‍🍳',
      cashier: '💰',
      supervisor: '👥',
      manager: '👔',
      admin: '⚙️'
    };
    return icons[role];
  };

  const getRoleColor = (role: EmployeeRole) => {
    const colors: Record<EmployeeRole, string> = {
      waiter: 'bg-green-100 text-green-800 border-green-200',
      cook: 'bg-orange-100 text-orange-800 border-orange-200',
      cashier: 'bg-blue-100 text-blue-800 border-blue-200',
      supervisor: 'bg-purple-100 text-purple-800 border-purple-200',
      manager: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Badge className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Função e Cargo</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selecione a Função *
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ROLE_PRESETS).map(([roleKey, preset]) => {
            const role = roleKey as EmployeeRole;
            const isSelected = employee.role === role;
            
            return (
              <div
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                  ${isSelected 
                    ? `${getRoleColor(role)} border-current shadow-md` 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getRoleIcon(role)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {getRoleDisplayName(role)}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {preset.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-current rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {role === 'waiter' && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <div className="flex items-center space-x-1 text-xs">
                      <Info className="h-3 w-3" />
                      <span>Inclui acesso ao App Garçom</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {getFieldError('role') && (
          <p className="mt-2 text-sm text-red-600">{getFieldError('role')?.message}</p>
        )}
      </div>

      {permissionPreview && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">
                Permissões para {permissionPreview.config.displayName}
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                {permissionPreview.config.description}
              </p>
              
              {/* Resumo das permissões */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">
                    {Object.keys(permissionPreview.permissions).length} módulos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">
                    Nível {permissionPreview.config.hierarchy}/5
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">
                    {permissionPreview.config.accessLevel}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">
                    {permissionPreview.config.userType}
                  </span>
                </div>
              </div>

              {/* Módulos principais */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Módulos com acesso:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(permissionPreview.permissions).map(([module, permission]) => {
                    if (!permission.visualizar) return null;
                    
                    const getModuleIcon = (mod: string) => {
                      const icons: Record<string, string> = {
                        dashboard: '📊',
                        monitor_bar: '🍺',
                        atendimento_bar: '🍽️',
                        monitor_cozinha: '👨‍🍳',
                        gestao_caixa: '💰',
                        clientes: '👥',
                        funcionarios: '👔',
                        relatorios: '📈',
                        configuracoes: '⚙️',
                        estoque: '📦',
                        cardapio: '📋'
                      };
                      return icons[mod] || '📄';
                    };

                    const getPermissionLevel = (perm: any) => {
                      if (perm.administrar) return 'Admin';
                      if (perm.excluir) return 'Full';
                      if (perm.editar) return 'Edit';
                      if (perm.criar) return 'Create';
                      return 'View';
                    };

                    const getLevelColor = (level: string) => {
                      const colors: Record<string, string> = {
                        Admin: 'bg-red-100 text-red-700',
                        Full: 'bg-orange-100 text-orange-700',
                        Edit: 'bg-yellow-100 text-yellow-700',
                        Create: 'bg-blue-100 text-blue-700',
                        View: 'bg-gray-100 text-gray-700'
                      };
                      return colors[level] || 'bg-gray-100 text-gray-700';
                    };

                    const level = getPermissionLevel(permission);
                    
                    return (
                      <div
                        key={module}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getLevelColor(level)}`}
                        title={`${module}: ${level}`}
                      >
                        <span>{getModuleIcon(module)}</span>
                        <span className="capitalize">{module.replace('_', ' ')}</span>
                        <span className="font-medium">({level})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Capacidades especiais */}
              {permissionPreview.config.canManageRoles && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">Pode gerenciar:</p>
                  <div className="flex flex-wrap gap-1">
                    {permissionPreview.config.canManageRoles.map((role: string) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-xs text-blue-600 mt-3">
                <Zap className="h-3 w-3" />
                <span>Permissões aplicadas automaticamente. Personalize na próxima seção se necessário.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={employee.status || 'active'}
          onChange={(e) => onUpdate('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="suspended">Suspenso</option>
        </select>
      </div>
    </div>
  );
};