import React from 'react';
import { PapelUsuario } from '../../types/multitenant';
import { usePrivileges } from '../../contexts/PrivilegeContext';

interface ProtectedByRoleProps {
  papel: PapelUsuario | PapelUsuario[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function ProtectedByRole({ 
  papel, 
  children, 
  fallback = null, 
  showFallback = false 
}: ProtectedByRoleProps) {
  const { papel: userRole, isLoading } = usePrivileges();

  // Mostrar loading se ainda está carregando
  if (isLoading) {
    return showFallback ? (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
    ) : null;
  }

  // Verificar se o usuário tem o papel necessário
  const papeisPermitidos = Array.isArray(papel) ? papel : [papel];
  const temAcesso = userRole && papeisPermitidos.includes(userRole);

  if (temAcesso) {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
}

// Componente específico para SUPER_ADMIN
export function SuperAdminOnly({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByRoleProps, 'papel'>) {
  return (
    <ProtectedByRole 
      papel={PapelUsuario.SUPER_ADMIN} 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByRole>
  );
}

// Componente para ADMIN ou superior
export function AdminOrHigher({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByRoleProps, 'papel'>) {
  return (
    <ProtectedByRole 
      papel={[PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN]} 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByRole>
  );
}

// Componente para MANAGER ou superior
export function ManagerOrHigher({ 
  children, 
  fallback = null, 
  showFallback = false 
}: Omit<ProtectedByRoleProps, 'papel'>) {
  return (
    <ProtectedByRole 
      papel={[PapelUsuario.SUPER_ADMIN, PapelUsuario.ADMIN, PapelUsuario.MANAGER]} 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </ProtectedByRole>
  );
}