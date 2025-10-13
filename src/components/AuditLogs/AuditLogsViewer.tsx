/**
 * Visualizador de Logs de Auditoria
 */

import React, { useState, useEffect } from 'react';
import { Shield, Calendar, User, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id?: string;
  details: Record<string, any>;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

interface AuditLogsViewerProps {
  employeeId?: string;
  limit?: number;
}

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({
  employeeId,
  limit = 50
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, [employeeId, filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (employeeId) {
        query = query.eq('resource_id', employeeId);
      }

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      employee_created: 'Funcionário Criado',
      employee_updated: 'Funcionário Atualizado',
      employee_deactivated: 'Funcionário Desativado',
      employee_reactivated: 'Funcionário Reativado',
      employee_deleted: 'Funcionário Removido',
      login_success: 'Login Realizado',
      login_failure: 'Falha no Login',
      credentials_created: 'Credenciais Criadas',
      credentials_reset: 'Senha Resetada'
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string, success: boolean) => {
    if (!success) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    const icons: Record<string, React.ReactNode> = {
      employee_created: <User className="h-4 w-4 text-green-500" />,
      employee_updated: <User className="h-4 w-4 text-blue-500" />,
      employee_deactivated: <User className="h-4 w-4 text-yellow-500" />,
      employee_deleted: <User className="h-4 w-4 text-red-500" />,
      login_success: <CheckCircle className="h-4 w-4 text-green-500" />,
      credentials_created: <Shield className="h-4 w-4 text-blue-500" />
    };

    return icons[action] || <CheckCircle className="h-4 w-4 text-gray-500" />;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Logs de Auditoria</h3>
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="all">Todas as ações</option>
          <option value="employee_created">Criações</option>
          <option value="employee_updated">Atualizações</option>
          <option value="employee_deactivated">Desativações</option>
          <option value="login_success">Logins</option>
        </select>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-start space-x-3">
                {getActionIcon(log.action, log.success)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {getActionLabel(log.action)}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-1">
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800">
                          Ver detalhes
                        </summary>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                  
                  {log.error_message && (
                    <p className="text-xs text-red-600 mt-1">
                      Erro: {log.error_message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogsViewer;