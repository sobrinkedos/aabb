// Configurações de autenticação

export const AUTH_CONFIG = {
  // Credenciais do usuário demo
  DEMO_USER: {
    email: 'demo@clubmanager.com',
    password: 'demo123',
    name: 'Usuário Demo',
    role: 'admin' as const
  },
  
  // Configurações de sessão
  SESSION: {
    autoRefresh: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  
  // Configurações de redirecionamento
  ROUTES: {
    login: '/login',
    dashboard: '/dashboard',
    afterLogin: '/dashboard',
    afterLogout: '/login'
  },
  
  // Configurações de roles e permissões
  ROLES: {
    admin: {
      name: 'Administrador',
      permissions: ['*'] // Acesso total
    },
    manager: {
      name: 'Gerente',
      permissions: ['read', 'write', 'manage_employees', 'view_reports']
    },
    employee: {
      name: 'Funcionário',
      permissions: ['read', 'write']
    },
    member: {
      name: 'Membro',
      permissions: ['read']
    }
  }
} as const;

export type Role = keyof typeof AUTH_CONFIG.ROLES;
export type Permission = string;