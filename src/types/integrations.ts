export type IntegrationType = 
  | 'webhook' 
  | 'api_rest' 
  | 'database' 
  | 'file_sync' 
  | 'email' 
  | 'payment' 
  | 'erp' 
  | 'crm';

export type ConnectionStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'error' 
  | 'testing' 
  | 'inactive';

export interface IntegrationConfig {
  url?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  dataMapping?: DataMapping;
  webhookSecret?: string;
  [key: string]: any;
}

export interface IntegrationError {
  timestamp: Date;
  message: string;
  code?: string;
  details?: any;
}

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
  status: ConnectionStatus;
  lastSync: Date | null;
  errorLog: IntegrationError[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DataMapping {
  sourceFields: FieldMapping[];
  targetFields: FieldMapping[];
  transformations: DataTransformation[];
}

export interface FieldMapping {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DataTransformation {
  sourceField: string;
  targetField: string;
  transformation: TransformationType;
  parameters?: Record<string, any>;
}

export type TransformationType = 
  | 'direct' 
  | 'format_date' 
  | 'format_currency' 
  | 'uppercase' 
  | 'lowercase' 
  | 'trim' 
  | 'split' 
  | 'join' 
  | 'calculate' 
  | 'lookup' 
  | 'conditional';

export interface ConnectionTestResult {
  success: boolean;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  details?: any;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errors?: string[];
  duration?: number;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  action: 'sync' | 'test' | 'config_update' | 'error';
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
}

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
}

export interface FileSync {
  sourcePath: string;
  targetPath: string;
  filePattern?: string;
  syncDirection: 'upload' | 'download' | 'bidirectional';
  deleteAfterSync?: boolean;
  compression?: boolean;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string;
  encryption?: 'tls' | 'ssl' | 'none';
}

export interface PaymentGatewayConfig {
  provider: 'stripe' | 'paypal' | 'mercadopago' | 'pagseguro' | 'cielo';
  apiKey: string;
  secretKey?: string;
  webhookUrl?: string;
  environment: 'sandbox' | 'production';
}

// Hooks e serviços
export interface IntegrationsHook {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
  createIntegration: (data: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Integration>;
  updateIntegration: (id: string, updates: Partial<Integration>) => Promise<Integration>;
  deleteIntegration: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<ConnectionTestResult>;
  syncData: (id: string) => Promise<SyncResult>;
  getIntegrationLogs: (id: string) => Promise<IntegrationLog[]>;
  refreshIntegrations: () => Promise<void>;
}

export interface IntegrationFormData {
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
}

// Tipos específicos por tipo de integração
export interface WebhookIntegration extends Integration {
  type: 'webhook';
  config: IntegrationConfig & {
    url: string;
    method: 'POST' | 'PUT';
    headers?: Record<string, string>;
    webhookSecret?: string;
  };
}

export interface APIRestIntegration extends Integration {
  type: 'api_rest';
  config: IntegrationConfig & {
    baseUrl: string;
    apiKey?: string;
    authType: 'none' | 'api_key' | 'bearer' | 'basic';
    endpoints: APIEndpoint[];
  };
}

export interface DatabaseIntegration extends Integration {
  type: 'database';
  config: IntegrationConfig & DatabaseConnection & {
    queries: {
      select?: string;
      insert?: string;
      update?: string;
      delete?: string;
    };
  };
}

export interface FileSyncIntegration extends Integration {
  type: 'file_sync';
  config: IntegrationConfig & FileSync & {
    protocol: 'ftp' | 'sftp' | 's3' | 'local';
    credentials?: {
      username?: string;
      password?: string;
      accessKey?: string;
      secretKey?: string;
    };
  };
}

export interface EmailIntegration extends Integration {
  type: 'email';
  config: IntegrationConfig & EmailConfig & {
    templates: {
      [key: string]: {
        subject: string;
        body: string;
        isHtml: boolean;
      };
    };
  };
}

export interface PaymentIntegration extends Integration {
  type: 'payment';
  config: IntegrationConfig & PaymentGatewayConfig;
}

// Union type para todas as integrações tipadas
export type TypedIntegration = 
  | WebhookIntegration 
  | APIRestIntegration 
  | DatabaseIntegration 
  | FileSyncIntegration 
  | EmailIntegration 
  | PaymentIntegration;