import { ModuloSistema } from './multitenant';

export interface Permission {
  module: ModuloSistema;
  actions: string[];
  restrictions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  defaultPermissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  permissions: Permission[];
  lastLogin: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: any;
}

export interface UserFormData {
  name: string;
  email: string;
  department: string;
  roleId: string;
  isActive: boolean;
}

export interface RoleFormData {
  name: string;
  description: string;
  defaultPermissions: Permission[];
}

export interface AccessLogFilters {
  userId?: string;
  action?: string;
  success?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserManagementHook {
  users: User[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  createUser: (userData: UserFormData) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  createRole: (roleData: Omit<Role, 'id'>) => Promise<Role>;
  updateRole: (roleId: string, updates: Partial<Role>) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  updatePermissions: (userId: string, permissions: Permission[]) => Promise<void>;
  refreshData: () => Promise<void>;
}

export interface AccessLogsHook {
  logs: AccessLog[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  loadLogs: (page: number, filters?: AccessLogFilters) => Promise<void>;
  exportLogs: (filters?: AccessLogFilters) => Promise<void>;
  refreshLogs: () => Promise<void>;
}

// Enums para ações de auditoria
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  CREATE_ROLE = 'CREATE_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  UPDATE_PERMISSIONS = 'UPDATE_PERMISSIONS',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA'
}

// Tipos para configurações de sistema
export interface SystemConfiguration {
  id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: Date;
}

export interface ConfigurationCategory {
  name: string;
  displayName: string;
  description: string;
  settings: SystemConfiguration[];
}

// Tipos para notificações
export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipients: string[];
  template?: string;
  config?: Record<string, any>;
}

// Tipos para backup e segurança
export interface BackupConfiguration {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number;
  destination: 'local' | 's3' | 'gcs' | 'azure';
  config: Record<string, any>;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  type: 'password' | 'session' | 'access' | 'audit';
  rules: SecurityRule[];
  isActive: boolean;
  appliesTo: 'all' | 'role' | 'user';
  targetIds?: string[];
}

export interface SecurityRule {
  name: string;
  description: string;
  value: any;
  isRequired: boolean;
}

// Tipos para relatórios personalizados
export interface CustomReport {
  id: string;
  name: string;
  description: string;
  query: ReportQuery;
  layout: ReportLayout;
  schedule?: ReportSchedule;
  permissions: ReportPermission[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportQuery {
  tables: string[];
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy?: string[];
  orderBy?: ReportOrderBy[];
  limit?: number;
}

export interface ReportField {
  table: string;
  field: string;
  alias?: string;
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ReportOrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface ReportLayout {
  type: 'table' | 'chart' | 'dashboard';
  config: Record<string, any>;
  styling?: Record<string, any>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportPermission {
  type: 'user' | 'role';
  id: string;
  access: 'view' | 'edit' | 'admin';
}

// Tipos para monitoramento de performance
export interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: NetworkMetrics;
  database: DatabaseMetrics;
  application: ApplicationMetrics;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  errors: number;
}

export interface DatabaseMetrics {
  connections: number;
  queries: number;
  slowQueries: number;
  locks: number;
  size: number;
}

export interface ApplicationMetrics {
  requests: number;
  errors: number;
  responseTime: number;
  activeUsers: number;
  memoryUsage: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
}