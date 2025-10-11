import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';
import { 
  BackupJob,
  RestorePoint,
  SecurityPolicy,
  SecurityIncident,
  SecurityAuditLog,
  BackupSecurityHook,
  IntegrityCheck,
  RestoreOperation
} from '../types/backup-security';

export const useBackupSecurity = (): BackupSecurityHook => {
  const { empresa, user } = useMultitenantAuth();
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Carregar backup jobs
      const { data: backupData, error: backupError } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (backupError) throw backupError;

      // Carregar pontos de restauração
      const { data: restoreData, error: restoreError } = await supabase
        .from('restore_points')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (restoreError) throw restoreError;

      // Carregar políticas de segurança
      const { data: policiesData, error: policiesError } = await supabase
        .from('security_policies')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;

      // Carregar incidentes de segurança
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('detected_at', { ascending: false })
        .limit(100);

      if (incidentsError) throw incidentsError;

      // Carregar logs de auditoria
      const { data: auditData, error: auditError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (auditError) throw auditError;

      setBackupJobs(backupData || []);
      setRestorePoints(restoreData || []);
      setSecurityPolicies(policiesData || []);
      setSecurityIncidents(incidentsData || []);
      setAuditLogs(auditData || []);

    } catch (err) {
      console.error('Erro ao carregar dados de backup e segurança:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id]);

  // Criar backup job
  const createBackupJob = useCallback(async (jobData: Partial<BackupJob>) => {
    if (!empresa?.id || !user?.id) throw new Error('Empresa ou usuário não identificado');

    try {
      const { data, error } = await supabase
        .from('backup_jobs')
        .insert([{
          ...jobData,
          empresa_id: empresa.id,
          created_by: user.id,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setBackupJobs(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar backup job:', error);
      throw error;
    }
  }, [empresa?.id, user?.id]);

  // Atualizar backup job
  const updateBackupJob = useCallback(async (id: string, updates: Partial<BackupJob>) => {
    try {
      const { data, error } = await supabase
        .from('backup_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBackupJobs(prev => 
        prev.map(job => 
          job.id === id ? { ...job, ...data } : job
        )
      );

      return data;
    } catch (error) {
      console.error('Erro ao atualizar backup job:', error);
      throw error;
    }
  }, []);

  // Deletar backup job
  const deleteBackupJob = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('backup_jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBackupJobs(prev => prev.filter(job => job.id !== id));
    } catch (error) {
      console.error('Erro ao deletar backup job:', error);
      throw error;
    }
  }, []);

  // Executar backup
  const executeBackup = useCallback(async (jobId: string) => {
    try {
      // Atualizar status para running
      await updateBackupJob(jobId, { 
        status: 'running',
        lastRun: new Date().toISOString()
      });

      // Simular execução do backup
      setTimeout(async () => {
        const success = Math.random() > 0.1; // 90% de chance de sucesso
        const size = Math.floor(Math.random() * 1000000000) + 100000000; // 100MB - 1GB

        await updateBackupJob(jobId, {
          status: success ? 'completed' : 'failed',
          size: success ? size : undefined,
          error: success ? undefined : 'Erro simulado durante backup',
          nextRun: success ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
        });

        // Criar ponto de restauração se bem-sucedido
        if (success) {
          await createRestorePoint({
            name: `Backup automático - ${new Date().toLocaleDateString('pt-BR')}`,
            description: 'Ponto de restauração criado automaticamente',
            type: 'full',
            version: '1.0.0',
            size,
            checksum: Math.random().toString(36).substring(7),
            isValid: true,
            backupJobId: jobId
          });
        }
      }, 3000);

    } catch (error) {
      console.error('Erro ao executar backup:', error);
      throw error;
    }
  }, [updateBackupJob]);

  // Agendar backup
  const scheduleBackup = useCallback(async (jobId: string, schedule: string) => {
    try {
      await updateBackupJob(jobId, { 
        schedule,
        status: 'scheduled',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Próximo em 24h
      });
    } catch (error) {
      console.error('Erro ao agendar backup:', error);
      throw error;
    }
  }, [updateBackupJob]);

  // Cancelar backup
  const cancelBackup = useCallback(async (jobId: string) => {
    try {
      await updateBackupJob(jobId, { 
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Erro ao cancelar backup:', error);
      throw error;
    }
  }, [updateBackupJob]);

  // Criar ponto de restauração
  const createRestorePoint = useCallback(async (data: Partial<RestorePoint>) => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      const { data: result, error } = await supabase
        .from('restore_points')
        .insert([{
          ...data,
          empresa_id: empresa.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setRestorePoints(prev => [result, ...prev]);
      return result;
    } catch (error) {
      console.error('Erro ao criar ponto de restauração:', error);
      throw error;
    }
  }, [empresa?.id]);

  // Restaurar do ponto
  const restoreFromPoint = useCallback(async (pointId: string, options?: any): Promise<RestoreOperation> => {
    try {
      // Simular operação de restauração
      const operation: RestoreOperation = {
        id: Date.now().toString(),
        restorePointId: pointId,
        status: 'running',
        progress: 0,
        startedAt: new Date().toISOString(),
        restoredItems: [],
        skippedItems: [],
        failedItems: []
      };

      // Simular progresso
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% de chance de sucesso
        operation.status = success ? 'completed' : 'failed';
        operation.progress = 100;
        operation.completedAt = new Date().toISOString();
        
        if (!success) {
          operation.error = 'Erro simulado durante restauração';
        }
      }, 5000);

      return operation;
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      throw error;
    }
  }, []);

  // Validar integridade do backup
  const validateBackupIntegrity = useCallback(async (backupId: string): Promise<IntegrityCheck> => {
    try {
      // Simular verificação de integridade
      await new Promise(resolve => setTimeout(resolve, 2000));

      const isValid = Math.random() > 0.1; // 90% de chance de ser válido
      const issues = isValid ? [] : ['Checksum inválido', 'Arquivo corrompido'];

      const result: IntegrityCheck = {
        id: Date.now().toString(),
        backupId,
        isValid,
        checkedAt: new Date().toISOString(),
        checksum: Math.random().toString(36).substring(7),
        expectedChecksum: Math.random().toString(36).substring(7),
        issues,
        fileCount: Math.floor(Math.random() * 1000) + 100,
        totalSize: Math.floor(Math.random() * 1000000000) + 100000000
      };

      return result;
    } catch (error) {
      console.error('Erro ao validar integridade:', error);
      throw error;
    }
  }, []);

  // Criar política de segurança
  const createSecurityPolicy = useCallback(async (policy: Partial<SecurityPolicy>) => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      const { data, error } = await supabase
        .from('security_policies')
        .insert([{
          ...policy,
          empresa_id: empresa.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setSecurityPolicies(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar política de segurança:', error);
      throw error;
    }
  }, [empresa?.id]);

  // Atualizar política de segurança
  const updateSecurityPolicy = useCallback(async (id: string, updates: Partial<SecurityPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('security_policies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSecurityPolicies(prev => 
        prev.map(policy => 
          policy.id === id ? { ...policy, ...data } : policy
        )
      );

      return data;
    } catch (error) {
      console.error('Erro ao atualizar política de segurança:', error);
      throw error;
    }
  }, []);

  // Deletar política de segurança
  const deleteSecurityPolicy = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSecurityPolicies(prev => prev.filter(policy => policy.id !== id));
    } catch (error) {
      console.error('Erro ao deletar política de segurança:', error);
      throw error;
    }
  }, []);

  // Detectar atividade suspeita
  const detectSuspiciousActivity = useCallback(async (): Promise<SecurityIncident[]> => {
    try {
      // Simular detecção de atividades suspeitas
      const incidents: SecurityIncident[] = [];
      
      // Verificar tentativas de login falhadas
      const failedLogins = auditLogs.filter(log => 
        log.action === 'LOGIN' && 
        !log.success &&
        new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // última hora
      );

      if (failedLogins.length > 5) {
        incidents.push({
          id: Date.now().toString(),
          type: 'unauthorized_access',
          severity: 'high',
          status: 'open',
          title: 'Múltiplas tentativas de login falhadas',
          description: `${failedLogins.length} tentativas de login falhadas na última hora`,
          detectedAt: new Date().toISOString(),
          affectedResources: ['authentication'],
          evidence: { failedAttempts: failedLogins.length },
          actions: []
        });
      }

      return incidents;
    } catch (error) {
      console.error('Erro ao detectar atividade suspeita:', error);
      return [];
    }
  }, [auditLogs]);

  // Criar incidente de segurança
  const createSecurityIncident = useCallback(async (incident: Partial<SecurityIncident>) => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert([{
          ...incident,
          empresa_id: empresa.id,
          detected_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setSecurityIncidents(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar incidente de segurança:', error);
      throw error;
    }
  }, [empresa?.id]);

  // Resolver incidente de segurança
  const resolveSecurityIncident = useCallback(async (id: string, resolution: string) => {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution
        })
        .eq('id', id);

      if (error) throw error;

      setSecurityIncidents(prev => 
        prev.map(incident => 
          incident.id === id 
            ? { ...incident, status: 'resolved', resolvedAt: new Date().toISOString() }
            : incident
        )
      );
    } catch (error) {
      console.error('Erro ao resolver incidente:', error);
      throw error;
    }
  }, []);

  // Obter logs de auditoria
  const getAuditLogs = useCallback(async (filters?: any): Promise<SecurityAuditLog[]> => {
    try {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('timestamp', { ascending: false });

      if (filters?.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }

      if (filters?.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      return [];
    }
  }, [empresa?.id]);

  // Exportar logs de auditoria
  const exportAuditLogs = useCallback(async (filters?: any): Promise<Blob> => {
    try {
      const logs = await getAuditLogs(filters);
      
      const csvData = logs.map(log => [
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.userEmail || 'Sistema',
        log.action,
        log.resource,
        log.sourceIP,
        log.success ? 'Sucesso' : 'Falha',
        log.riskLevel
      ]);

      const headers = ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'IP', 'Status', 'Risco'];
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      throw error;
    }
  }, [getAuditLogs]);

  // Obter histórico de backups
  const getBackupHistory = useCallback(async (jobId?: string): Promise<BackupJob[]> => {
    try {
      let query = supabase
        .from('backup_jobs')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('id', jobId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao carregar histórico de backups:', error);
      return [];
    }
  }, [empresa?.id]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    backupJobs,
    restorePoints,
    securityPolicies,
    securityIncidents,
    auditLogs,
    isLoading,
    error,
    createBackupJob,
    updateBackupJob,
    deleteBackupJob,
    executeBackup,
    scheduleBackup,
    cancelBackup,
    createRestorePoint,
    restoreFromPoint,
    validateBackupIntegrity,
    createSecurityPolicy,
    updateSecurityPolicy,
    deleteSecurityPolicy,
    detectSuspiciousActivity,
    createSecurityIncident,
    resolveSecurityIncident,
    getAuditLogs,
    exportAuditLogs,
    getBackupHistory,
    refreshData: loadData
  };
};