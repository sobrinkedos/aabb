import React from 'react';
import { Badge, Info } from 'lucide-react';
import { Employee, EmployeeRole } from '../../types/employee.types';
import { ROLE_PRESETS, getRoleDisplayName } from '../../utils/permissionPresets';
import { useEmployeeValidation } from '../../hooks/useEmployeeValidation';

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

  const handleRoleChange = (role: EmployeeRole) => {
    onUpdate('role', role);
    
    // Aplicar preset de permissões automaticamente
    const preset = ROLE_PRESETS[role];
    if (preset) {
      onUpdate('permissions', [...preset.permissions]);
    }
  };

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

      {employee.role && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">
                Permissões para {getRoleDisplayName(employee.role)}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {ROLE_PRESETS[employee.role].description}
              </p>
              <div className="mt-2">
                <p className="text-xs text-blue-600">
                  As permissões serão aplicadas automaticamente. Você pode personalizá-las na seção seguinte.
                </p>
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