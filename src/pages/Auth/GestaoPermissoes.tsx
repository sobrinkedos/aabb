import React, { useState, useEffect } from 'react';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContext';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';
import { ModuloSistema, UsuarioEmpresa, PermissaoModulo } from '../../types/multitenant';
import { useFuncionarios } from '../../hooks/useFuncionarios';

interface PermissaoCompleta {
  usuario_empresa_id: string;
  funcionario: UsuarioEmpresa;
  permissoes: Record<ModuloSistema, PermissaoModulo>;
}

interface ModuloInfo {
  nome: string;
  descricao: string;
  icone: string;
  categoria: 'operacional' | 'administrativo' | 'relatorios';
}

const MODULOS_INFO: Record<ModuloSistema, ModuloInfo> = {
  [ModuloSistema.DASHBOARD]: {
    nome: 'Dashboard',
    descricao: 'Visão geral do sistema e métricas principais',
    icone: '📊',
    categoria: 'operacional'
  },
  [ModuloSistema.MONITOR_BAR]: {
    nome: 'Monitor do Bar',
    descricao: 'Monitoramento de pedidos e atividades do bar',
    icone: '🍺',
    categoria: 'operacional'
  },
  [ModuloSistema.ATENDIMENTO_BAR]: {
    nome: 'Atendimento do Bar',
    descricao: 'Interface para atendimento e vendas no bar',
    icone: '🍻',
    categoria: 'operacional'
  },
  [ModuloSistema.MONITOR_COZINHA]: {
    nome: 'Monitor da Cozinha',
    descricao: 'Acompanhamento de pedidos da cozinha',
    icone: '👨‍🍳',
    categoria: 'operacional'
  },
  [ModuloSistema.GESTAO_CAIXA]: {
    nome: 'Gestão de Caixa',
    descricao: 'Controle financeiro e fechamento de caixa',
    icone: '💰',
    categoria: 'administrativo'
  },
  [ModuloSistema.CLIENTES]: {
    nome: 'Clientes',
    descricao: 'Cadastro e gestão de clientes',
    icone: '👥',
    categoria: 'administrativo'
  },
  [ModuloSistema.FUNCIONARIOS]: {
    nome: 'Funcionários',
    descricao: 'Gestão de funcionários e usuários',
    icone: '👨‍💼',
    categoria: 'administrativo'
  },
  [ModuloSistema.SOCIOS]: {
    nome: 'Sócios',
    descricao: 'Gestão de sócios do clube',
    icone: '🤝',
    categoria: 'administrativo'
  },
  [ModuloSistema.CONFIGURACOES]: {
    nome: 'Configurações',
    descricao: 'Configurações gerais do sistema',
    icone: '⚙️',
    categoria: 'administrativo'
  },
  [ModuloSistema.RELATORIOS]: {
    nome: 'Relatórios',
    descricao: 'Relatórios e análises do sistema',
    icone: '📈',
    categoria: 'relatorios'
  }
};

const ACOES_INFO = {
  visualizar: { nome: 'Visualizar', descricao: 'Ver dados e informações', icone: '👁️' },
  criar: { nome: 'Criar', descricao: 'Adicionar novos registros', icone: '➕' },
  editar: { nome: 'Editar', descricao: 'Modificar registros existentes', icone: '✏️' },
  excluir: { nome: 'Excluir', descricao: 'Remover registros', icone: '🗑️' },
  administrar: { nome: 'Administrar', descricao: 'Controle total do módulo', icone: '👑' }
};

