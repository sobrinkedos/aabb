import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContext';

/**
 * Interface para log de auditoria
 */
export interface LogAuditoria {
  id: string;
  empresa_id: string;
  usuario_id: string;
  acao: string;
  recurso: string;
  detalhes: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  usuario_nome?: string;
  usuario_email?: string;
}

/**
 * Interface para filtros de logs
 */
export interface FiltrosLog {
  usuario_id?: string;
  acao?: string;
  recurso?: string;
  data_inicio?: string;
  data_fim?: string;
  ip_address?: string;
  busca_texto?: string;
}

/**
 * Interface para estatísticas de logs
 */
export interface EstatisticasLogs {
  total_logs: number;
  logs_hoje: number;
  logs_semana: number;
  usuarios_ativos: number;
  acoes_mais_comuns: Array<{ acao: string; count: number }>;
  recursos_mais_acessados: Array<{ recurso: string; count: number }>;
}

/**
 * Interface para retorno do hook
 */
export interface UseLogsAuditoria {
  logs: LogAuditoria[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  estatisticas: EstatisticasLogs | null;
  carregarLogs: (page?: number, filtros?: FiltrosLog) => Promise<void>;
  exportarLogs: (formato: 'csv' | 'json', filtros?: FiltrosLog) => Promise<void>;
  limparLogsAntigos: (diasParaManter: number) => Promise<{ success: boolean; error?: string }>;
  obterEstatisticas: () => Promise<void>;
  registrarLog: (acao: string, recurso: string, detalhes?: any) => Promise<void>;
  buscarLogsPorUsuario: (usuarioId: string, limite?: number) => Promise<LogAuditoria[]>;
  buscarLogsPorRecurso: (recurso: string, limite?: number) => Promise<LogAuditoria[]>;
  analisarAtividadeSuspeita: () => Promise<Array<{ tipo: string; descricao: string; logs: LogAuditoria[] }>>;
}

/**
 * Hook para gerenciar logs de auditoria
 */
export const useLogsAuditoria = (itemsPerPage: number = 50): UseLogsAuditoria => {
  const { empresa, user } = useMultitenantAuth();
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [estatisticas, setEstatisticas] = useState<EstatisticasLogs | null>(null);

  /**
   * Carregar logs com filtros e paginação
   */
  const carregarLogs = useCallback(async (
    page: number = 1,
    filtros: FiltrosLog = {}
  ) => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `, { count: 'exact' })
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }
      
      if (filtros.acao) {
        query = query.eq('acao', filtros.acao);
      }
      
      if (filtros.recurso) {
        query = query.eq('recurso', filtros.recurso);
      }
      
      if (filtros.ip_address) {
        query = query.eq('ip_address', filtros.ip_address);
      }
      
      if (filtros.data_inicio) {
        query = query.gte('created_at', `${filtros.data_inicio}T00:00:00`);
      }
      
      if (filtros.data_fim) {
        query = query.lte('created_at', `${filtros.data_fim}T23:59:59`);
      }
      
      if (filtros.busca_texto) {
        query = query.or(`acao.ilike.%${filtros.busca_texto}%,recurso.ilike.%${filtros.busca_texto}%`);
      }

      // Paginação
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Processar dados
      const logsProcessados = data?.map(log => ({
        ...log,
        usuario_nome: log.usuarios_empresa?.nome_completo,
        usuario_email: log.usuarios_empresa?.email
      })) || [];

      setLogs(logsProcessados);
      setTotalLogs(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar logs';
      setError(errorMessage);
      console.error('Erro ao carregar logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id, itemsPerPage]);

  /**
   * Exportar logs
   */
  const exportarLogs = async (
    formato: 'csv' | 'json',
    filtros: FiltrosLog = {}
  ): Promise<void> => {
    if (!empresa?.id) return;

    try {
      // Buscar todos os logs com os filtros (sem paginação)
      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros.usuario_id) query = query.eq('usuario_id', filtros.usuario_id);
      if (filtros.acao) query = query.eq('acao', filtros.acao);
      if (filtros.recurso) query = query.eq('recurso', filtros.recurso);
      if (filtros.ip_address) query = query.eq('ip_address', filtros.ip_address);
      if (filtros.data_inicio) query = query.gte('created_at', `${filtros.data_inicio}T00:00:00`);
      if (filtros.data_fim) query = query.lte('created_at', `${filtros.data_fim}T23:59:59`);
      if (filtros.busca_texto) {
        query = query.or(`acao.ilike.%${filtros.busca_texto}%,recurso.ilike.%${filtros.busca_texto}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const logsExportacao = data?.map(log => ({
        data_hora: new Date(log.created_at).toLocaleString('pt-BR'),
        usuario: log.usuarios_empresa?.nome_completo || 'Sistema',
        email: log.usuarios_empresa?.email || '',
        acao: log.acao,
        recurso: log.recurso,
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
        detalhes: JSON.stringify(log.detalhes)
      })) || [];

      if (formato === 'csv') {
        const csv = [
          'Data/Hora,Usuário,Email,Ação,Recurso,IP,User Agent,Detalhes',
          ...logsExportacao.map(log => 
            `"${log.data_hora}","${log.usuario}","${log.email}","${log.acao}","${log.recurso}","${log.ip_address}","${log.user_agent}","${log.detalhes}"`
          )
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `logs_auditoria_${empresa.nome}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        const json = JSON.stringify({
          empresa: empresa.nome,
          data_exportacao: new Date().toISOString(),
          filtros_aplicados: filtros,
          total_registros: logsExportacao.length,
          logs: logsExportacao
        }, null, 2);
        
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `logs_auditoria_${empresa.nome}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
    } catch (err) {
      console.error('Erro ao exportar logs:', err);
      throw err;
    }
  };

  /**
   * Limpar logs antigos
   */
  const limparLogsAntigos = async (
    diasParaManter: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!empresa?.id) {
      return { success: false, error: 'Empresa não identificada' };
    }

    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasParaManter);
      
      const { error } = await supabase
        .from('logs_auditoria')
        .delete()
        .eq('empresa_id', empresa.id)
        .lt('created_at', dataLimite.toISOString());

      if (error) {
        throw new Error(error.message);
      }

      // Registrar a limpeza
      await registrarLog('CLEANUP_LOGS', 'logs_auditoria', {
        dias_mantidos: diasParaManter,
        data_limite: dataLimite.toISOString()
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar logs';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Obter estatísticas dos logs
   */
  const obterEstatisticas = async (): Promise<void> => {
    if (!empresa?.id) return;

    try {
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - 7);
      const inicioHoje = new Date(hoje);
      inicioHoje.setHours(0, 0, 0, 0);

      // Total de logs
      const { count: totalLogs } = await supabase
        .from('logs_auditoria')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa.id);

      // Logs de hoje
      const { count: logsHoje } = await supabase
        .from('logs_auditoria')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa.id)
        .gte('created_at', inicioHoje.toISOString());

      // Logs da semana
      const { count: logsSemana } = await supabase
        .from('logs_auditoria')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa.id)
        .gte('created_at', inicioSemana.toISOString());

      // Usuários únicos
      const { data: usuariosUnicos } = await supabase
        .from('logs_auditoria')
        .select('usuario_id')
        .eq('empresa_id', empresa.id)
        .gte('created_at', inicioSemana.toISOString());

      const usuariosAtivos = new Set(usuariosUnicos?.map(u => u.usuario_id)).size;

      // Ações mais comuns (últimos 30 dias)
      const inicio30Dias = new Date(hoje);
      inicio30Dias.setDate(hoje.getDate() - 30);

      const { data: acoesData } = await supabase
        .from('logs_auditoria')
        .select('acao')
        .eq('empresa_id', empresa.id)
        .gte('created_at', inicio30Dias.toISOString());

      const acoesCount = acoesData?.reduce((acc, log) => {
        acc[log.acao] = (acc[log.acao] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const acoesMaisComuns = Object.entries(acoesCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([acao, count]) => ({ acao, count }));

      // Recursos mais acessados
      const { data: recursosData } = await supabase
        .from('logs_auditoria')
        .select('recurso')
        .eq('empresa_id', empresa.id)
        .gte('created_at', inicio30Dias.toISOString());

      const recursosCount = recursosData?.reduce((acc, log) => {
        acc[log.recurso] = (acc[log.recurso] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const recursosMaisAcessados = Object.entries(recursosCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([recurso, count]) => ({ recurso, count }));

      setEstatisticas({
        total_logs: totalLogs || 0,
        logs_hoje: logsHoje || 0,
        logs_semana: logsSemana || 0,
        usuarios_ativos: usuariosAtivos,
        acoes_mais_comuns: acoesMaisComuns,
        recursos_mais_acessados: recursosMaisAcessados
      });
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err);
    }
  };

  /**
   * Registrar novo log de auditoria
   */
  const registrarLog = async (
    acao: string,
    recurso: string,
    detalhes: any = {}
  ): Promise<void> => {
    if (!empresa?.id || !user?.user_id) return;

    try {
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresa.id,
        p_usuario_id: user.user_id,
        p_acao: acao,
        p_recurso: recurso,
        p_detalhes: {
          ...detalhes,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        },
        p_ip_address: null, // Será preenchido pelo servidor
        p_user_agent: navigator.userAgent
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  };

  /**
   * Buscar logs por usuário específico
   */
  const buscarLogsPorUsuario = async (
    usuarioId: string,
    limite: number = 100
  ): Promise<LogAuditoria[]> => {
    if (!empresa?.id) return [];

    try {
      const { data, error } = await supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(log => ({
        ...log,
        usuario_nome: log.usuarios_empresa?.nome_completo,
        usuario_email: log.usuarios_empresa?.email
      })) || [];
    } catch (err) {
      console.error('Erro ao buscar logs por usuário:', err);
      return [];
    }
  };

  /**
   * Buscar logs por recurso específico
   */
  const buscarLogsPorRecurso = async (
    recurso: string,
    limite: number = 100
  ): Promise<LogAuditoria[]> => {
    if (!empresa?.id) return [];

    try {
      const { data, error } = await supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id)
        .eq('recurso', recurso)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(log => ({
        ...log,
        usuario_nome: log.usuarios_empresa?.nome_completo,
        usuario_email: log.usuarios_empresa?.email
      })) || [];
    } catch (err) {
      console.error('Erro ao buscar logs por recurso:', err);
      return [];
    }
  };

  /**
   * Analisar atividade suspeita
   */
  const analisarAtividadeSuspeita = async (): Promise<Array<{
    tipo: string;
    descricao: string;
    logs: LogAuditoria[];
  }>> => {
    if (!empresa?.id) return [];

    try {
      const alertas: Array<{ tipo: string; descricao: string; logs: LogAuditoria[] }> = [];
      const agora = new Date();
      const ultimaHora = new Date(agora.getTime() - 60 * 60 * 1000);
      const ultimoDia = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      // 1. Múltiplas tentativas de login falhadas
      const { data: loginsFalhados } = await supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id)
        .eq('acao', 'FAILED_LOGIN')
        .gte('created_at', ultimaHora.toISOString())
        .order('created_at', { ascending: false });

      if (loginsFalhados && loginsFalhados.length >= 5) {
        alertas.push({
          tipo: 'TENTATIVAS_LOGIN_SUSPEITAS',
          descricao: `${loginsFalhados.length} tentativas de login falhadas na última hora`,
          logs: loginsFalhados.map(log => ({
            ...log,
            usuario_nome: log.usuarios_empresa?.nome_completo,
            usuario_email: log.usuarios_empresa?.email
          }))
        });
      }

      // 2. Atividade fora do horário comercial
      const horaAtual = agora.getHours();
      if (horaAtual < 6 || horaAtual > 22) {
        const { data: atividadeNoturna } = await supabase
          .from('logs_auditoria')
          .select(`
            *,
            usuarios_empresa!inner(
              nome_completo,
              email
            )
          `)
          .eq('empresa_id', empresa.id)
          .gte('created_at', ultimaHora.toISOString())
          .neq('acao', 'LOGIN')
          .neq('acao', 'LOGOUT')
          .order('created_at', { ascending: false });

        if (atividadeNoturna && atividadeNoturna.length > 0) {
          alertas.push({
            tipo: 'ATIVIDADE_FORA_HORARIO',
            descricao: `${atividadeNoturna.length} atividades registradas fora do horário comercial`,
            logs: atividadeNoturna.map(log => ({
              ...log,
              usuario_nome: log.usuarios_empresa?.nome_completo,
              usuario_email: log.usuarios_empresa?.email
            }))
          });
        }
      }

      // 3. Múltiplas exclusões em sequência
      const { data: exclusoes } = await supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id)
        .eq('acao', 'DELETE')
        .gte('created_at', ultimaHora.toISOString())
        .order('created_at', { ascending: false });

      if (exclusoes && exclusoes.length >= 10) {
        alertas.push({
          tipo: 'MULTIPLAS_EXCLUSOES',
          descricao: `${exclusoes.length} exclusões realizadas na última hora`,
          logs: exclusoes.map(log => ({
            ...log,
            usuario_nome: log.usuarios_empresa?.nome_completo,
            usuario_email: log.usuarios_empresa?.email
          }))
        });
      }

      // 4. Alterações em configurações críticas
      const { data: configCriticas } = await supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios_empresa!inner(
            nome_completo,
            email
          )
        `)
        .eq('empresa_id', empresa.id)
        .like('acao', 'CONFIG_%')
        .gte('created_at', ultimoDia.toISOString())
        .order('created_at', { ascending: false });

      if (configCriticas && configCriticas.length > 0) {
        alertas.push({
          tipo: 'ALTERACOES_CONFIGURACAO',
          descricao: `${configCriticas.length} alterações em configurações nas últimas 24 horas`,
          logs: configCriticas.map(log => ({
            ...log,
            usuario_nome: log.usuarios_empresa?.nome_completo,
            usuario_email: log.usuarios_empresa?.email
          }))
        });
      }

      return alertas;
    } catch (err) {
      console.error('Erro ao analisar atividade suspeita:', err);
      return [];
    }
  };

  return {
    logs,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalLogs,
    estatisticas,
    carregarLogs,
    exportarLogs,
    limparLogsAntigos,
    obterEstatisticas,
    registrarLog,
    buscarLogsPorUsuario,
    buscarLogsPorRecurso,
    analisarAtividadeSuspeita
  };
};

/**
 * Hook para monitoramento em tempo real de logs
 */
export const useMonitoramentoLogs = () => {
  const { empresa } = useMultitenantAuth();
  const [novosLogs, setNovosLogs] = useState<LogAuditoria[]>([]);
  const [alertas, setAlertas] = useState<Array<{ tipo: string; descricao: string }>>([]);

  useEffect(() => {
    if (!empresa?.id) return;

    // Configurar subscription para novos logs
    const subscription = supabase
      .channel('logs_auditoria')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'logs_auditoria',
          filter: `empresa_id=eq.${empresa.id}`
        },
        (payload) => {
          const novoLog = payload.new as LogAuditoria;
          setNovosLogs(prev => [novoLog, ...prev.slice(0, 9)]); // Manter apenas os 10 mais recentes
          
          // Verificar se é uma atividade suspeita
          if (novoLog.acao === 'FAILED_LOGIN') {
            setAlertas(prev => [{
              tipo: 'LOGIN_FALHADO',
              descricao: `Tentativa de login falhada para ${novoLog.usuario_email || 'usuário desconhecido'}`
            }, ...prev.slice(0, 4)]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [empresa?.id]);

  const limparNovosLogs = () => setNovosLogs([]);
  const limparAlertas = () => setAlertas([]);

  return {
    novosLogs,
    alertas,
    limparNovosLogs,
    limparAlertas
  };
};