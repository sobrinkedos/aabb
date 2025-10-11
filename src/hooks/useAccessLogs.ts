import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';
import { AccessLog, AccessLogFilters, AccessLogsHook } from '../types/admin';

export const useAccessLogs = (): AccessLogsHook => {
  const { empresa } = useMultitenantAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 20;

  // Carregar logs
  const loadLogs = useCallback(async (page: number = 1, filters: AccessLogFilters = {}) => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Construir query base
      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner (
            nome_completo,
            email
          )
        `, { count: 'exact' })
        .eq('empresa_id', empresa.id);

      // Aplicar filtros
      if (filters.userId) {
        query = query.eq('usuario_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('acao', filters.action);
      }

      if (filters.success !== undefined && filters.success !== '') {
        const success = filters.success === 'true';
        query = query.eq('sucesso', success);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }

      if (filters.search) {
        query = query.or(`
          usuarios_empresa.nome_completo.ilike.%${filters.search}%,
          usuarios_empresa.email.ilike.%${filters.search}%,
          acao.ilike.%${filters.search}%,
          recurso.ilike.%${filters.search}%
        `);
      }

      // Aplicar paginação e ordenação
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error: queryError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) throw queryError;

      // Transformar dados
      const transformedLogs: AccessLog[] = (data || []).map(log => ({
        id: log.id,
        userId: log.usuario_id,
        userName: log.usuarios_empresa?.nome_completo || 'Usuário Desconhecido',
        userEmail: log.usuarios_empresa?.email || '',
        action: log.acao,
        resource: log.recurso,
        success: log.sucesso,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        timestamp: new Date(log.created_at),
        details: log.detalhes
      }));

      setLogs(transformedLogs);
      setTotalCount(count || 0);
      setCurrentPage(page);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar logs';
      setError(errorMessage);
      console.error('Erro ao carregar logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id]);

  // Exportar logs
  const exportLogs = useCallback(async (filters: AccessLogFilters = {}) => {
    if (!empresa?.id) return;

    try {
      setError(null);

      // Construir query para exportação (sem paginação)
      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner (
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id);

      // Aplicar os mesmos filtros
      if (filters.userId) {
        query = query.eq('usuario_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('acao', filters.action);
      }

      if (filters.success !== undefined && filters.success !== '') {
        const success = filters.success === 'true';
        query = query.eq('sucesso', success);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }

      if (filters.search) {
        query = query.or(`
          usuarios_empresa.nome_completo.ilike.%${filters.search}%,
          usuarios_empresa.email.ilike.%${filters.search}%,
          acao.ilike.%${filters.search}%,
          recurso.ilike.%${filters.search}%
        `);
      }

      const { data, error: queryError } = await query
        .order('created_at', { ascending: false })
        .limit(10000); // Limite para exportação

      if (queryError) throw queryError;

      // Transformar dados para CSV
      const csvData = (data || []).map(log => ({
        'Data/Hora': new Date(log.created_at).toLocaleString('pt-BR'),
        'Usuário': log.usuarios_empresa?.nome_completo || 'Usuário Desconhecido',
        'Email': log.usuarios_empresa?.email || '',
        'Ação': log.acao,
        'Recurso': log.recurso,
        'Status': log.sucesso ? 'Sucesso' : 'Falha',
        'IP': log.ip_address || '',
        'User Agent': log.user_agent || ''
      }));

      // Gerar CSV
      const csvContent = generateCSV(csvData);
      
      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar logs';
      setError(errorMessage);
      console.error('Erro ao exportar logs:', err);
    }
  }, [empresa?.id]);

  // Atualizar logs
  const refreshLogs = useCallback(async () => {
    await loadLogs(currentPage);
  }, [loadLogs, currentPage]);

  // Função auxiliar para gerar CSV
  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Adicionar cabeçalhos
    csvRows.push(headers.join(','));

    // Adicionar dados
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escapar aspas e adicionar aspas se necessário
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  return {
    logs,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    loadLogs,
    exportLogs,
    refreshLogs
  };
};