export const GestaoPermissoes: React.FC = () => {
  const { empresa } = useMultitenantAuth();
  const { 
    funcionarios, 
    carregarFuncionarios, 
    carregarPermissoesFuncionario, 
    atualizarPermissoesFuncionario,
    isLoading 
  } = useFuncionarios();
  
  const [permissoes, setPermissoes] = useState<PermissaoCompleta[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>('');
  const [isLoadingPermissoes, setIsLoadingPermissoes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<'todas' | 'operacional' | 'administrativo' | 'relatorios'>('todas');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedModulos, setSelectedModulos] = useState<Set<ModuloSistema>>(new Set());

  // Carregar funcionários e suas permissões
  useEffect(() => {
    if (empresa?.id) {
      carregarFuncionarios();
    }
  }, [empresa?.id]);

  // Carregar permissões quando funcionários mudarem
  useEffect(() => {
    carregarTodasPermissoes();
  }, [funcionarios]);

  const carregarTodasPermissoes = async () => {
    if (funcionarios.length === 0) return;
    
    setIsLoadingPermissoes(true);
    try {
      const permissoesCompletas: PermissaoCompleta[] = [];
      
      for (const funcionario of funcionarios) {
        if (funcionario.user_id) { // Só carregar para funcionários com acesso ao sistema
          const permissoesFuncionario = await carregarPermissoesFuncionario(funcionario.id);
          if (permissoesFuncionario) {
            permissoesCompletas.push({
              usuario_empresa_id: funcionario.id,
              funcionario,
              permissoes: permissoesFuncionario
            });
          }
        }
      }
      
      setPermissoes(permissoesCompletas);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    } finally {
      setIsLoadingPermissoes(false);
    }
  };

  // Atualizar permissão específica
  const atualizarPermissao = async (
    usuarioEmpresaId: string, 
    modulo: ModuloSistema, 
    acao: keyof PermissaoModulo, 
    valor: boolean
  ) => {
    setPermissoes(prev => prev.map(p => {
      if (p.usuario_empresa_id === usuarioEmpresaId) {
        const novasPermissoes = {
          ...p.permissoes,
          [modulo]: {
            ...p.permissoes[modulo],
            [acao]: valor
          }
        };
        
        // Se marcou "administrar", marcar todas as outras
        if (acao === 'administrar' && valor) {
          novasPermissoes[modulo] = {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: true,
            administrar: true
          };
        }
        
        // Se desmarcou "administrar", desmarcar todas
        if (acao === 'administrar' && !valor) {
          novasPermissoes[modulo] = {
            visualizar: false,
            criar: false,
            editar: false,
            excluir: false,
            administrar: false
          };
        }
        
        // Se marcou qualquer ação, garantir que "visualizar" esteja marcado
        if (valor && acao !== 'visualizar') {
          novasPermissoes[modulo].visualizar = true;
        }
        
        return {
          ...p,
          permissoes: novasPermissoes
        };
      }
      return p;
    }));
  };

  // Salvar permissões
  const salvarPermissoes = async (usuarioEmpresaId: string) => {
    const permissaoFuncionario = permissoes.find(p => p.usuario_empresa_id === usuarioEmpresaId);
    if (!permissaoFuncionario) return;
    
    setIsSaving(true);
    try {
      const result = await atualizarPermissoesFuncionario(usuarioEmpresaId, permissaoFuncionario.permissoes);
      if (result.success) {
        // Mostrar feedback de sucesso
        console.log('Permissões salvas com sucesso');
      } else {
        console.error('Erro ao salvar permissões:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Aplicar permissões em lote
  const aplicarPermissoesLote = async (acao: keyof PermissaoModulo, valor: boolean) => {
    if (selectedModulos.size === 0 || !funcionarioSelecionado) return;
    
    setIsSaving(true);
    try {
      for (const modulo of selectedModulos) {
        await atualizarPermissao(funcionarioSelecionado, modulo, acao, valor);
      }
      await salvarPermissoes(funcionarioSelecionado);
      setSelectedModulos(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Erro ao aplicar permissões em lote:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar módulos
  const modulosFiltrados = Object.entries(MODULOS_INFO).filter(([modulo, info]) => {
    const matchesSearch = info.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         info.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoriaFilter === 'todas' || info.categoria === categoriaFilter;
    return matchesSearch && matchesCategory;
  });

  // Funcionários com acesso ao sistema
  const funcionariosComAcesso = funcionarios.filter(f => f.user_id);

  const funcionarioSelecionadoData = funcionariosComAcesso.find(f => f.id === funcionarioSelecionado);
  const permissoesFuncionarioSelecionado = permissoes.find(p => p.usuario_empresa_id === funcionarioSelecionado);

  return (
    <ProtectedRoute modulo={ModuloSistema.FUNCIONARIOS} acao="administrar" requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Permissões</h1>
            <p className="mt-2 text-gray-600">
              Configure as permissões de acesso aos módulos do sistema para cada funcionário
            </p>
          </div>

          {/* Seleção de Funcionário */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Selecionar Funcionário</h2>
            
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : funcionariosComAcesso.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum funcionário com acesso</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há funcionários com acesso ao sistema. Cadastre funcionários com acesso para configurar permissões.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funcionariosComAcesso.map(funcionario => (
                  <div
                    key={funcionario.id}
                    onClick={() => setFuncionarioSelecionado(funcionario.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      funcionarioSelecionado === funcionario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {funcionario.nome_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {funcionario.nome_completo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {funcionario.cargo || 'Funcionário'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {funcionario.email}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuração de Permissões */}
          {funcionarioSelecionado && permissoesFuncionarioSelecionado && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      Permissões - {funcionarioSelecionadoData?.nome_completo}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Configure as permissões de acesso aos módulos do sistema
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ações em Lote
                    </button>
                    
                    <button
                      onClick={() => salvarPermissoes(funcionarioSelecionado)}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        'Salvar Permissões'
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Filtros */}
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Buscar módulos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={categoriaFilter}
                      onChange={(e) => setCategoriaFilter(e.target.value as any)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="todas">Todas as Categorias</option>
                      <option value="operacional">Operacional</option>
                      <option value="administrativo">Administrativo</option>
                      <option value="relatorios">Relatórios</option>
                    </select>
                  </div>
                </div>
                
                {/* Ações em Lote */}
                {showBulkActions && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Ações em Lote</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(ACOES_INFO).map(([acao, info]) => (
                        <button
                          key={acao}
                          onClick={() => aplicarPermissoesLote(acao as keyof PermissaoModulo, true)}
                          disabled={selectedModulos.size === 0 || isSaving}
                          className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                        >
                          {info.icone} Permitir {info.nome}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ACOES_INFO).map(([acao, info]) => (
                        <button
                          key={acao}
                          onClick={() => aplicarPermissoesLote(acao as keyof PermissaoModulo, false)}
                          disabled={selectedModulos.size === 0 || isSaving}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          {info.icone} Negar {info.nome}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selecione os módulos abaixo e use as ações acima para aplicar permissões em lote.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Lista de Módulos */}
              <div className="divide-y divide-gray-200">
                {isLoadingPermissoes ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Carregando permissões...</p>
                  </div>
                ) : (
                  modulosFiltrados.map(([modulo, info]) => {
                    const moduloEnum = modulo as ModuloSistema;
                    const permissoesModulo = permissoesFuncionarioSelecionado.permissoes[moduloEnum];
                    
                    return (
                      <div key={modulo} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            {showBulkActions && (
                              <input
                                type="checkbox"
                                checked={selectedModulos.has(moduloEnum)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedModulos);
                                  if (e.target.checked) {
                                    newSelected.add(moduloEnum);
                                  } else {
                                    newSelected.delete(moduloEnum);
                                  }
                                  setSelectedModulos(newSelected);
                                }}
                                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            )}
                            
                            <div className="flex-shrink-0 mr-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                {info.icone}
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{info.nome}</h3>
                              <p className="text-sm text-gray-500 mt-1">{info.descricao}</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                                info.categoria === 'operacional' ? 'bg-blue-100 text-blue-800' :
                                info.categoria === 'administrativo' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {info.categoria === 'operacional' ? 'Operacional' :
                                 info.categoria === 'administrativo' ? 'Administrativo' : 'Relatórios'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(ACOES_INFO).map(([acao, acaoInfo]) => {
                              const acaoKey = acao as keyof PermissaoModulo;
                              const isChecked = permissoesModulo?.[acaoKey] || false;
                              
                              return (
                                <label
                                  key={acao}
                                  className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => atualizarPermissao(
                                      funcionarioSelecionado,
                                      moduloEnum,
                                      acaoKey,
                                      e.target.checked
                                    )}
                                    className="sr-only"
                                  />
                                  <span className="text-sm mr-2">{acaoInfo.icone}</span>
                                  <span className="text-xs font-medium">{acaoInfo.nome}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {/* Estado vazio */}
          {!funcionarioSelecionado && funcionariosComAcesso.length > 0 && (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Selecione um funcionário</h3>
              <p className="mt-1 text-sm text-gray-500">
                Escolha um funcionário acima para configurar suas permissões de acesso aos módulos do sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};