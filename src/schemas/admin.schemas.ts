import { z } from 'zod';
import { ModuloSistema } from '../types/multitenant';

// Schema para Permission
export const PermissionSchema = z.object({
  module: z.nativeEnum(ModuloSistema),
  actions: z.array(z.string()),
  restrictions: z.record(z.any()).optional()
});

// Schema para Role
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa'),
  defaultPermissions: z.array(PermissionSchema)
});

// Schema para criação de Role
export const CreateRoleSchema = RoleSchema.omit({ id: true });

// Schema para User
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  role: RoleSchema,
  department: z.string().max(100, 'Departamento muito longo'),
  permissions: z.array(PermissionSchema),
  lastLogin: z.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema para formulário de usuário
export const UserFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  department: z.string().max(100, 'Departamento muito longo'),
  roleId: z.string().uuid('ID da função inválido'),
  isActive: z.boolean().default(true)
});

// Schema para AccessLog
export const AccessLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string().email(),
  action: z.string(),
  resource: z.string(),
  success: z.boolean(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
  details: z.any().optional()
});

// Schema para filtros de AccessLog
export const AccessLogFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  success: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional()
});

// Schema para configurações do sistema
export const SystemConfigurationSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  key: z.string().min(1, 'Chave é obrigatória'),
  value: z.any(),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  updatedBy: z.string().uuid(),
  updatedAt: z.date()
});

// Schema para criação de configuração
export const CreateSystemConfigurationSchema = SystemConfigurationSchema.omit({ 
  id: true, 
  updatedAt: true 
});

// Schema para NotificationCondition
export const NotificationConditionSchema = z.object({
  field: z.string().min(1, 'Campo é obrigatório'),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']),
  value: z.any(),
  logicalOperator: z.enum(['AND', 'OR']).optional()
});

// Schema para NotificationAction
export const NotificationActionSchema = z.object({
  type: z.enum(['email', 'sms', 'push', 'webhook']),
  recipients: z.array(z.string().email()),
  template: z.string().optional(),
  config: z.record(z.any()).optional()
});

// Schema para NotificationRule
export const NotificationRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa'),
  conditions: z.array(NotificationConditionSchema).min(1, 'Pelo menos uma condição é obrigatória'),
  actions: z.array(NotificationActionSchema).min(1, 'Pelo menos uma ação é obrigatória'),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema para criação de regra de notificação
export const CreateNotificationRuleSchema = NotificationRuleSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Schema para BackupConfiguration
export const BackupConfigurationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  retention: z.number().int().min(1, 'Retenção deve ser pelo menos 1 dia').max(365, 'Retenção máxima de 365 dias'),
  destination: z.enum(['local', 's3', 'gcs', 'azure']),
  config: z.record(z.any()),
  isActive: z.boolean().default(true),
  lastRun: z.date().optional(),
  nextRun: z.date().optional()
});

// Schema para SecurityRule
export const SecurityRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string(),
  value: z.any(),
  isRequired: z.boolean().default(false)
});

// Schema para SecurityPolicy
export const SecurityPolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  type: z.enum(['password', 'session', 'access', 'audit']),
  rules: z.array(SecurityRuleSchema).min(1, 'Pelo menos uma regra é obrigatória'),
  isActive: z.boolean().default(true),
  appliesTo: z.enum(['all', 'role', 'user']),
  targetIds: z.array(z.string().uuid()).optional()
});

// Schema para ReportField
export const ReportFieldSchema = z.object({
  table: z.string().min(1, 'Tabela é obrigatória'),
  field: z.string().min(1, 'Campo é obrigatório'),
  alias: z.string().optional(),
  aggregation: z.enum(['sum', 'count', 'avg', 'min', 'max']).optional()
});

// Schema para ReportFilter
export const ReportFilterSchema = z.object({
  field: z.string().min(1, 'Campo é obrigatório'),
  operator: z.string().min(1, 'Operador é obrigatório'),
  value: z.any(),
  logicalOperator: z.enum(['AND', 'OR']).optional()
});

