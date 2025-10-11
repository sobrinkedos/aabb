export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type RestoreStatus = 'pending' | 'running' | 'completed' | 'failed';
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface BackupJob {
  id: string;
  name: string;
  description?: string;
  type: BackupType;
  status: BackupStatus;
  schedule?: string; // Cron expression
  retention: number; // dias
  compression: boolean;
  encryption: boolean;
  includeFiles: boolean;
  includeDatabase: boolean;
  destination?: string;
  size?: number;
  lastRun?: string;
  nextRun?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RestorePoint {
  id: string;
  name: string;
  description: string;
  type: BackupType;
  version: string;
  size: number;
  checksum: string;
  isValid: boolean;
  createdAt: string;
  backupJobId?: string;
  metadata?: Record<string, any>;
}

export interface RestoreOperation {
  id: string;
  restorePointId: string;
  status: RestoreStatus;
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  restoredItems: string[];
  skippedItems: string[];
  failedItems: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'password' | 'access' | 'encryption' | 'audit' | 'backup';
  isActive: boolean;
  rules: SecurityRule[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  severity: SecurityLevel;
  isActive: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // dias
  preventReuse: number; // últimas N senhas
  lockoutAttempts: number;
  lockoutDuration: number; // minutos
}

export interface AccessPolicy {
  maxSessionDuration: number; // minutos
  requireMFA: boolean;
  allowedIPs?: string[];
  blockedIPs?: string[];
  maxConcurrentSessions: number;
  sessionTimeout: number; // minutos de inatividade
}

export interface EncryptionPolicy {
  algorithm: string;
  keySize: number;
  rotationInterval: number; // dias
  backupEncryption: boolean;
  transmissionEncryption: boolean;
  storageEncryption: boolean;
}

export interface AuditPolicy {
  logLevel: 'minimal' | 'standard' | 'detailed' | 'verbose';
  retentionPeriod: number; // dias
  realTimeMonitoring: boolean;
  alertOnSuspiciousActivity: boolean;
  loggedEvents: string[];
}

export interface SecurityIncident {
  id: string;
  type: 'unauthorized_access' | 'suspicious_activity' | 'policy_violation' | 'system_breach';
  severity: SecurityLevel;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  title: string;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  affectedResources: string[];
  sourceIP?: string;
  userId?: string;
  evidence: Record<string, any>;
  actions: SecurityAction[];
}

export interface SecurityAction {
  id: string;
  type: 'block_ip' | 'disable_user' | 'force_logout' | 'alert_admin' | 'backup_data';
  status: 'pending' | 'executed' | 'failed';
  executedAt?: string;
  result?: string;
  error?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  sourceIP: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  riskLevel: SecurityLevel;
}

export interface IntegrityCheck {
  id: string;
  backupId: string;
  isValid: boolean;
  checkedAt: string;
  checksum: string;
  expectedChecksum: string;
  issues?: string[];
  fileCount: number;
  totalSize: number;
}

export interface BackupSecurityHook {
  // Backup Jobs
  backupJobs: BackupJob[];
  restorePoints: RestorePoint[];
  securityPolicies: SecurityPolicy[];
  securityIncidents: SecurityIncident[];
  auditLogs: SecurityAuditLog[];
  isLoading: boolean;
  error: string | null;

  // Backup Operations
  createBackupJob: (job: Partial<BackupJob>) => Promise<BackupJob>;
  updateBackupJob: (id: string, updates: Partial<BackupJob>) => Promise<BackupJob>;
  deleteBackupJob: (id: string) => Promise<void>;
  executeBackup: (jobId: string) => Promise<void>;
  scheduleBackup: (jobId: string, schedule: string) => Promise<void>;
  cancelBackup: (jobId: string) => Promise<void>;

  // Restore Operations
  createRestorePoint: (data: Partial<RestorePoint>) => Promise<RestorePoint>;
  restoreFromPoint: (pointId: string, options?: any) => Promise<RestoreOperation>;
  validateBackupIntegrity: (backupId: string) => Promise<IntegrityCheck>;

  // Security Policies
  createSecurityPolicy: (policy: Partial<SecurityPolicy>) => Promise<SecurityPolicy>;
  updateSecurityPolicy: (id: string, updates: Partial<SecurityPolicy>) => Promise<SecurityPolicy>;
  deleteSecurityPolicy: (id: string) => Promise<void>;

  // Security Monitoring
  detectSuspiciousActivity: () => Promise<SecurityIncident[]>;
  createSecurityIncident: (incident: Partial<SecurityIncident>) => Promise<SecurityIncident>;
  resolveSecurityIncident: (id: string, resolution: string) => Promise<void>;

  // Audit
  getAuditLogs: (filters?: any) => Promise<SecurityAuditLog[]>;
  exportAuditLogs: (filters?: any) => Promise<Blob>;
  getBackupHistory: (jobId?: string) => Promise<BackupJob[]>;

  // Utils
  refreshData: () => Promise<void>;
}