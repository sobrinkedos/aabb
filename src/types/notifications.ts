export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type NotificationStatus = 'sent' | 'failed' | 'pending' | 'cancelled';
export type ChannelType = 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'whatsapp' | 'push';

export interface AlertCondition {
  id: string;
  type: 'metric_threshold' | 'error_rate' | 'response_time' | 'user_activity' | 'system_event' | 'custom_query';
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: string;
  timeWindow: number; // em minutos
}

export interface AlertAction {
  id: string;
  type: 'send_notification' | 'create_ticket' | 'execute_webhook' | 'run_script' | 'pause_system';
  config: Record<string, any>;
}

export interface EscalationRules {
  enabled: boolean;
  timeoutMinutes: number;
  escalationChannels: string[];
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  isActive: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  channels: string[]; // IDs dos canais
  escalationRules?: EscalationRules;
  cooldownMinutes?: number;
  maxAlertsPerHour?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: NotificationStatus;
  ruleId?: string;
  ruleName?: string;
  channels: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  sentAt?: string;
  failureReason?: string;
  retryCount?: number;
}

export interface ChannelTestResult {
  success: boolean;
  error?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  activeRules: number;
  activeChannels: number;
  alertsToday: number;
  criticalAlertsToday: number;
}

export interface NotificationsHook {
  rules: NotificationRule[];
  channels: NotificationChannel[];
  notifications: Notification[];
  stats: NotificationStats;
  isLoading: boolean;
  error: string | null;
  
  // Rules
  createRule: (rule: Partial<NotificationRule>) => Promise<NotificationRule>;
  updateRule: (id: string, updates: Partial<NotificationRule>) => Promise<NotificationRule>;
  deleteRule: (id: string) => Promise<void>;
  
  // Channels
  createChannel: (channel: Partial<NotificationChannel>) => Promise<NotificationChannel>;
  updateChannel: (id: string, updates: Partial<NotificationChannel>) => Promise<NotificationChannel>;
  deleteChannel: (id: string) => Promise<void>;
  testChannel: (id: string) => Promise<ChannelTestResult>;
  
  // Notifications
  sendNotification: (notification: Partial<Notification>) => Promise<Notification>;
  getNotificationHistory: (filters?: any) => Promise<Notification[]>;
  retryNotification: (id: string) => Promise<void>;
  
  // Utils
  refreshData: () => Promise<void>;
}