// Schema para ReportOrderBy
export const ReportOrderBySchema = z.object({
  field: z.string().min(1, 'Campo é obrigatório'),
  direction: z.enum(['ASC', 'DESC'])
});

// Schema para ReportQuery
export const ReportQuerySchema = z.object({
  tables: z.array(z.string()).min(1, 'Pelo menos uma tabela é obrigatória'),
  fields: z.array(ReportFieldSchema).min(1, 'Pelo menos um campo é obrigatório'),
  filters: z.array(ReportFilterSchema),
  groupBy: z.array(z.string()).optional(),
  orderBy: z.array(ReportOrderBySchema).optional(),
  limit: z.number().int().positive().optional()
});

// Schema para ReportLayout
export const ReportLayoutSchema = z.object({
  type: z.enum(['table', 'chart', 'dashboard']),
  config: z.record(z.any()),
  styling: z.record(z.any()).optional()
});

// Schema para ReportSchedule
export const ReportScheduleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  recipients: z.array(z.string().email()).min(1, 'Pelo menos um destinatário é obrigatório'),
  format: z.enum(['pdf', 'excel', 'csv'])
});

// Schema para ReportPermission
export const ReportPermissionSchema = z.object({
  type: z.enum(['user', 'role']),
  id: z.string().uuid(),
  access: z.enum(['view', 'edit', 'admin'])
});

// Schema para CustomReport
export const CustomReportSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa'),
  query: ReportQuerySchema,
  layout: ReportLayoutSchema,
  schedule: ReportScheduleSchema.optional(),
  permissions: z.array(ReportPermissionSchema),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema para criação de relatório personalizado
export const CreateCustomReportSchema = CustomReportSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Schema para métricas de sistema
export const SystemMetricsSchema = z.object({
  timestamp: z.date(),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  network: z.object({
    bytesIn: z.number().nonnegative(),
    bytesOut: z.number().nonnegative(),
    packetsIn: z.number().nonnegative(),
    packetsOut: z.number().nonnegative(),
    errors: z.number().nonnegative()
  }),
  database: z.object({
    connections: z.number().nonnegative(),
    queries: z.number().nonnegative(),
    slowQueries: z.number().nonnegative(),
    locks: z.number().nonnegative(),
    size: z.number().nonnegative()
  }),
  application: z.object({
    requests: z.number().nonnegative(),
    errors: z.number().nonnegative(),
    responseTime: z.number().nonnegative(),
    activeUsers: z.number().nonnegative(),
    memoryUsage: z.number().nonnegative()
  })
});

// Schema para alertas de performance
export const PerformanceAlertSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['cpu', 'memory', 'disk', 'network', 'database', 'application']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  threshold: z.number(),
  currentValue: z.number(),
  timestamp: z.date(),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional()
});

// Funções de validação utilitárias
export const validateUserForm = (data: unknown) => {
  return UserFormSchema.safeParse(data);
};

export const validateRole = (data: unknown) => {
  return RoleSchema.safeParse(data);
};

export const validateCreateRole = (data: unknown) => {
  return CreateRoleSchema.safeParse(data);
};

export const validateSystemConfiguration = (data: unknown) => {
  return SystemConfigurationSchema.safeParse(data);
};

export const validateNotificationRule = (data: unknown) => {
  return NotificationRuleSchema.safeParse(data);
};

export const validateBackupConfiguration = (data: unknown) => {
  return BackupConfigurationSchema.safeParse(data);
};

export const validateCustomReport = (data: unknown) => {
  return CustomReportSchema.safeParse(data);
};

export const validateSystemMetrics = (data: unknown) => {
  return SystemMetricsSchema.safeParse(data);
};

// Tipos derivados dos schemas
export type UserFormData = z.infer<typeof UserFormSchema>;
export type CreateRoleData = z.infer<typeof CreateRoleSchema>;
export type AccessLogFilters = z.infer<typeof AccessLogFiltersSchema>;
export type CreateSystemConfigurationData = z.infer<typeof CreateSystemConfigurationSchema>;
export type CreateNotificationRuleData = z.infer<typeof CreateNotificationRuleSchema>;
export type CreateCustomReportData = z.infer<typeof CreateCustomReportSchema>;