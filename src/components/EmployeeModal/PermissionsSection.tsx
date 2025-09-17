import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Smartphone, Check } from 'lucide-react';
import { Employee, Permission } from '../../types/employee.types';
import { ROLE_PRESETS, getModuleDisplayName, getActionDisplayName } from '../../utils/permissionPresets';

interface PermissionsSectionProps {
  employee: Partial<Employee>;
  onTogglePermission: (permissionId: string) => void;
}

export const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  employee,
  onTogglePermission
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['app-garcom']));

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const hasPermission = (permissionId: string): boolean => {
    return employee.permissions?.some(p => p.id === permissionId) || false;
  };

  const getAvailablePermissions = (): Permission[] => {
    if (!employee.role) return [];
    return ROLE_PRESETS[employee.role]?.permissions || [];
  };

  const groupPermissionsByModule = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    
    return grouped;
  };

  const availablePermissions = getAvailablePermissions();
  const groupedPermissions = groupPermissionsByModule(availablePermissions);

  const getModuleIcon = (module: string) => {
    const icons: Record<string, string> = {
      bar: '🍺',
      kitchen: '🍳',
      cashier: '💰',
      reports: '📊',
      inventory: '📦',
      customers: '👥',
      settings: '⚙️',
      'app-garcom': '📱'
    };
    return icons[module] || '📋';
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      bar: 'bg-amber-50 border-amber-200',
      kitchen: 'bg-orange-50 border-orange-200',
      cashier: 'bg-green-50 border-green-200',
      reports: 'bg-blue-50 border-blue-200',
      inventory: 'bg-purple-50 border-purple-200',
      customers: 'bg-pink-50 border-pink-200',
      settings: 'bg-gray-50 border-gray-200',
      'app-garcom': 'bg-indigo-50 border-indigo-200'
    };
    return colors[module] || 'bg-gray-50 border-gray-200';
  };

  if (!employee.role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Permissões</h3>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Selecione uma função para configurar as permissões</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Permissões</h3>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-yellow-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-yellow-900">Permissões Personalizáveis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              As permissões abaixo foram aplicadas automaticamente baseadas na função selecionada. 
              Você pode personalizar marcando/desmarcando as opções conforme necessário.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([module, permissions]) => {
          const isExpanded = expandedModules.has(module);
          const modulePermissions = permissions.filter(p => hasPermission(p.id));
          const totalPermissions = permissions.length;
          const activePermissions = modulePermissions.length;
          
          return (
            <div key={module} className={`border rounded-lg ${getModuleColor(module)}`}>
              <div
                onClick={() => toggleModule(module)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getModuleIcon(module)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getModuleDisplayName(module)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {activePermissions} de {totalPermissions} permissões ativas
                    </p>
                  </div>
                  {module === 'app-garcom' && employee.role === 'waiter' && (
                    <div className="flex items-center space-x-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                      <Smartphone className="h-3 w-3" />
                      <span>App Mobile</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    {Math.round((activePermissions / totalPermissions) * 100)}%
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-current border-opacity-20 p-4 bg-white bg-opacity-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((permission) => {
                      const isActive = hasPermission(permission.id);
                      
                      return (
                        <div
                          key={permission.id}
                          onClick={() => onTogglePermission(permission.id)}
                          className={`
                            flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isActive 
                              ? 'bg-white border-2 border-blue-200 shadow-sm' 
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className={`
                            flex items-center justify-center w-5 h-5 rounded border-2 transition-colors
                            ${isActive 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300'
                            }
                          `}>
                            {isActive && <Check className="h-3 w-3 text-white" />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {getActionDisplayName(permission.action)}
                            </div>
                            {permission.resource && (
                              <div className="text-sm text-gray-600">
                                {permission.resource.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {module === 'app-garcom' && employee.role === 'waiter' && (
                    <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Smartphone className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-indigo-900">Acesso ao App Garçom</h5>
                          <p className="text-sm text-indigo-700 mt-1">
                            Este funcionário terá acesso ao aplicativo mobile para garçons, 
                            permitindo gerenciar mesas, pedidos e atendimento diretamente pelo celular.
                          </p>
                          <div className="mt-2 text-xs text-indigo-600">
                            • Limite de 2 dispositivos simultâneos<br/>
                            • Sincronização automática com o sistema principal<br/>
                            • Acesso offline limitado para consultas
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {availablePermissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhuma permissão disponível para esta função</p>
        </div>
      )}
    </div>
  );
};