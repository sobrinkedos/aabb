export interface Employee {
  id?: string;
  company_id?: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  role: EmployeeRole;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  hire_date: Date;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export type EmployeeRole = 
  | 'waiter' 
  | 'cook' 
  | 'cashier' 
  | 'supervisor' 
  | 'manager' 
  | 'admin';

export interface Permission {
  id: string;
  module: ModuleType;
  action: ActionType;
  resource?: string;
}

export type ModuleType = 
  | 'bar' 
  | 'kitchen' 
  | 'cashier' 
  | 'reports' 
  | 'inventory' 
  | 'customers' 
  | 'settings'
  | 'app-garcom';

export type ActionType = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'manage'
  | 'access';

export interface RolePreset {
  role: EmployeeRole;
  permissions: Permission[];
  description: string;
}

export interface MobileAppAccess {
  id?: string;
  employee_id: string;
  app_name: 'app-garcom';
  has_access: boolean;
  permissions: MobilePermission[];
  device_limit?: number;
  last_sync?: Date;
}

export interface MobilePermission {
  feature: 'tables' | 'orders' | 'menu' | 'customers' | 'payments';
  level: 'read' | 'write' | 'full';
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'duplicate' | 'custom';
}

export interface EmployeeFormErrors {
  general?: string;
  fields: ValidationError[];
}

export interface EmployeeModalState {
  loading: boolean;
  saving: boolean;
  errors: EmployeeFormErrors;
  isDirty: boolean;
  isValid: boolean;
}