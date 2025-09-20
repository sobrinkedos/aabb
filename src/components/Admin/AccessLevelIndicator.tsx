import React from 'react';
import { Crown, Shield, Users, User } from 'lucide-react';
import { PapelUsuario } from '../../types/multitenant';
import { PrivilegeUtils } from '../../utils/privilegeUtils';

interface AccessLevelIndicatorProps {
  papel: PapelUsuario;
  isPrimeiroUsuario?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AccessLevelIndicator({
  papel,
  isPrimeiroUsuario = false,
  showDescription = false,
  size = 'md',
  className = ''
}: AccessLevelIndicatorProps) {
  const getIcon = () => {
    switch (papel) {
      case PapelUsuario.SUPER_ADMIN:
        return <Crown className={`${getSizeClasses().icon} text-red-600`} />;
      case PapelUsuario.ADMIN:
        return <Shield className={`${getSizeClasses().icon} text-orange-600`} />;
      case PapelUsuario.MANAGER:
        return <Users className={`${getSizeClasses().icon} text-blue-600`} />;
      case PapelUsuario.USER:
        return <User className={`${getSizeClasses().icon} text-gray-600`} />;
      default:
        return <User className={`${getSizeClasses().icon} text-gray-600`} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-6 h-6',
          text: 'text-base'
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
    }
  };

  const getColorClasses = () => {
    switch (papel) {
      case PapelUsuario.SUPER_ADMIN:
        return 'bg-red-100 text-red-800 border-red-200';
      case PapelUsuario.ADMIN:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case PapelUsuario.MANAGER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case PapelUsuario.USER:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDescription = () => {
    switch (papel) {
      case PapelUsuario.SUPER_ADMIN:
        return 'Acesso total ao sistema';
      case PapelUsuario.ADMIN:
        return 'Acesso administrativo limitado';
      case PapelUsuario.MANAGER:
        return 'Gerenciamento de usuários';
      case PapelUsuario.USER:
        return 'Acesso básico';
      default:
        return 'Nível não definido';
    }
  };

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${getSizeClasses().container} ${getColorClasses()} ${className}`}>
      {getIcon()}
      <span className={`ml-1.5 ${getSizeClasses().text}`}>
        {PrivilegeUtils.getDescricaoPapel(papel)}
        {isPrimeiroUsuario && size !== 'sm' && (
          <span className="ml-1 text-xs opacity-75">(Principal)</span>
        )}
      </span>
      
      {showDescription && (
        <span className={`ml-2 opacity-75 ${getSizeClasses().text}`}>
          • {getDescription()}
        </span>
      )}
    </div>
  );
}

// Componente para mostrar comparação de níveis
export function AccessLevelComparison({ className = '' }: { className?: string }) {
  const levels = [
    PapelUsuario.SUPER_ADMIN,
    PapelUsuario.ADMIN,
    PapelUsuario.MANAGER,
    PapelUsuario.USER
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Níveis de Acesso no Sistema
      </h4>
      
      {levels.map((papel, index) => (
        <div key={papel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500 w-6">
              {index + 1}
            </div>
            <AccessLevelIndicator 
              papel={papel} 
              isPrimeiroUsuario={papel === PapelUsuario.SUPER_ADMIN}
              showDescription={true}
              size="sm"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            {papel === PapelUsuario.SUPER_ADMIN && 'Primeiro usuário da empresa'}
            {papel === PapelUsuario.ADMIN && 'Criado por SUPER_ADMIN'}
            {papel === PapelUsuario.MANAGER && 'Criado por ADMIN+'}
            {papel === PapelUsuario.USER && 'Criado por MANAGER+'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para mostrar privilégios de um papel
export function RolePrivilegesDisplay({ 
  papel, 
  className = '' 
}: { 
  papel: PapelUsuario; 
  className?: string; 
}) {
  const privilegios = PrivilegeUtils.getPrivilegiosAtivos(papel);
  
  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <AccessLevelIndicator papel={papel} size="sm" />
        <span className="text-sm font-medium text-gray-900">
          Privilégios Ativos
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {privilegios.map((privilegio) => (
          <div key={privilegio} className="flex items-center text-sm text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {PrivilegeUtils.getDescricaoPrivilegio(privilegio)}
          </div>
        ))}
      </div>
      
      {privilegios.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          Nenhum privilégio administrativo
        </div>
      )}
    </div>
  );
}