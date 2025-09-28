/**
 * Gerenciador de Permissões de Usuários
 * 
 * Componente para gerenciar permissões específicas de usuários individuais.
 * Integra com o sistema dinâmico de permissões implementado.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, User, Save, Trash2, RefreshCw, Settings, Eye, EyeOff } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface UsuarioEmpresa {
  id: string;
  user_id: string;
  nome_completo: string;
  email: string;
  cargo: string;
  tipo_usuario: string;
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

interface UserPermissionManagerProps {
  /** ID da empresa */
  empresaId?: string;

  /** Callback quando permissões são salvas */
  onPermissionsSaved?: (userId: string, permissions: PermissaoUsuario[]) => void;

  /** Se deve mostrar apenas usuários ativos */
  showOnlyActive?: boolean;

  /** Classe CSS customizada */
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
c
onst PRESETS_PERMISSOES = {
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
// COMPONENTE PRINCIPAL
// ============================================================================

export const UserPermissionManager: React.FC<UserPermissionManagerProps> = ({
  empresaId,
  onPermissionsSaved,
  showOnlyActive = true,
  className = ''
}) => {
  // Estados
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioEmpresa | null>(null);
  const [permissoesUsuario, setPermissoesUsuario] = useState<PermissaoUsuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(!showOnlyActive);

  // ============================================================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================================================

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando usuários da empresa...');

      let query = supabase
        .from('usuarios_empresa')
        .select('*')
        .order('nome_completo');

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      if (showOnlyActive && !showInactive) {
        query = query.eq('status', 'ativo');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        return;
      }

      console.log(`✅ ${data?.length || 0} usuários carregados`);
      setUsuarios(data || []);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaId, showOnlyActive, showInactive]);

  const carregarPermissoesUsuario = useCallback(async (usuarioId: string) => {
    try {
      console.log(`🔍 Carregando permissões do usuário: ${usuarioId}`);

      const { data, error } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', usuarioId);

      if (error) {
        console.error('❌ Erro ao carregar permissões:', error);
        return;
      }

      console.log(`✅ ${data?.length || 0} permissões específicas carregadas`);
      setPermissoesUsuario(data || []);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar permissões:', error);
    }
  }, []);

  // ============================================================================
  // FUNÇÕES DE MANIPULAÇÃO
  // ============================================================================

  const selecionarUsuario = useCallback(async (usuario: UsuarioEmpresa) => {
    setUsuarioSelecionado(usuario);
    await carregarPermissoesUsuario(usuario.id);
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
        // Remove a permissão
        return prev.filter(p => p.modulo !== moduloId);
      } else {
        // Adiciona nova permissão
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

  const atualizarPermissaoModulo = useCallback((moduloId: string, permissao: keyof PermissaoUsuario['permissoes'], valor: boolean) => {
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
      console.log(`💾 Salvando permissões para: ${usuarioSelecionado.nome_completo}`);

      // Primeiro, remove todas as permissões existentes
      const { error: deleteError } = await supabase
        .from('permissoes_usuario')
        .delete()
        .eq('usuario_empresa_id', usuarioSelecionado.id);

      if (deleteError) {
        console.error('❌ Erro ao remover permissões antigas:', deleteError);
        return;
      }

      // Depois, insere as novas permissões
      if (permissoesUsuario.length > 0) {
        const { error: insertError } = await supabase
          .from('permissoes_usuario')
          .insert(permissoesUsuario.map(p => ({
            usuario_empresa_id: p.usuario_empresa_id,
            modulo: p.modulo,
            permissoes: p.permissoes
          })));

        if (insertError) {
          console.error('❌ Erro ao salvar novas permissões:', insertError);
          return;
        }
      }

      console.log(`✅ Permissões salvas: ${permissoesUsuario.length} módulos configurados`);

      // Callback para notificar o componente pai
      if (onPermissionsSaved) {
        onPermissionsSaved(usuarioSelecionado.id, permissoesUsuario);
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar permissões:', error);
    } finally {
      setSaving(false);
    }
  }, [usuarioSelecionado, permissoesUsuario, onPermissionsSaved]);

  const limparPermissoes = useCallback(() => {
    setPermissoesUsuario([]);
    console.log('🗑️ Permissões específicas removidas - usuário usará permissões padrão do role');
  }, []);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // ============================================================================
  // FUNÇÕES DE FILTRO
  // ============================================================================

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = usuario.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  const getModuloPermissao = (moduloId: string): PermissaoUsuario | undefined => {
    return permissoesUsuario.find(p => p.modulo === moduloId);
  };

  const hasPermissaoModulo = (moduloId: string): boolean => {
    return permissoesUsuario.some(p => p.modulo === moduloId);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`user-permission-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Permissões</h2>
          <p className="text-gray-600">Configure permissões específicas para usuários individuais</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showInactive
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showInactive ? 'Todos' : 'Apenas Ativos'}
          </button>

          <button
            onClick={carregarUsuarios}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
                  Nenhum usuário encontrado
                </div>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <button
                    key={usuario.id}
                    onClick={() => selecionarUsuario(usuario)}
                    className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${usuarioSelecionado?.id === usuario.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{usuario.nome_completo}</p>
                        <p className="text-sm text-gray-600">{usuario.email}</p>
                        <p className="text-xs text-gray-500">{usuario.cargo}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 text-xs rounded-full ${usuario.status === 'ativo'
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
                    <button
                      key={key}
                      onClick={() => aplicarPreset(key)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{preset.nome}</p>
                      <p className="text-xs text-gray-600">{preset.descricao}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Módulos e Permissões */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Módulos do Sistema ({permissoesUsuario.length} configurados)
                </h4>

                <div className="space-y-4">
                  {MODULOS_SISTEMA.map((modulo) => {
                    const permissao = getModuloPermissao(modulo.id);
                    const hasPermissao = hasPermissaoModulo(modulo.id);

                    return (
                      <div
                        key={modulo.id}
                        className={`border rounded-lg p-4 transition-colors ${hasPermissao ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                          }`}
                      >
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
                            onClick={() => toggleModuloPermissao(modulo.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${hasPermissao
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
                                  onChange={(e) => atualizarPermissaoModulo(
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
                    );
                  })}
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

export default UserPermissionManager;