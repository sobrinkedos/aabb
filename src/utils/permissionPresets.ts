import { EmployeeRole, RolePreset, MobilePermission } from '../types/employee.types';

export const WAITER_MOBILE_PERMISSIONS: MobilePermission[] = [
  { feature: 'tables', level: 'full' },
  { feature: 'orders', level: 'full' },
  { feature: 'menu', level: 'read' },
  { feature: 'customers', level: 'write' },
  { feature: 'payments', level: 'read' }
];

export const ROLE_PRESETS: Record<EmployeeRole, RolePreset> = {
  waiter: {
    role: 'waiter',
    description: 'Garçom - Atendimento e pedidos',
    permissions: [
      { id: 'bar-view', module: 'bar', action: 'view' },
      { id: 'bar-create-orders', module: 'bar', action: 'create', resource: 'orders' },
      { id: 'bar-edit-own-orders', module: 'bar', action: 'edit', resource: 'own_orders' },
      { id: 'customers-view', module: 'customers', action: 'view' },
      { id: 'customers-create', module: 'customers', action: 'create' },
      { id: 'app-garcom-access', module: 'app-garcom', action: 'access' },
      { id: 'app-garcom-tables', module: 'app-garcom', action: 'manage', resource: 'tables' },
      { id: 'app-garcom-orders', module: 'app-garcom', action: 'manage', resource: 'orders' }
    ]
  },
  cook: {
    role: 'cook',
    description: 'Cozinheiro - Preparo e cozinha',
    permissions: [
      { id: 'kitchen-view', module: 'kitchen', action: 'view' },
      { id: 'kitchen-edit-status', module: 'kitchen', action: 'edit', resource: 'order_status' },
      { id: 'inventory-view', module: 'inventory', action: 'view' },
      { id: 'bar-view-orders', module: 'bar', action: 'view', resource: 'orders' }
    ]
  },
  cashier: {
    role: 'cashier',
    description: 'Caixa - Pagamentos e fechamento',
    permissions: [
      { id: 'cashier-view', module: 'cashier', action: 'view' },
      { id: 'cashier-manage', module: 'cashier', action: 'manage' },
      { id: 'bar-view-orders', module: 'bar', action: 'view', resource: 'orders' },
      { id: 'reports-view-daily', module: 'reports', action: 'view', resource: 'daily_sales' }
    ]
  },
  supervisor: {
    role: 'supervisor',
    description: 'Supervisor - Supervisão operacional',
    permissions: [
      { id: 'bar-manage', module: 'bar', action: 'manage' },
      { id: 'kitchen-manage', module: 'kitchen', action: 'manage' },
      { id: 'cashier-view', module: 'cashier', action: 'view' },
      { id: 'reports-view', module: 'reports', action: 'view' },
      { id: 'inventory-view', module: 'inventory', action: 'view' },
      { id: 'customers-manage', module: 'customers', action: 'manage' }
    ]
  },
  manager: {
    role: 'manager',
    description: 'Gerente - Gestão completa',
    permissions: [
      { id: 'bar-manage', module: 'bar', action: 'manage' },
      { id: 'kitchen-manage', module: 'kitchen', action: 'manage' },
      { id: 'cashier-manage', module: 'cashier', action: 'manage' },
      { id: 'reports-manage', module: 'reports', action: 'manage' },
      { id: 'inventory-manage', module: 'inventory', action: 'manage' },
      { id: 'customers-manage', module: 'customers', action: 'manage' },
      { id: 'settings-view', module: 'settings', action: 'view' }
    ]
  },
  admin: {
    role: 'admin',
    description: 'Administrador - Acesso total',
    permissions: [
      { id: 'bar-manage', module: 'bar', action: 'manage' },
      { id: 'kitchen-manage', module: 'kitchen', action: 'manage' },
      { id: 'cashier-manage', module: 'cashier', action: 'manage' },
      { id: 'reports-manage', module: 'reports', action: 'manage' },
      { id: 'inventory-manage', module: 'inventory', action: 'manage' },
      { id: 'customers-manage', module: 'customers', action: 'manage' },
      { id: 'settings-manage', module: 'settings', action: 'manage' }
    ]
  }
};

export const getRoleDisplayName = (role: EmployeeRole): string => {
  const roleNames: Record<EmployeeRole, string> = {
    waiter: 'Garçom',
    cook: 'Cozinheiro',
    cashier: 'Caixa',
    supervisor: 'Supervisor',
    manager: 'Gerente',
    admin: 'Administrador'
  };
  return roleNames[role];
};

export const getModuleDisplayName = (module: string): string => {
  const moduleNames: Record<string, string> = {
    bar: 'Bar/Atendimento',
    kitchen: 'Cozinha',
    cashier: 'Caixa',
    reports: 'Relatórios',
    inventory: 'Estoque',
    customers: 'Clientes',
    settings: 'Configurações',
    'app-garcom': 'App Garçom'
  };
  return moduleNames[module] || module;
};

export const getActionDisplayName = (action: string): string => {
  const actionNames: Record<string, string> = {
    view: 'Visualizar',
    create: 'Criar',
    edit: 'Editar',
    delete: 'Excluir',
    manage: 'Gerenciar',
    access: 'Acessar'
  };
  return actionNames[action] || action;
};