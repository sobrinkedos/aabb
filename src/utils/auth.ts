import { AUTH_CONFIG, Role, Permission } from '../config/auth';
import { User } from '../types/auth';

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const roleConfig = AUTH_CONFIG.ROLES[user.role];
  if (!roleConfig) return false;
  
  // Admin tem acesso total
  if (roleConfig.permissions.includes('*')) return true;
  
  return roleConfig.permissions.includes(permission);
}

/**
 * Verifica se o usuário tem uma das roles especificadas
 */
export function hasRole(user: User | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Verifica se o usuário é o usuário demo
 */
export function isDemoUser(user: User | null): boolean {
  return user?.email === AUTH_CONFIG.DEMO_USER.email;
}

/**
 * Formata o nome do usuário para exibição
 */
export function formatUserName(user: User | null): string {
  if (!user) return 'Usuário';
  return user.name || user.email.split('@')[0];
}

/**
 * Obtém o nome da role do usuário
 */
export function getRoleName(role: Role): string {
  return AUTH_CONFIG.ROLES[role]?.name || role;
}