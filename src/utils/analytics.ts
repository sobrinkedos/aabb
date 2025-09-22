/**
 * Sistema de Analytics para Funcionários
 * 
 * Coleta e analisa métricas de criação, performance e uso do sistema
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface EmployeeAnalytics {
  creationMetrics: CreationMetrics;
  performanceMetrics: PerformanceMetrics;
  usageMetrics: UsageMetrics;
  distributionMetrics: DistributionMetrics;
}

export interface CreationMetrics {
  totalCreated: number;
  successRate: number;
  failureRate: number;
  averageCreationTime: number;
  creationsByPeriod: PeriodMetric[];
  creationsByRole: RoleMetric[];
  creationsBySource: SourceMetric[];
  validationErrors: ValidationErrorMetric[];
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  slowestOperations: OperationMetric[];
  errorsByType: ErrorTypeMetric[];
  retryAttempts: RetryMetric[];
  cacheHitRate: number;
}

export interface UsageMetrics {
  activeUsers: number;
  systemAccessRate: number;
  moduleUsage: ModuleUsageMetric[];
  peakUsageHours: HourMetric[];
  sessionDuration: number;
}

export interface DistributionMetrics {
  roleDistribution: RoleDistributionMetric[];
  shiftDistribution: ShiftDistributionMetric[];
  departmentDistribution: DepartmentMetric[];
  tenureDistribution: TenureMetric[];
}

export interface PeriodMetric {
  period: string;
  count: number;
  timestamp: string;
}

export interface RoleMetric {
  role: string;
  count: number;
  percentage: number;
}

export interface SourceMetric {
  source: 'manual' | 'import' | 'api' | 'bulk';
  count: number;
  successRate: number;
}

export interface ValidationErrorMetric {
  field: string;
  errorType: string;
  count: number;
  percentage: number;
}

export interface OperationMetric {
  operation: string;
  averageTime: number;
  maxTime: number;
  count: number;
}

export interface ErrorTypeMetric {
  type: string;
  count: number;
  percentage: number;
  lastOccurrence: string;
}

export interface RetryMetric {
  operation: string;
  attempts: number;
  successRate: number;
}

export interface ModuleUsageMetric {
  module: string;
  accessCount: number;
  uniqueUsers: number;
  averageSessionTime: number;
}

export interface HourMetric {
  hour: number;
  usage: number;
  activeUsers: number;
}

export interface RoleDistributionMetric {
  role: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ShiftDistributionMetric {
  shift: string;
  count: number;
  percentage: number;
  efficiency: number;
}

export interface DepartmentMetric {
  department: string;
  employeeCount: number;
  averageTenure: number;
  turnoverRate: number;
}

export interface TenureMetric {
  range: string;
  count: number;
  percentage: number;
}

// ============================================================================
// CLASSE PRINCIPAL DE ANALYTICS
// ============================================================================

class EmployeeAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private metrics: Map<string, any> = new Map();

  // ============================================================================
  // COLETA DE EVENTOS
  // ============================================================================

  trackEmployeeCreation(data: {
    employeeId: string;
    role: string;
    source: string;
    duration: number;
    success: boolean;
    errors?: string[];
  }): void {
    this.addEvent({
      type: 'employee_creation',
      timestamp: new Date().toISOString(),
      data
    });
  }

  trackValidationError(data: {
    field: string;
    errorType: string;
    value?: string;
    employeeId?: string;
  }): void {
    this.addEvent({
      type: 'validation_error',
      timestamp: new Date().toISOString(),
      data
    });
  }

  trackSystemAccess(data: {
    userId: string;
    module: string;
    action: string;
    duration?: number;
    success: boolean;
  }): void {
    this.addEvent({
      type: 'system_access',
      timestamp: new Date().toISOString(),
      data
    });
  }

  trackPerformance(data: {
    operation: string;
    duration: number;
    success: boolean;
    retryCount?: number;
    cacheHit?: boolean;
  }): void {
    this.addEvent({
      type: 'performance',
      timestamp: new Date().toISOString(),
      data
    });
  }

  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    
    // Manter apenas os últimos 10000 eventos para performance
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    // Salvar no localStorage para persistência
    this.saveToStorage();
  }

  // ============================================================================
  // GERAÇÃO DE MÉTRICAS
  // ============================================================================

  generateCreationMetrics(period: 'day' | 'week' | 'month' = 'week'): CreationMetrics {
    const creationEvents = this.getEventsByType('employee_creation');
    const validationEvents = this.getEventsByType('validation_error');
    
    const total = creationEvents.length;
    const successful = creationEvents.filter(e => e.data.success).length;
    const failed = total - successful;

    return {
      totalCreated: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
      averageCreationTime: this.calculateAverageCreationTime(creationEvents),
      creationsByPeriod: this.groupByPeriod(creationEvents, period),
      creationsByRole: this.groupByRole(creationEvents),
      creationsBySource: this.groupBySource(creationEvents),
      validationErrors: this.analyzeValidationErrors(validationEvents)
    };
  }

  generatePerformanceMetrics(): PerformanceMetrics {
    const performanceEvents = this.getEventsByType('performance');
    
    return {
      averageResponseTime: this.calculateAverageResponseTime(performanceEvents),
      slowestOperations: this.findSlowestOperations(performanceEvents),
      errorsByType: this.groupErrorsByType(performanceEvents),
      retryAttempts: this.analyzeRetryAttempts(performanceEvents),
      cacheHitRate: this.calculateCacheHitRate(performanceEvents)
    };
  }

  generateUsageMetrics(): UsageMetrics {
    const accessEvents = this.getEventsByType('system_access');
    
    return {
      activeUsers: this.countActiveUsers(accessEvents),
      systemAccessRate: this.calculateSystemAccessRate(accessEvents),
      moduleUsage: this.analyzeModuleUsage(accessEvents),
      peakUsageHours: this.findPeakUsageHours(accessEvents),
      sessionDuration: this.calculateAverageSessionDuration(accessEvents)
    };
  }

  generateDistributionMetrics(): DistributionMetrics {
    const creationEvents = this.getEventsByType('employee_creation');
    
    return {
      roleDistribution: this.analyzeRoleDistribution(creationEvents),
      shiftDistribution: this.analyzeShiftDistribution(creationEvents),
      departmentDistribution: this.analyzeDepartmentDistribution(creationEvents),
      tenureDistribution: this.analyzeTenureDistribution(creationEvents)
    };
  }

  generateCompleteAnalytics(): EmployeeAnalytics {
    return {
      creationMetrics: this.generateCreationMetrics(),
      performanceMetrics: this.generatePerformanceMetrics(),
      usageMetrics: this.generateUsageMetrics(),
      distributionMetrics: this.generateDistributionMetrics()
    };
  }

  // ============================================================================
  // MÉTODOS AUXILIARES DE CÁLCULO
  // ============================================================================

  private calculateAverageCreationTime(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    
    const totalTime = events.reduce((sum, event) => sum + (event.data.duration || 0), 0);
    return totalTime / events.length;
  }

  private groupByPeriod(events: AnalyticsEvent[], period: string): PeriodMetric[] {
    const groups = new Map<string, number>();
    
    events.forEach(event => {
      const date = new Date(event.timestamp);
      let key: string;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return Array.from(groups.entries()).map(([period, count]) => ({
      period,
      count,
      timestamp: new Date().toISOString()
    }));
  }

  private groupByRole(events: AnalyticsEvent[]): RoleMetric[] {
    const roleCount = new Map<string, number>();
    
    events.forEach(event => {
      const role = event.data.role;
      if (role) {
        roleCount.set(role, (roleCount.get(role) || 0) + 1);
      }
    });

    const total = events.length;
    return Array.from(roleCount.entries()).map(([role, count]) => ({
      role,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private groupBySource(events: AnalyticsEvent[]): SourceMetric[] {
    const sourceStats = new Map<string, { total: number; successful: number }>();
    
    events.forEach(event => {
      const source = event.data.source;
      if (source) {
        const stats = sourceStats.get(source) || { total: 0, successful: 0 };
        stats.total++;
        if (event.data.success) {
          stats.successful++;
        }
        sourceStats.set(source, stats);
      }
    });

    return Array.from(sourceStats.entries()).map(([source, stats]) => ({
      source: source as any,
      count: stats.total,
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
    }));
  }

  private analyzeValidationErrors(events: AnalyticsEvent[]): ValidationErrorMetric[] {
    const errorCount = new Map<string, Map<string, number>>();
    
    events.forEach(event => {
      const field = event.data.field;
      const errorType = event.data.errorType;
      
      if (!errorCount.has(field)) {
        errorCount.set(field, new Map());
      }
      
      const fieldErrors = errorCount.get(field)!;
      fieldErrors.set(errorType, (fieldErrors.get(errorType) || 0) + 1);
    });

    const result: ValidationErrorMetric[] = [];
    const total = events.length;

    errorCount.forEach((fieldErrors, field) => {
      fieldErrors.forEach((count, errorType) => {
        result.push({
          field,
          errorType,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        });
      });
    });

    return result.sort((a, b) => b.count - a.count);
  }

  private calculateAverageResponseTime(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    
    const totalTime = events.reduce((sum, event) => sum + (event.data.duration || 0), 0);
    return totalTime / events.length;
  }

  private findSlowestOperations(events: AnalyticsEvent[]): OperationMetric[] {
    const operationStats = new Map<string, { times: number[]; count: number }>();
    
    events.forEach(event => {
      const operation = event.data.operation;
      const duration = event.data.duration || 0;
      
      if (!operationStats.has(operation)) {
        operationStats.set(operation, { times: [], count: 0 });
      }
      
      const stats = operationStats.get(operation)!;
      stats.times.push(duration);
      stats.count++;
    });

    return Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        averageTime: stats.times.reduce((a, b) => a + b, 0) / stats.times.length,
        maxTime: Math.max(...stats.times),
        count: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
  }

  private groupErrorsByType(events: AnalyticsEvent[]): ErrorTypeMetric[] {
    const errorStats = new Map<string, { count: number; lastOccurrence: string }>();
    
    events.filter(e => !e.data.success).forEach(event => {
      const errorType = event.data.errorType || 'unknown';
      const stats = errorStats.get(errorType) || { count: 0, lastOccurrence: '' };
      stats.count++;
      stats.lastOccurrence = event.timestamp;
      errorStats.set(errorType, stats);
    });

    const totalErrors = Array.from(errorStats.values()).reduce((sum, stats) => sum + stats.count, 0);

    return Array.from(errorStats.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      percentage: totalErrors > 0 ? (stats.count / totalErrors) * 100 : 0,
      lastOccurrence: stats.lastOccurrence
    }));
  }

  private analyzeRetryAttempts(events: AnalyticsEvent[]): RetryMetric[] {
    const retryStats = new Map<string, { attempts: number[]; successes: number }>();
    
    events.forEach(event => {
      const operation = event.data.operation;
      const retryCount = event.data.retryCount || 0;
      
      if (retryCount > 0) {
        if (!retryStats.has(operation)) {
          retryStats.set(operation, { attempts: [], successes: 0 });
        }
        
        const stats = retryStats.get(operation)!;
        stats.attempts.push(retryCount);
        if (event.data.success) {
          stats.successes++;
        }
      }
    });

    return Array.from(retryStats.entries()).map(([operation, stats]) => ({
      operation,
      attempts: stats.attempts.reduce((a, b) => a + b, 0) / stats.attempts.length,
      successRate: stats.attempts.length > 0 ? (stats.successes / stats.attempts.length) * 100 : 0
    }));
  }

  private calculateCacheHitRate(events: AnalyticsEvent[]): number {
    const cacheEvents = events.filter(e => e.data.cacheHit !== undefined);
    if (cacheEvents.length === 0) return 0;
    
    const hits = cacheEvents.filter(e => e.data.cacheHit).length;
    return (hits / cacheEvents.length) * 100;
  }

  private countActiveUsers(events: AnalyticsEvent[]): number {
    const uniqueUsers = new Set();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    events
      .filter(e => new Date(e.timestamp) > oneDayAgo)
      .forEach(e => uniqueUsers.add(e.data.userId));
    
    return uniqueUsers.size;
  }

  private calculateSystemAccessRate(events: AnalyticsEvent[]): number {
    const totalAttempts = events.length;
    const successfulAttempts = events.filter(e => e.data.success).length;
    
    return totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
  }

  private analyzeModuleUsage(events: AnalyticsEvent[]): ModuleUsageMetric[] {
    const moduleStats = new Map<string, { 
      accessCount: number; 
      users: Set<string>; 
      totalDuration: number 
    }>();
    
    events.forEach(event => {
      const module = event.data.module;
      const userId = event.data.userId;
      const duration = event.data.duration || 0;
      
      if (!moduleStats.has(module)) {
        moduleStats.set(module, { 
          accessCount: 0, 
          users: new Set(), 
          totalDuration: 0 
        });
      }
      
      const stats = moduleStats.get(module)!;
      stats.accessCount++;
      stats.users.add(userId);
      stats.totalDuration += duration;
    });

    return Array.from(moduleStats.entries()).map(([module, stats]) => ({
      module,
      accessCount: stats.accessCount,
      uniqueUsers: stats.users.size,
      averageSessionTime: stats.accessCount > 0 ? stats.totalDuration / stats.accessCount : 0
    }));
  }

  private findPeakUsageHours(events: AnalyticsEvent[]): HourMetric[] {
    const hourStats = new Map<number, { usage: number; users: Set<string> }>();
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      const userId = event.data.userId;
      
      if (!hourStats.has(hour)) {
        hourStats.set(hour, { usage: 0, users: new Set() });
      }
      
      const stats = hourStats.get(hour)!;
      stats.usage++;
      stats.users.add(userId);
    });

    return Array.from(hourStats.entries())
      .map(([hour, stats]) => ({
        hour,
        usage: stats.usage,
        activeUsers: stats.users.size
      }))
      .sort((a, b) => b.usage - a.usage);
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const durations = events
      .map(e => e.data.duration)
      .filter(d => d !== undefined && d > 0);
    
    if (durations.length === 0) return 0;
    
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  private analyzeRoleDistribution(events: AnalyticsEvent[]): RoleDistributionMetric[] {
    // Implementação simplificada - em um sistema real, isso consultaria dados históricos
    const roleCount = new Map<string, number>();
    
    events.forEach(event => {
      const role = event.data.role;
      if (role) {
        roleCount.set(role, (roleCount.get(role) || 0) + 1);
      }
    });

    const total = events.length;
    return Array.from(roleCount.entries()).map(([role, count]) => ({
      role,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      trend: 'stable' as const // Simplificado
    }));
  }

  private analyzeShiftDistribution(events: AnalyticsEvent[]): ShiftDistributionMetric[] {
    // Implementação simplificada
    return [
      { shift: 'manha', count: 0, percentage: 0, efficiency: 85 },
      { shift: 'tarde', count: 0, percentage: 0, efficiency: 90 },
      { shift: 'noite', count: 0, percentage: 0, efficiency: 80 }
    ];
  }

  private analyzeDepartmentDistribution(events: AnalyticsEvent[]): DepartmentMetric[] {
    // Implementação simplificada
    return [
      { department: 'Atendimento', employeeCount: 0, averageTenure: 12, turnoverRate: 15 },
      { department: 'Cozinha', employeeCount: 0, averageTenure: 18, turnoverRate: 10 },
      { department: 'Bar', employeeCount: 0, averageTenure: 15, turnoverRate: 12 }
    ];
  }

  private analyzeTenureDistribution(events: AnalyticsEvent[]): TenureMetric[] {
    // Implementação simplificada
    return [
      { range: '0-6 meses', count: 0, percentage: 0 },
      { range: '6-12 meses', count: 0, percentage: 0 },
      { range: '1-2 anos', count: 0, percentage: 0 },
      { range: '2+ anos', count: 0, percentage: 0 }
    ];
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  private getEventsByType(type: string): AnalyticsEvent[] {
    return this.events.filter(event => event.type === type);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('employee_analytics', JSON.stringify(this.events.slice(-1000)));
    } catch (error) {
      console.warn('Failed to save analytics to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('employee_analytics');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics from storage:', error);
    }
  }

  // Carregar dados ao inicializar
  constructor() {
    this.loadFromStorage();
  }
}

// ============================================================================
// INTERFACE DE EVENTO
// ============================================================================

interface AnalyticsEvent {
  type: string;
  timestamp: string;
  data: any;
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const employeeAnalytics = new EmployeeAnalyticsService();

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

export const trackEmployeeCreation = (data: any) => 
  employeeAnalytics.trackEmployeeCreation(data);

export const trackValidationError = (data: any) => 
  employeeAnalytics.trackValidationError(data);

export const trackSystemAccess = (data: any) => 
  employeeAnalytics.trackSystemAccess(data);

export const trackPerformance = (data: any) => 
  employeeAnalytics.trackPerformance(data);

export const getEmployeeAnalytics = () => 
  employeeAnalytics.generateCompleteAnalytics();

export default employeeAnalytics;