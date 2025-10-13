import React from 'react';
import { Lock, Shield, AlertTriangle, Info } from 'lucide-react';
import { PapelUsuario } from '../../types/multitenant';
import { PrivilegeUtils } from '../../utils/privilegeUtils';

interface AccessDeniedFallbackProps {
  type?: 'role' | 'privilege' | 'configuration' | 'general';
  message?: string;
  showContactAdmin?: boolean;
  compact?: boolean;
  className?: string;
}

export function AccessDeniedFallback({
  type = 'general',
  message,
  showContactAdmin = true,
  compact = false,
  className = ''
}: AccessDeniedFallbackProps) {
  const getIcon = () => {
    switch (type) {
      case 'role':
        return <Shield className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-orange-500`} />;
      case 'privilege':
        return <Lock className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-red-500`} />;
      case 'configuration':
        return <AlertTriangle className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-yellow-500`} />;
      default:
        return <Info className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-gray-500`} />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'role':
        return 'Seu papel não tem acesso a esta funcionalidade';
      case 'privilege':
        return 'Privilégio necessário não encontrado';
      case 'configuration':
        return 'Configuração restrita ao seu nível';
      default:
        return 'Acesso não autorizado';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'role':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'privilege':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'configuration':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center px-3 py-2 rounded-md border ${getBgColor()} ${className}`}>
        {getIcon()}
        <span className="ml-2 text-sm font-medium">
          {message || getDefaultMessage()}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-6 ${getBgColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium mb-1">
            Acesso Restrito
          </h3>
          <p className="text-sm opacity-90 mb-3">
            {message || getDefaultMessage()}
          </p>
          {showContactAdmin && (
            <p className="text-xs opacity-75">
              Entre em contato com o administrador da empresa se você acredita que deveria ter acesso.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componentes específicos para diferentes tipos de restrição
export function RoleRestrictedFallback({ 
  requiredRole, 
  currentRole, 
  compact = false,
  className = '' 
}: {
  requiredRole: PapelUsuario;
  currentRole?: PapelUsuario;
  compact?: boolean;
  className?: string;
}) {
  const message = currentRole 
    ? `Requer papel ${PrivilegeUtils.getDescricaoPapel(requiredRole)}. Seu papel atual: ${PrivilegeUtils.getDescricaoPapel(currentRole)}`
    : `Requer papel ${PrivilegeUtils.getDescricaoPapel(requiredRole)}`;

  return (
    <AccessDeniedFallback
      type="role"
      message={message}
      compact={compact}
      className={className}
    />
  );
}

export function PrivilegeRestrictedFallback({ 
  privilege, 
  compact = false,
  className = '' 
}: {
  privilege: string;
  compact?: boolean;
  className?: string;
}) {
  const message = `Requer privilégio: ${PrivilegeUtils.getDescricaoPrivilegio(privilege as any)}`;

  return (
    <AccessDeniedFallback
      type="privilege"
      message={message}
      compact={compact}
      className={className}
    />
  );
}

export function ConfigurationRestrictedFallback({ 
  category, 
  compact = false,
  className = '' 
}: {
  category: string;
  compact?: boolean;
  className?: string;
}) {
  const message = `Configuração "${category}" restrita ao seu nível de acesso`;

  return (
    <AccessDeniedFallback
      type="configuration"
      message={message}
      compact={compact}
      className={className}
    />
  );
}