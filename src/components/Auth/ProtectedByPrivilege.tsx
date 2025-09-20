import React from 'react';
import { PrivilegiosAdmin } from '../../types/multitenant';
import { usePrivileges } from '../../contexts/PrivilegeContext';

interface ProtectedByPrivilegeProps {
  privilegio: keyof PrivilegiosAdmin;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function ProtectedByPrivilege({ 
  privilegio, 
  children, 
  fallback = null, 
  showFallback = false 
}: ProtectedByPrivilegeProps) {
  const { verificarPrivilegio, isLoading } = usePrivileges();

  // Mostrar loading se ainda está carregando
  if (isLoading) {
    return showFallback ? (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
    ) : null;
  }

  // Verificar se o usuário tem o privilégio necessário
  const temPrivilegio = verificarPrivilegio(privilegio);

  if (temPrivilegio) {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
}

// Componentes específicos para privilégios comuns
export function CanManageUsers({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByPrivilegeProps, 'privilegio'>) {
  return (
    <ProtectedByPrivilege 
      privilegio="gerenciar_usuarios" 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByPrivilege>
  );
}

export function CanConfigureCompany({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByPrivilegeProps, 'privilegio'>) {
  return (
    <ProtectedByPrivilege 
      privilegio="configuracoes_empresa" 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByPrivilege>
  );
}

export function CanConfigureSecurity({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByPrivilegeProps, 'privilegio'>) {
  return (
    <ProtectedByPrivilege 
      privilegio="configuracoes_seguranca" 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByPrivilege>
  );
}

export function CanManageIntegrations({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByPrivilegeProps, 'privilegio'>) {
  return (
    <ProtectedByPrivilege 
      privilegio="integracao_externa" 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByPrivilege>
  );
}

export function CanViewAdvancedReports({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByPrivilegeProps, 'privilegio'>) {
  return (
    <ProtectedByPrivilege 
      privilegio="relatorios_avancados" 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByPrivilege>
  );
}

export function CanViewFullAudit({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByPrivilegeProps, 'privilegio'>) {
  return (
    <ProtectedByPrivilege 
      privilegio="auditoria_completa" 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByPrivilege>
  );
}