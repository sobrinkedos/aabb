import React, { useState, useEffect } from 'react';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContextSimple';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';
import { ModuloSistema } from '../../types/multitenant';
import { supabase } from '../../lib/supabase';

interface LogAuditoria {
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

interface FiltrosLog {
  usuario_id?: string;
  acao?: string;
  recurso?: string;
  data_inicio?: string;
  data_fim?: string;
  ip_address?: string;
  busca_texto?: string;
}

const ACOES_SISTEMA = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'CONFIG_UPDATE',
  'CONFIG_RESET',
  'CONFIG_IMPORT',
  'PERMISSION_CHANGE',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'FAILED_LOGIN',
  'SECURITY_ALERT'
];

const RECURSOS_SISTEMA = [
  'usuarios_empresa',
  'permissoes_usuario',
  'configuracoes_empresa',
  'logs_auditoria',
  'empresas',
  'inventory_items',
  'menu_items',
  'orders',
  'customers',
  'employees'
];

export const LogsAuditoria: React.FC = () => {
  const { empresa } = useMultitenantAuth();
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosLog>({
    data_inicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias atrás
    data_fim: new Date().toISOString().split('T')[0] // hoje
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 50;

  // Carregar logs
  const carregarLogs = async (page = 1) => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      
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

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao carregar logs:', error);
        return;
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
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuários para filtro
  const [usuarios, setUsuarios] = useState<Array<{id: string, nome: string, email: string}>>([]);
  
  const carregarUsuarios = async () => {
    if (!empresa?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('usuarios_empresa')
        .select('id, nome_completo, email')
        .eq('empresa_id', empresa.id)
        .order('nome_completo');

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        return;
      }

      setUsuarios(data?.map(u => ({
        id: u.id,
        nome: u.nome_completo,
        email: u.email
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Exportar logs
  const exportarLogs = async (formato: 'csv' | 'json') => {
    if (!empresa?.id) return;

    try {
      setIsExporting(true);
      
      // Buscar todos os logs com os filtros atuais (sem paginação)
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

      // Aplicar os mesmos filtros
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
        console.error('Erro ao exportar logs:', error);
        return;
      }

      const logsExportacao = data?.map(log => ({
        data_hora: new Date(log.created_at).toLocaleString('pt-BR'),
        usuario: log.usuarios_empresa?.nome_completo || 'Sistema',
        email: log.usuarios_empresa?.email || '',
        acao: log.acao,
        recurso: log.recurso,
        ip_address: log.ip_address || '',
        detalhes: JSON.stringify(log.detalhes)
      })) || [];

      if (formato === 'csv') {
        const csv = [
          'Data/Hora,Usuário,Email,Ação,Recurso,IP,Detalhes',
          ...logsExportacao.map(log => 
            `"${log.data_hora}","${log.usuario}","${log.email}","${log.acao}","${log.recurso}","${log.ip_address}","${log.detalhes}"`
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
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Limpar logs antigos
  const limparLogsAntigos = async (diasParaManter: number) => {
    if (!empresa?.id) return;
    
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir logs com mais de ${diasParaManter} dias? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmacao) return;

    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasParaManter);
      
      const { error } = await supabase
        .from('logs_auditoria')
        .delete()
        .eq('empresa_id', empresa.id)
        .lt('created_at', dataLimite.toISOString());

      if (error) {
        console.error('Erro ao limpar logs:', error);
        alert('Erro ao limpar logs antigos');
        return;
      }

      alert('Logs antigos removidos com sucesso');
      carregarLogs(1);
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      alert('Erro ao limpar logs antigos');
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setCurrentPage(1);
    carregarLogs(1);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      data_inicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_fim: new Date().toISOString().split('T')[0]
    });
    setCurrentPage(1);
  };

  // Formatar ação para exibição
  const formatarAcao = (acao: string): { texto: string; cor: string; icone: string } => {
    const acaoUpper = acao.toUpperCase();
    
    if (acaoUpper.includes('LOGIN')) {
      return { texto: 'Login', cor: 'text-green-600 bg-green-100', icone: '🔓' };
    }
    if (acaoUpper.includes('LOGOUT')) {
      return { texto: 'Logout', cor: 'text-gray-600 bg-gray-100', icone: '🔒' };
    }
    if (acaoUpper.includes('CREATE')) {
      return { texto: 'Criar', cor: 'text-blue-600 bg-blue-100', icone: '➕' };
    }
    if (acaoUpper.includes('UPDATE')) {
      return { texto: 'Atualizar', cor: 'text-yellow-600 bg-yellow-100', icone: '✏️' };
    }
    if (acaoUpper.includes('DELETE')) {
      return { texto: 'Excluir', cor: 'text-red-600 bg-red-100', icone: '🗑️' };
    }
    if (acaoUpper.includes('FAILED')) {
      return { texto: 'Falha', cor: 'text-red-600 bg-red-100', icone: '❌' };
    }
    if (acaoUpper.includes('CONFIG')) {
      return { texto: 'Configuração', cor: 'text-purple-600 bg-purple-100', icone: '⚙️' };
    }
    if (acaoUpper.includes('PERMISSION')) {
      return { texto: 'Permissão', cor: 'text-indigo-600 bg-indigo-100', icone: '🛡️' };
    }
    
    return { texto: acao, cor: 'text-gray-600 bg-gray-100', icone: '📝' };
  };

  useEffect(() => {
    if (empresa?.id) {
      carregarUsuarios();
      carregarLogs(1);
    }
  }, [empresa?.id]);

  return (
    <ProtectedRoute modulo={ModuloSistema.CONFIGURACOES} acao="visualizar" requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoria</h1>
            <p className="mt-2 text-gray-600">
              Visualize e analise todas as atividades registradas no sistema
            </p>
          </div>

          {/* Controles */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => exportarLogs('csv')}
                    disabled={isExporting}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    📊 CSV
                  </button>
                  
                  <button
                    onClick={() => exportarLogs('json')}
                    disabled={isExporting}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    📄 JSON
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => limparLogsAntigos(90)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  🗑️ Limpar 90+ dias
                </button>
                
                <button
                  onClick={() => carregarLogs(currentPage)}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Carregando...
                    </>
                  ) : (
                    '🔄 Atualizar'
                  )}
                </button>
              </div>
            </div>

            {/* Filtros */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Usuário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usuário
                    </label>
                    <select
                      value={filtros.usuario_id || ''}
                      onChange={(e) => setFiltros(prev => ({ ...prev, usuario_id: e.target.value || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todos os usuários</option>
                      {usuarios.map(usuario => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nome} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ação
                    </label>
                    <select
                      value={filtros.acao || ''}
                      onChange={(e) => setFiltros(prev => ({ ...prev, acao: e.target.value || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todas as ações</option>
                      {ACOES_SISTEMA.map(acao => (
                        <option key={acao} value={acao}>{acao}</option>
                      ))}
                    </select>
                  </div>

                  {/* Recurso */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurso
                    </label>
                    <select
                      value={filtros.recurso || ''}
                      onChange={(e) => setFiltros(prev => ({ ...prev, recurso: e.target.value || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todos os recursos</option>
                      {RECURSOS_SISTEMA.map(recurso => (
                        <option key={recurso} value={recurso}>{recurso}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data Início */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={filtros.data_inicio || ''}
                      onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Data Fim */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={filtros.data_fim || ''}
                      onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Busca Texto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Busca
                    </label>
                    <input
                      type="text"
                      value={filtros.busca_texto || ''}
                      onChange={(e) => setFiltros(prev => ({ ...prev, busca_texto: e.target.value || undefined }))}
                      placeholder="Buscar em ações e recursos..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={aplicarFiltros}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Aplicar Filtros
                  </button>
                  
                  <button
                    onClick={limparFiltros}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Logs</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalLogs.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📄</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Página Atual</dt>
                      <dd className="text-lg font-medium text-gray-900">{currentPage} de {totalPages}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Usuários Ativos</dt>
                      <dd className="text-lg font-medium text-gray-900">{usuarios.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🔍</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Filtros Ativos</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Object.values(filtros).filter(v => v && v !== '').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Logs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum log encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há logs que correspondam aos filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recurso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => {
                      const acaoFormatada = formatarAcao(log.acao);
                      
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {log.usuario_nome || 'Sistema'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.usuario_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${acaoFormatada.cor}`}>
                              <span className="mr-1">{acaoFormatada.icone}</span>
                              {acaoFormatada.texto}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.recurso}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ip_address || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => carregarLogs(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => carregarLogs(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalLogs)}
                      </span>{' '}
                      de <span className="font-medium">{totalLogs}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => carregarLogs(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Páginas */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (page > totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => carregarLogs(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => carregarLogs(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Próximo</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Log de Auditoria
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data/Hora</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Usuário</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedLog.usuario_nome || 'Sistema'}
                    </p>
                    {selectedLog.usuario_email && (
                      <p className="text-sm text-gray-500">{selectedLog.usuario_email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ação</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.acao}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recurso</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.recurso}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Endereço IP</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.ip_address || 'Não disponível'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Agent</label>
                    <p className="mt-1 text-sm text-gray-900 break-all">
                      {selectedLog.user_agent || 'Não disponível'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID do Log</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Detalhes</label>
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.detalhes, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};