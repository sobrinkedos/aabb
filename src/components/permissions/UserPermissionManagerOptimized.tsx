/**
 * Versão Otimizada do Gerenciador de Permissões de Usuários
 * 
 * Melhorias implementadas:
 * - Cache de usuários e permissões
 * - Debounce na busca
 * - Memoização de componentes
 * - Lazy loading de dados
 * - Queries otimizadas
 * 
 * @version 2.0.0 - Otimizada para Performance
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Search, User, Save, Trash2, RefreshCw, Settings, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useSearchDebounce } from '../../hooks/useDebounce';
import { usePermissionsCache } from '../../hooks/usePermissionsCache';

// ============================================================================
// INTERFACES
// ============================================================================

interface UsuarioEmpresa {
  id: string;
  user_id: string;
  nome_completo: string;
  email: string;
  cargo: string;
  status: string;
  tem_acesso_sistema: boolean;
}

interface PermissaoUsuario {
  id?: string;
  usuario_empresa_id: string;
  modulo: string;
  permissoes: {
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
    administrar: boolean;
  };
}

interface ModuloSistema {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  icone: string;
}

interface UserPermissionManagerOptimizedProps {
  empresaId?: string;
  onPermissionsSaved?: (userId: string, permissions: PermissaoUsuario[]) => void;
  showOnlyActive?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MODULOS_SISTEMA: ModuloSistema[] = [
  { id: 'dashboard', nome: 'Dashboard', descricao: 'Visão geral do sistema', categoria: 'Principal', icone: '📊' },
  { id: 'gestao_caixa', nome: 'Gestão de Caixa', descricao: 'Operações de caixa e pagamentos', categoria: 'Financeiro', icone: '💰' },
  { id: 'atendimento_bar', nome: 'Atendimento Bar', descricao: 'Atendimento e pedidos do bar', categoria: 'Operacional', icone: '🍺' },
  { id: 'monitor_bar', nome: 'Monitor Bar', descricao: 'Monitoramento do bar', categoria: 'Operacional', icone: '📺' },
  { id: 'monitor_cozinha', nome: 'Monitor Cozinha', descricao: 'Monitoramento da cozinha', categoria: 'Operacional', icone: '👨‍🍳' },
  { id: 'funcionarios', nome: 'Funcionários', descricao: 'Gestão de funcionários', categoria: 'Administrativo', icone: '👥' },
  { id: 'relatorios', nome: 'Relatórios', descricao: 'Relatórios e análises', categoria: 'Administrativo', icone: '📈' },
  { id: 'configuracoes', nome: 'Configurações', descricao: 'Configurações do sistema', categoria: 'Administrativo', icone: '⚙️' }
];

const PRESETS_PERMISSOES = {
  'apenas_caixa': {
    nome: 'Apenas Caixa',
    descricao: 'Acesso somente ao módulo de gestão de caixa',
    modulos: ['gestao_caixa']
  },
  'atendimento_completo': {
    nome: 'Atendimento Completo',
    descricao: 'Acesso aos módulos de atendimento e caixa',
    modulos: ['atendimento_bar', 'gestao_caixa']
  },
  'monitor_operacional': {
    nome: 'Monitor Operacional',
    descricao: 'Acesso aos monitores de bar e cozinha',
    modulos: ['monitor_bar', 'monitor_cozinha']
  },
  'administrativo': {
    nome: 'Administrativo',
    descricao: 'Acesso aos módulos administrativos',
    modulos: ['funcionarios', 'relatorios', 'configuracoes']
  }
};

// ============================================================================
// COMPONENTES MEMOIZADOS
// ============================================================================

const UserCard = memo(({ 
  usuario, 
  isSelected, 
  onSelect 
}: { 
  usuario: UsuarioEmpresa; 
  isSelected: boolean; 
  onSelect: (usuario: UsuarioEmpresa) => void;
}) => (
  <button
    onClick={() => onSelect(usuario)}
    className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
      isSelected ? 'bg-blue-50 border-blue-200' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{usuario.nome_completo}</p>
        <p className="text-sm text-gray-600">{usuario.email}</p>
        <p className="text-xs text-gray-500">{usuario.cargo}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className={`px-2 py-1 text-xs rounded-full ${
          usuario.status === 'ativo'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {usuario.status}
        </span>
        {usuario.tem_acesso_sistema && (
          <span className="text-xs text-blue-600 mt-1">Sistema</span>
        )}
      </div>
    </div>
  </button>
));

const PresetCard = memo(({ 
  presetKey, 
  preset, 
  onApply 
}: { 
  presetKey: string; 
  preset: any; 
  onApply: (key: string) => void;
}) => (
  <button
    onClick={() => onApply(presetKey)}
    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <p className="font-medium text-sm text-gray-900">{preset.nome}</p>
    <p className="text-xs text-gray-600">{preset.descricao}</p>
  </button>
));

const ModuleCard = memo(({ 
  modulo, 
  permissao, 
  hasPermissao, 
  onToggle, 
  onUpdatePermission 
}: {
  modulo: ModuloSistema;
  permissao?: PermissaoUsuario;
  hasPermissao: boolean;
  onToggle: (moduloId: string) => void;
  onUpdatePermission: (moduloId: string, permissao: keyof PermissaoUsuario['permissoes'], valor: boolean) => void;
}) => (
  <div className={`border rounded-lg p-4 transition-colors ${
    hasPermissao ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
  }`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{modulo.icone}</span>
        <div>
          <h5 className="font-medium text-gray-900">{modulo.nome}</h5>
          <p className="text-sm text-gray-600">{modulo.descricao}</p>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {modulo.categoria}
          </span>
        </div>
      </div>

      <button
        onClick={() => onToggle(modulo.id)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          hasPermissao
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
      >
        {hasPermissao ? 'Remover' : 'Adicionar'}
      </button>
    </div>

    {hasPermissao && permissao && (
      <div className="grid grid-cols-5 gap-2 pt-3 border-t border-blue-200">
        {Object.entries(permissao.permissoes).map(([key, value]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onUpdatePermission(
                modulo.id,
                key as keyof PermissaoUsuario['permissoes'],
                e.target.checked
              )}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="capitalize text-gray-700">{key}</span>
          </label>
        ))}
      </div>
    )}
  </div>
));

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const UserPermissionManagerOptimized: React.FC<UserPermissionManagerOptimizedProps> = ({
  empresaId = '9e445c5a-a382-444d-94f8-9d126ed6414e', // AABB Garanhuns
  onPermissionsSaved,
  showOnlyActive = true,
  className = ''
}) => {
  // Hooks otimizados
  const { 
    getUsers, 
    getUserPermissions, 
    invalidateUserCache, 
    invalidateUsersCache,
    getCacheStats 
  } = usePermissionsCache();
  
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching
  } = useSearchDebounce('', 300, { minLength: 2 });

  // Estados
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioEmpresa | null>(null);
  const [permissoesUsuario, setPermissoesUsuario] = useState<PermissaoUsuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(!showOnlyActive);
  const [showStats, setShowStats] = useState(false);

  // ============================================================================
  // FUNÇÕES OTIMIZADAS
  // ============================================================================

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando usuários (otimizado)...');

      const filters = {
        status: showOnlyActive && !showInactive ? 'ativo' : undefined,
        limit: 100 // Limitar para melhor performance
      };

      const data = await getUsers(empresaId, filters);
      console.log(`✅ ${data.length} usuários carregados (cache otimizado)`);
      setUsuarios(data);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaId, showOnlyActive, showInactive, getUsers]);

  const carregarPermissoesUsuario = useCallback(async (usuario: UsuarioEmpresa) => {
    try {
      console.log(`🔍 Carregando permissões (otimizado): ${usuario.nome_completo}`);

      const result = await getUserPermissions(usuario.user_id, empresaId);
      
      if (result?.permissions) {
        console.log(`✅ ${result.permissions.length} permissões carregadas (cache)`);
        setPermissoesUsuario(result.permissions);
      } else {
        setPermissoesUsuario([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar permissões:', error);
      setPermissoesUsuario([]);
    }
  }, [getUserPermissions, empresaId]);

  // ============================================================================
  // MEMOIZAÇÕES PARA PERFORMANCE
  // ============================================================================

  // Filtrar usuários com debounce
  const usuariosFiltrados = useMemo(() => {
    let filtered = usuarios;

    // Aplicar filtro de busca apenas se não estiver buscando
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = usuarios.filter(usuario =>
        usuario.nome_completo.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower) ||
        usuario.cargo.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [usuarios, debouncedSearchTerm]);

  // Memoizar funções de manipulação
  const selecionarUsuario = useCallback(async (usuario: UsuarioEmpresa) => {
    setUsuarioSelecionado(usuario);
    await carregarPermissoesUsuario(usuario);
  }, [carregarPermissoesUsuario]);

  const aplicarPreset = useCallback((presetKey: string) => {
    const preset = PRESETS_PERMISSOES[presetKey as keyof typeof PRESETS_PERMISSOES];
    if (!preset || !usuarioSelecionado) return;

    const novasPermissoes: PermissaoUsuario[] = preset.modulos.map(modulo => ({
      usuario_empresa_id: usuarioSelecionado.id,
      modulo,
      permissoes: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false,
        administrar: false
      }
    }));

    setPermissoesUsuario(novasPermissoes);
    console.log(`🎯 Preset "${preset.nome}" aplicado: ${preset.modulos.length} módulos`);
  }, [usuarioSelecionado]);

  const toggleModuloPermissao = useCallback((moduloId: string) => {
    if (!usuarioSelecionado) return;

    setPermissoesUsuario(prev => {
      const existePermissao = prev.find(p => p.modulo === moduloId);

      if (existePermissao) {
        return prev.filter(p => p.modulo !== moduloId);
      } else {
        const novaPermissao: PermissaoUsuario = {
          usuario_empresa_id: usuarioSelecionado.id,
          modulo: moduloId,
          permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: false,
            administrar: false
          }
        };
        return [...prev, novaPermissao];
      }
    });
  }, [usuarioSelecionado]);

  const atualizarPermissaoModulo = useCallback((
    moduloId: string, 
    permissao: keyof PermissaoUsuario['permissoes'], 
    valor: boolean
  ) => {
    setPermissoesUsuario(prev =>
      prev.map(p =>
        p.modulo === moduloId
          ? { ...p, permissoes: { ...p.permissoes, [permissao]: valor } }
          : p
      )
    );
  }, []);

  const salvarPermissoes = useCallback(async () => {
    if (!usuarioSelecionado) return;

    setSaving(true);
    try {
      console.log(`💾 Salvando permissões (otimizado): ${usuarioSelecionado.nome_completo}`);

      // Simular salvamento (implementar lógica real aqui)
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`✅ Permissões salvas: ${permissoesUsuario.length} módulos`);

      // Invalidar cache do usuário
      invalidateUserCache(usuarioSelecionado.user_id);

      // Callback para notificar o componente pai
      if (onPermissionsSaved) {
        onPermissionsSaved(usuarioSelecionado.id, permissoesUsuario);
      }

    } catch (error) {
      console.error('❌ Erro ao salvar permissões:', error);
    } finally {
      setSaving(false);
    }
  }, [usuarioSelecionado, permissoesUsuario, onPermissionsSaved, invalidateUserCache]);

  const limparPermissoes = useCallback(() => {
    setPermissoesUsuario([]);
    console.log('🗑️ Permissões específicas removidas');
  }, []);

  const refreshData = useCallback(() => {
    // Invalidar cache e recarregar
    invalidateUsersCache(empresaId);
    if (usuarioSelecionado) {
      invalidateUserCache(usuarioSelecionado.user_id);
    }
    carregarUsuarios();
  }, [empresaId, usuarioSelecionado, invalidateUsersCache, invalidateUserCache, carregarUsuarios]);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // ============================================================================
  // FUNÇÕES AUXILIARES MEMOIZADAS
  // ============================================================================

  const getModuloPermissao = useCallback((moduloId: string): PermissaoUsuario | undefined => {
    return permissoesUsuario.find(p => p.modulo === moduloId);
  }, [permissoesUsuario]);

  const hasPermissaoModulo = useCallback((moduloId: string): boolean => {
    return permissoesUsuario.some(p => p.modulo === moduloId);
  }, [permissoesUsuario]);

  // Estatísticas do cache
  const cacheStats = useMemo(() => getCacheStats(), [getCacheStats]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`user-permission-manager-optimized ${className}`}>
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciador de Permissões 
            <span className="text-sm font-normal text-green-600 ml-2">⚡ Otimizado</span>
          </h2>
          <p className="text-gray-600">Configure permissões específicas para usuários individuais</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Estatísticas de Performance"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showInactive
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showInactive ? 'Todos' : 'Apenas Ativos'}
          </button>

          <button
            onClick={refreshData}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Estatísticas de Performance */}
      {showStats && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">📊 Estatísticas de Performance</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600">Cache Hit Rate:</span>
              <span className="font-medium ml-1">{cacheStats.hitRate}%</span>
            </div>
            <div>
              <span className="text-green-600">Total Requests:</span>
              <span className="font-medium ml-1">{cacheStats.totalRequests}</span>
            </div>
            <div>
              <span className="text-green-600">Cache Hits:</span>
              <span className="font-medium ml-1">{cacheStats.hits}</span>
            </div>
            <div>
              <span className="text-green-600">Cache Size:</span>
              <span className="font-medium ml-1">{cacheStats.cacheSize} items</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Carregando usuários...
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <User className="w-6 h-6 mx-auto mb-2" />
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </div>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <UserCard
                    key={usuario.id}
                    usuario={usuario}
                    isSelected={usuarioSelecionado?.id === usuario.id}
                    onSelect={selecionarUsuario}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Configuração de Permissões */}
        <div className="lg:col-span-2">
          {usuarioSelecionado ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header do usuário selecionado */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {usuarioSelecionado.nome_completo}
                    </h3>
                    <p className="text-gray-600">{usuarioSelecionado.email}</p>
                    <p className="text-sm text-gray-500">{usuarioSelecionado.cargo}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={limparPermissoes}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={salvarPermissoes}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Presets Rápidos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESETS_PERMISSOES).map(([key, preset]) => (
                    <PresetCard
                      key={key}
                      presetKey={key}
                      preset={preset}
                      onApply={aplicarPreset}
                    />
                  ))}
                </div>
              </div>

              {/* Módulos e Permissões */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Módulos do Sistema ({permissoesUsuario.length} configurados)
                </h4>

                <div className="space-y-4">
                  {MODULOS_SISTEMA.map((modulo) => (
                    <ModuleCard
                      key={modulo.id}
                      modulo={modulo}
                      permissao={getModuloPermissao(modulo.id)}
                      hasPermissao={hasPermissaoModulo(modulo.id)}
                      onToggle={toggleModuloPermissao}
                      onUpdatePermission={atualizarPermissaoModulo}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione um usuário
              </h3>
              <p className="text-gray-600">
                Escolha um usuário da lista para configurar suas permissões específicas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissionManagerOptimized;