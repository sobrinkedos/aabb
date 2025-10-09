import React, { useState, useEffect } from 'react';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContextSimple';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';
import { ModuloSistema, UsuarioEmpresa, PermissaoModulo } from '../../types/multitenant';
import { supabase } from '../../lib/supabase';
import { criarFuncionarioComCredenciais, verificarEmailExistente } from '../../services/funcionarioService';

interface NovoFuncionario {
  nome_completo: string;
  email: string;
  telefone?: string;
  cargo?: string;
  tem_acesso_sistema: boolean;
  permissoes: Record<ModuloSistema, PermissaoModulo>;
}

interface FormErrors {
  [key: string]: string;
}

export const GestaoFuncionarios: React.FC = () => {
  const { user, empresa, verificarPermissao } = useMultitenantAuth();
  const [funcionarios, setFuncionarios] = useState<UsuarioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<UsuarioEmpresa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo' | 'bloqueado'>('todos');
  
  const [novoFuncionario, setNovoFuncionario] = useState<NovoFuncionario>({
    nome_completo: '',
    email: '',
    telefone: '',
    cargo: '',
    tem_acesso_sistema: false,
    permissoes: {} as Record<ModuloSistema, PermissaoModulo>
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar funcionários
  const carregarFuncionarios = async () => {
    try {
      setIsLoading(true);
      
      if (!empresa?.id) {
        console.error('❌ ID da empresa não encontrado');
        return;
      }

      console.log('🔍 Carregando funcionários para empresa:', empresa.id);

      const { data, error } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      console.log('✅ Funcionários carregados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Primeiro funcionário:', data[0]);
      }

      setFuncionarios(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar funcionários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (empresa?.id) {
      carregarFuncionarios();
    }
  }, [empresa?.id]);

  // Inicializar permissões padrão
  const inicializarPermissoes = (): Record<ModuloSistema, PermissaoModulo> => {
    const permissoesDefault: Record<ModuloSistema, PermissaoModulo> = {} as Record<ModuloSistema, PermissaoModulo>;
    
    Object.values(ModuloSistema).forEach(modulo => {
      permissoesDefault[modulo] = {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      };
    });
    
    return permissoesDefault;
  };

  // Validar formulário
  const validarFormulario = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    if (!novoFuncionario.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }

    if (!novoFuncionario.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoFuncionario.email)) {
      newErrors.email = 'Email inválido';
    } else if (empresa?.id) {
      // Verificar se email já existe no banco
      const emailExiste = await verificarEmailExistente(
        novoFuncionario.email, 
        empresa.id, 
        editingFuncionario?.id
      );
      
      if (emailExiste) {
        newErrors.email = 'Este email já está cadastrado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // Estado para mostrar senha provisória
  const [senhaProvisionaria, setSenhaProvisionaria] = useState<string | null>(null);
  const [showSenhaModal, setShowSenhaModal] = useState(false);

  // Salvar funcionário
  const salvarFuncionario = async () => {
    console.log('🔍 DEBUG: Iniciando salvamento do funcionário');
    console.log('🔍 DEBUG: Estado completo:', novoFuncionario);
    
    setIsSubmitting(true);
    setErrors({}); // Limpar erros anteriores
    
    if (!(await validarFormulario())) {
      console.log('❌ DEBUG: Validação falhou');
      setIsSubmitting(false);
      return;
    }

    console.log('✅ DEBUG: Validação passou');
    
    try {
      if (!empresa?.id) {
        setErrors({ submit: 'ID da empresa não encontrado' });
        return;
      }

      if (editingFuncionario) {
        // Lógica de edição (mantém a lógica atual por enquanto)
        console.log('🔍 DEBUG: Editando funcionário existente - usando lógica antiga');
        
        const funcionarioData = {
          nome_completo: novoFuncionario.nome_completo,
          email: novoFuncionario.email,
          telefone: novoFuncionario.telefone || null,
          cargo: novoFuncionario.cargo || null,
          tem_acesso_sistema: novoFuncionario.tem_acesso_sistema
        };

        const { error } = await supabase
          .from('usuarios_empresa')
          .update(funcionarioData)
          .eq('id', editingFuncionario.id);

        if (error) {
          setErrors({ submit: `Erro ao atualizar funcionário: ${error.message}` });
          return;
        }

        // Atualizar permissões se tem acesso ao sistema
        if (novoFuncionario.tem_acesso_sistema) {
          // Remover permissões existentes
          await supabase
            .from('permissoes_usuario')
            .delete()
            .eq('usuario_empresa_id', editingFuncionario.id);

          // Inserir novas permissões
          const permissoesArray: any[] = [];
          Object.entries(novoFuncionario.permissoes || {}).forEach(([modulo, permissoes]: [string, any]) => {
            const temPermissaoAtiva = Object.values(permissoes).some(valor => valor === true);
            if (temPermissaoAtiva) {
              permissoesArray.push({
                usuario_empresa_id: editingFuncionario.id,
                modulo: modulo,
                permissoes: {
                  visualizar: Boolean(permissoes.visualizar),
                  criar: Boolean(permissoes.criar),
                  editar: Boolean(permissoes.editar),
                  excluir: Boolean(permissoes.excluir),
                  administrar: Boolean(permissoes.administrar)
                }
              });
            }
          });

          if (permissoesArray.length > 0) {
            await supabase.from('permissoes_usuario').insert(permissoesArray);
          }
        }

        console.log('✅ Funcionário atualizado com sucesso');
      } else {
        // Criar novo funcionário usando o serviço
        console.log('🔍 DEBUG: Criando novo funcionário com serviço');
        
        const result = await criarFuncionarioComCredenciais({
          nome_completo: novoFuncionario.nome_completo,
          email: novoFuncionario.email,
          telefone: novoFuncionario.telefone,
          cargo: novoFuncionario.cargo,
          empresa_id: empresa.id,
          tem_acesso_sistema: novoFuncionario.tem_acesso_sistema,
          permissoes: novoFuncionario.permissoes
        });

        if (!result.success) {
          setErrors({ submit: result.error || 'Erro ao criar funcionário' });
          return;
        }

        console.log('✅ Funcionário criado com sucesso via serviço');
        console.log('📊 ID do funcionário criado:', result.funcionario_id);

        // Se foi criado com acesso ao sistema, mostrar a senha
        if (result.senha_provisoria) {
          setSenhaProvisionaria(result.senha_provisoria);
          setShowSenhaModal(true);
        }
      }

      // Recarregar lista com delay para garantir que o banco atualizou
      console.log('🔄 Recarregando lista de funcionários...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar 500ms
      await carregarFuncionarios();
      console.log('✅ Lista recarregada');
      
      // Fechar modal e limpar formulário
      setShowModal(false);
      setEditingFuncionario(null);
      setNovoFuncionario({
        nome_completo: '',
        email: '',
        telefone: '',
        cargo: '',
        tem_acesso_sistema: false,
        permissoes: inicializarPermissoes()
      });
      setErrors({});
      
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      setErrors({ submit: 'Erro interno do servidor' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterar status do funcionário
  const alterarStatus = async (funcionarioId: string, novoStatus: 'ativo' | 'inativo' | 'bloqueado') => {
    try {
      const { error } = await supabase
        .from('usuarios_empresa')
        .update({ status: novoStatus })
        .eq('id', funcionarioId);

      if (error) {
        console.error('Erro ao alterar status:', error);
        return;
      }

      await carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Carregar permissões existentes do funcionário
  const carregarPermissoesExistentes = async (funcionarioId: string): Promise<Record<ModuloSistema, PermissaoModulo>> => {
    try {
      const { data: permissoes, error } = await supabase
        .from('permissoes_usuario')
        .select('modulo, permissoes')
        .eq('usuario_empresa_id', funcionarioId);

      if (error) {
        console.error('Erro ao carregar permissões:', error);
        return inicializarPermissoes();
      }

      // Sempre inicializar com permissões padrão (todas false)
      const permissoesMap = inicializarPermissoes();
      
      // Se há permissões salvas, aplicar apenas essas
      if (permissoes && permissoes.length > 0) {
        permissoes.forEach(perm => {
          if (perm.modulo && perm.permissoes) {
            permissoesMap[perm.modulo as ModuloSistema] = {
              visualizar: Boolean(perm.permissoes.visualizar),
              criar: Boolean(perm.permissoes.criar),
              editar: Boolean(perm.permissoes.editar),
              excluir: Boolean(perm.permissoes.excluir),
              administrar: Boolean(perm.permissoes.administrar)
            };
          }
        });
      }

      return permissoesMap;
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      return inicializarPermissoes();
    }
  };

  // Abrir modal para edição
  const editarFuncionario = async (funcionario: UsuarioEmpresa) => {
    setEditingFuncionario(funcionario);
    
    // Carregar permissões existentes se o funcionário tem acesso ao sistema
    let permissoesExistentes = inicializarPermissoes();
    if (funcionario.user_id) {
      permissoesExistentes = await carregarPermissoesExistentes(funcionario.id);
    }
    
    setNovoFuncionario({
      nome_completo: funcionario.nome_completo,
      email: funcionario.email,
      telefone: funcionario.telefone || '',
      cargo: funcionario.cargo || '',
      tem_acesso_sistema: !!funcionario.user_id,
      permissoes: permissoesExistentes
    });
    setShowModal(true);
  };

  // Filtrar funcionários
  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (funcionario.cargo && funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'todos' || funcionario.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Atualizar permissão específica
  const atualizarPermissao = (modulo: ModuloSistema, acao: keyof PermissaoModulo, valor: boolean) => {
    setNovoFuncionario(prev => {
      // Garantir que as permissões existam
      const permissoesAtuais = prev.permissoes || inicializarPermissoes();
      
      // Garantir que o módulo existe
      const moduloAtual = permissoesAtuais[modulo] || {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      };
      
      const novasPermissoes = {
        ...permissoesAtuais,
        [modulo]: {
          ...moduloAtual,
          [acao]: valor
        }
      };
      
      return {
        ...prev,
        permissoes: novasPermissoes
      };
    });
  };

  return (
    <ProtectedRoute modulo={ModuloSistema.FUNCIONARIOS} acao="visualizar" requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Funcionários</h1>
            <p className="mt-2 text-gray-600">
              Gerencie os funcionários da {empresa?.nome}
            </p>
          </div>

          {/* Filtros e Ações */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Busca */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filtro de Status */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>
              
              {/* Botão Adicionar */}
              <button
                onClick={() => {
                  setEditingFuncionario(null);
                  setNovoFuncionario({
                    nome_completo: '',
                    email: '',
                    telefone: '',
                    cargo: '',
                    tem_acesso_sistema: false,
                    permissoes: inicializarPermissoes()
                  });
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Funcionário
              </button>
            </div>
          </div>

          {/* Lista de Funcionários */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando funcionários...</p>
              </div>
            ) : funcionariosFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum funcionário encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'todos' 
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Comece adicionando o primeiro funcionário.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Funcionário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cargo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acesso Sistema
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {funcionariosFiltrados.map((funcionario) => (
                      <tr key={funcionario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {funcionario.nome_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {funcionario.nome_completo}
                              </div>
                              <div className="text-sm text-gray-500">
                                {funcionario.email}
                              </div>
                              {funcionario.telefone && (
                                <div className="text-sm text-gray-500">
                                  {funcionario.telefone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {funcionario.cargo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {funcionario.user_id ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            funcionario.status === 'ativo' 
                              ? 'bg-green-100 text-green-800'
                              : funcionario.status === 'inativo'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {funcionario.status === 'ativo' ? 'Ativo' : 
                             funcionario.status === 'inativo' ? 'Inativo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {funcionario.ultimo_login 
                            ? new Date(funcionario.ultimo_login).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => editarFuncionario(funcionario)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            
                            {funcionario.status === 'ativo' ? (
                              <button
                                onClick={() => alterarStatus(funcionario.id, 'inativo')}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                Desativar
                              </button>
                            ) : (
                              <button
                                onClick={() => alterarStatus(funcionario.id, 'ativo')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Ativar
                              </button>
                            )}
                            
                            {funcionario.status !== 'bloqueado' && (
                              <button
                                onClick={() => alterarStatus(funcionario.id, 'bloqueado')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Bloquear
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header fixo */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingFuncionario ? 'Editar Funcionário' : 'Adicionar Funcionário'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingFuncionario(null);
                      setErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Conteúdo com scroll */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingFuncionario ? 'Editar Funcionário' : 'Adicionar Funcionário'}
              </h3>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dados Básicos */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">Dados Básicos</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                    <input
                      type="text"
                      value={novoFuncionario.nome_completo}
                      onChange={(e) => setNovoFuncionario(prev => ({ ...prev, nome_completo: e.target.value }))}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.nome_completo ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.nome_completo && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome_completo}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      value={novoFuncionario.email}
                      onChange={(e) => setNovoFuncionario(prev => ({ ...prev, email: e.target.value }))}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="text"
                      value={novoFuncionario.telefone}
                      onChange={(e) => setNovoFuncionario(prev => ({ ...prev, telefone: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <input
                      type="text"
                      value={novoFuncionario.cargo}
                      onChange={(e) => setNovoFuncionario(prev => ({ ...prev, cargo: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <input
                        id="tem_acesso_sistema"
                        type="checkbox"
                        checked={novoFuncionario.tem_acesso_sistema}
                        onChange={(e) => {
                          setNovoFuncionario(prev => ({ 
                            ...prev, 
                            tem_acesso_sistema: e.target.checked,
                            permissoes: e.target.checked ? inicializarPermissoes() : {} as Record<ModuloSistema, PermissaoModulo>
                          }));
                        }}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="tem_acesso_sistema" className="ml-3 block text-sm font-medium text-blue-900">
                        Criar acesso ao sistema para este funcionário
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-blue-700">
                      Marque esta opção se o funcionário precisar fazer login no sistema. 
                      Será gerada uma senha provisória que deverá ser alterada no primeiro acesso.
                    </p>
                  </div>
                </div>
                
                  {/* Permissões */}
                  {novoFuncionario.tem_acesso_sistema && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2 flex-1">Permissões de Acesso</h4>
                        <div className="flex items-center space-x-1 text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium">Acesso Habilitado</span>
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <strong>Instruções:</strong> Selecione as permissões que o funcionário terá em cada módulo do sistema. 
                          Use o botão "Marcar/Desmarcar Todas" para facilitar a configuração.
                        </p>
                      </div>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
                        {Object.values(ModuloSistema).map(modulo => {
                          const nomeModulo = {
                            [ModuloSistema.DASHBOARD]: 'Dashboard',
                            [ModuloSistema.MONITOR_BAR]: 'Monitor Bar',
                            [ModuloSistema.ATENDIMENTO_BAR]: 'Atendimento Bar',
                            [ModuloSistema.MONITOR_COZINHA]: 'Monitor Cozinha',
                            [ModuloSistema.GESTAO_CAIXA]: 'Gestão de Caixa',
                            [ModuloSistema.CLIENTES]: 'Clientes',
                            [ModuloSistema.FUNCIONARIOS]: 'Funcionários',
                            [ModuloSistema.SOCIOS]: 'Sócios',
                            [ModuloSistema.CONFIGURACOES]: 'Configurações',
                            [ModuloSistema.RELATORIOS]: 'Relatórios'
                          }[modulo] || modulo.replace('_', ' ');

                          return (
                            <div key={modulo} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-gray-800">
                                  {nomeModulo}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const todasMarcadas = ['visualizar', 'criar', 'editar', 'excluir'].every(
                                      acao => novoFuncionario.permissoes[modulo]?.[acao as keyof PermissaoModulo]
                                    );
                                    ['visualizar', 'criar', 'editar', 'excluir'].forEach(acao => {
                                      atualizarPermissao(modulo, acao as keyof PermissaoModulo, !todasMarcadas);
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Marcar/Desmarcar Todas
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                {(['visualizar', 'criar', 'editar', 'excluir'] as const).map(acao => {
                                  const nomeAcao = {
                                    visualizar: 'Visualizar',
                                    criar: 'Criar',
                                    editar: 'Editar',
                                    excluir: 'Excluir'
                                  }[acao];

                                  return (
                                    <label key={acao} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={novoFuncionario.permissoes[modulo]?.[acao] || false}
                                        onChange={(e) => atualizarPermissao(modulo, acao, e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span className="text-sm text-gray-700">{nomeAcao}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {errors.submit && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {errors.submit}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer fixo */}
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingFuncionario(null);
                      setErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarFuncionario}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingFuncionario ? 'Atualizar' : 'Salvar'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>

      {/* Modal de Senha Provisória */}
      {showSenhaModal && senhaProvisionaria && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  🔑 Credenciais de Acesso Criadas
                </h3>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  O funcionário foi cadastrado com sucesso! Anote as credenciais abaixo para fornecer ao funcionário:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de acesso:
                    </label>
                    <div className="flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm font-mono">{novoFuncionario.email}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(novoFuncionario.email)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha provisória:
                    </label>
                    <div className="flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm font-mono font-bold text-red-600">{senhaProvisionaria}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(senhaProvisionaria)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Importante:</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Anote essas credenciais em local seguro. O funcionário deve fazer login com esses dados na primeira vez.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowSenhaModal(false);
                  setSenhaProvisionaria(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
  );
};    