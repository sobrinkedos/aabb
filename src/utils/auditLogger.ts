/**
 * Sistema de Trilha de Auditoria
 */

import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id: string;
  user_id?: string;
  details: Record<string, any>;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

class AuditLogger {
  private context: { userId?: string; userEmail?: string } = {};

  setContext(userId: string, userEmail: string) {
    this.context = { userId, userEmail };
  }

  async log(
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: this.context.userId,
      details: this.sanitizeDetails(details),
      timestamp: new Date().toISOString(),
      success,
      error_message: errorMessage
    };

    try {
      await this.saveToDB(logEntry);
    } catch (error) {
      console.error('Failed to save audit log:', error);
      this.saveToLocalStorage(logEntry);
    }
  }

  async logEmployeeCreated(employeeId: string, employeeData: any): Promise<void> {
    await this.log('employee_created', 'employee', employeeId, {
      employee_name: employeeData.nome_completo || employeeData.name,
      employee_role: employeeData.bar_role,
      has_system_access: employeeData.tem_acesso_sistema
    });
  }

  async logEmployeeUpdated(employeeId: string, changes: any): Promise<void> {
    await this.log('employee_updated', 'employee', employeeId, {
      changes: this.sanitizeDetails(changes),
      fields_changed: Object.keys(changes)
    });
  }

  async logEmployeeDeactivated(employeeId: string, reason: string): Promise<void> {
    await this.log('employee_deactivated', 'employee', employeeId, {
      reason,
      deactivation_date: new Date().toISOString()
    });
  }

  async logLoginAttempt(email: string, success: boolean, errorMessage?: string): Promise<void> {
    await this.log(
      success ? 'login_success' : 'login_failure',
      'session',
      'login',
      { email },
      success,
      errorMessage
    );
  }

  private async saveToDB(logEntry: AuditLogEntry): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert([logEntry]);

    if (error) throw error;
  }

  private saveToLocalStorage(logEntry: AuditLogEntry): void {
    try {
      const existing = JSON.parse(localStorage.getItem('audit_logs_pending') || '[]');
      existing.push(logEntry);
      localStorage.setItem('audit_logs_pending', JSON.stringify(existing.slice(-100)));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive data
    const sensitiveFields = ['password', 'senha', 'token', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  async syncPendingLogs(): Promise<{ synced: number; failed: number }> {
    try {
      const pending = JSON.parse(localStorage.getItem('audit_logs_pending') || '[]');
      if (pending.length === 0) return { synced: 0, failed: 0 };

      await this.saveToDB(pending);
      localStorage.removeItem('audit_logs_pending');
      
      return { synced: pending.length, failed: 0 };
    } catch (error) {
      return { synced: 0, failed: 1 };
    }
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;