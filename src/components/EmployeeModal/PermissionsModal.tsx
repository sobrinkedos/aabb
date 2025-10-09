import React, { useState, useEffect } from 'react';
import { X, Save, User, Settings, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NoCredentialsWarning } from './NoCredentialsWarning';

interface PermissaoUsuario {
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

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  onSave: (permissions: PermissaoUsuario[]) => Promise<void>;
  onCreateCredentials?: () => void;
}

const MODULOS_SISTEMA: ModuloSistema[] = [
  { id: 'dashboard', nome: 'Dashboard', descricao: 'Visão geral do sistema', categoria: 'Principal', icone: '📊' },
  { id: 'gestao_caixa', nome: 'Gestão de Caixa', descricao: 'Operações de caixa e pagamentos', categoria: 'Financeiro', icone: '💰' },
  { id: 'atendimento_bar', nome: 'Atendimento Bar', descricao: 'Atendimento e pedidos do bar', categoria: 'Operacional', icone: '🍺' },
  { id: 'monitor_bar', nome: 'Monitor Bar', descricao: 'Monitoramento do bar', categoria: 'Operacional', icone: '📺' },
  { id: 'monitor_cozinha', nome: 'Monitor Cozinha', descricao: 'Monitoramento da cozinha', categoria: 'Operacional', icone: '👨‍🍳' },
  { id: 'clientes', nome: 'Clientes', descricao: 'Gestão de clientes', categoria: 'Gestão', icone: '👥' },
  { id: 'funcionarios', nome: 'Funcionários', descricao: 'Gestão de funcionários', categoria: 'Gestão', icone: '👤' },
  { id: 'relatorios', nome: 'Relatórios', descricao: 'Relatórios e análises', categoria: 'Análise', icone: '📈' },
  { id: 'configuracoes', nome: 'Configurações', descricao: 'Configurações do sistema', categoria: 'Sistema', icone: '⚙️' }
];

const PRESETS = {
  operador_caixa: {
    nome: 'Operador de Caixa',
    descricao: 'Apenas gestão de caixa',
    modulos: ['gestao_caixa'],
    permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
  },
  atendente_bar: {
    nome: 'Atendente de Bar',
    descricao: 'Atendimento e monitoramento do bar',
    modulos: ['atendimento_bar', 'monitor_bar'],
    permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
  },
  cozinheiro: {
    nome: 'Cozinheiro',
    descricao: 'Monitoramento da cozinha',
    modulos: ['monitor_cozinha'],
    permissoes: { visualizar: true, criar: true, editar: true, excluir: false, administrar: false }
  },
  gerente: {
    nome: 'Gerente',
    descricao: 'Acesso completo exceto configurações',
    modulos: ['dashboard', 'gestao_caixa', 'atendimento_bar', 'monitor_bar', 'monitor_cozinha', 'clientes', 'funcionarios', 'relatorios'],
    permissoes: { visualizar: true, criar: true, editar: true, excluir: true, administrar: false }
  }
};

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  onSave,
  onCreateCredentials
}) => {
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoUsuario['permissoes']>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [usuarioEmpresaId, setUsuarioEmpresaId] = useState<string | null>(null);
  const [showNoCredentialsWarning, setShowNoCredentialsWarning] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(true);

  // Carregar permissões atuais
  useEffect(() => {
    if (isOpen && employeeId) {
      loadCurrentPermissions();
    }
  }, [isOpen, employeeId]);

  const loadCurrentPermissions = async () => {
    try {
      setLoadingPermissions(true);

      console.log('🔍 Carregando permissões para employeeId:', employeeId);

      // BUSCA CORRETA: Buscar employee e depois usuarios_empresa
      console.log('🔍 Buscando employee e suas credenciais...');
      
      // 1. Buscar employee para obter profile_id
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, email, profile_id, tem_acesso_sistema')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('❌ Erro ao buscar employee:', employeeError);
        setHasCredentials(false);
        setShowNoCredentialsWarning(true);
        return;
      }

      console.log('👤 Employee encontrado:', employee);

      // 2. Verificar se tem profile_id (credenciais)
      if (!employee.profile_id || !employee.tem_acesso_sistema) {
        console.log('❌ Employee sem credenciais:', {
          profile_id: employee.profile_id,
          tem_acesso_sistema: employee.tem_acesso_sistema
        });
        setHasCredentials(false);
        setShowNoCredentialsWarning(true);
        return;
      }

      // 3. Buscar usuarios_empresa pelo profile_id
      const { data: usuarioEmpresa, error: usuarioError } = await supabase
        .from('usuarios_empresa')
        .select('id, user_id, nome_completo, tem_acesso_sistema, status, email')
        .eq('user_id', employee.profile_id)
        .maybeSingle();

      // LOGS DETALHADOS PARA DEBUG
      console.log('🔍 DEBUG - Resultado da query:', { 
        employeeId, 
        data: usuarioEmpresa, 
        error: usuarioError,
        bypass_usado: employeeId === '95886a5e-893c-4889-85a0-8989d48d19fd'
      });
      console.log('📊 DEBUG - Dados recebidos:', usuarioEmpresa);

      if (usuarioError) {
        console.error('❌ Erro ao buscar usuario_empresa:', usuarioError);
        console.error('❌ Detalhes do erro:', {
          message: usuarioError.message,
          code: usuarioError.code,
          details: usuarioError.details,
          hint: usuarioError.hint
        });
        
        // Se for erro 406 ou RLS, mostrar mensagem específica
        if (usuarioError.code === '42501' || usuarioError.message?.includes('406')) {
          console.error('🔒 Erro de RLS detectado - usuário pode não ter permissão para ver este registro');
          setHasCredentials(false);
          setShowNoCredentialsWarning(true);
          return;
        }
        
        return;
      }

      // DEBUG: Verificação de existência
      console.log('🧪 DEBUG - Verificando existência:', !!usuarioEmpresa);
      if (!usuarioEmpresa) {
        console.warn('⚠️ DEBUG - Usuario empresa não encontrado para ID:', employeeId);
        console.warn('💡 DEBUG - Isso pode indicar que o usuário não tem permissão para ver este registro devido ao RLS');
        setHasCredentials(false);
        setShowNoCredentialsWarning(true);
        return;
      }

      console.log('👤 Usuario empresa encontrado:', usuarioEmpresa);

      // DEBUG: Verificação de status
      console.log('🧪 DEBUG - Verificando status:', usuarioEmpresa?.status);
      if (usuarioEmpresa.status !== 'ativo') {
        console.log('❌ DEBUG - Usuário não está ativo:', usuarioEmpresa.status);
        setHasCredentials(false);
        setShowNoCredentialsWarning(true);
        return;
      }

      // DEBUG: Verificação de credenciais
      console.log('🧪 DEBUG - Verificando credenciais:', {
        user_id: usuarioEmpresa?.user_id,
        tem_acesso_sistema: usuarioEmpresa?.tem_acesso_sistema,
        user_id_exists: !!usuarioEmpresa?.user_id,
        tem_acesso_true: usuarioEmpresa?.tem_acesso_sistema === true
      });
      
      if (!usuarioEmpresa.user_id || !usuarioEmpresa.tem_acesso_sistema) {
        console.log('❌ DEBUG - Usuário sem credenciais - DETALHES:', {
          user_id: usuarioEmpresa.user_id,
          user_id_type: typeof usuarioEmpresa.user_id,
          user_id_null: usuarioEmpresa.user_id === null,
          user_id_undefined: usuarioEmpresa.user_id === undefined,
          tem_acesso_sistema: usuarioEmpresa.tem_acesso_sistema,
          tem_acesso_type: typeof usuarioEmpresa.tem_acesso_sistema,
          tem_acesso_false: usuarioEmpresa.tem_acesso_sistema === false,
          condition1: !usuarioEmpresa.user_id,
          condition2: !usuarioEmpresa.tem_acesso_sistema,
          final_condition: !usuarioEmpresa.user_id || !usuarioEmpresa.tem_acesso_sistema
        });
        setHasCredentials(false);
        setShowNoCredentialsWarning(true);
        return;
      }
      
      console.log('✅ Usuário tem credenciais válidas');
      setHasCredentials(true);
      setUsuarioEmpresaId(usuarioEmpresa.id);

      // Buscar permissões atuais
      const { data: permissoesAtuais, error: permissoesError } = await supabase
        .from('permissoes_usuario')
        .select('modulo, permissoes')
        .eq('usuario_empresa_id', usuarioEmpresa.id);

      if (permissoesError) {
        console.warn('Erro ao buscar permissões:', permissoesError);
        return;
      }

      // Mapear permissões
      const permissoesMap: Record<string, PermissaoUsuario['permissoes']> = {};
      
      if (permissoesAtuais) {
        permissoesAtuais.forEach(perm => {
          permissoesMap[perm.modulo] = perm.permissoes;
        });
      }

      setPermissoes(permissoesMap);
      console.log('✅ Permissões carregadas:', permissoesMap);

    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionChange = (modulo: string, tipo: keyof PermissaoUsuario['permissoes'], valor: boolean) => {
    setPermissoes(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo] || { visualizar: false, criar: false, editar: false, excluir: false, administrar: false },
        [tipo]: valor
      }
    }));
  };

  const aplicarPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    const novasPermissoes: Record<string, PermissaoUsuario['permissoes']> = {};

    // Limpar todas as permissões
    MODULOS_SISTEMA.forEach(modulo => {
      novasPermissoes[modulo.id] = {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      };
    });

    // Aplicar preset
    preset.modulos.forEach(moduloId => {
      novasPermissoes[moduloId] = { ...preset.permissoes };
    });

    setPermissoes(novasPermissoes);
  };

  const limparTodasPermissoes = () => {
    const permissoesVazias: Record<string, PermissaoUsuario['permissoes']> = {};
    MODULOS_SISTEMA.forEach(modulo => {
      permissoesVazias[modulo.id] = {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      };
    });
    setPermissoes(permissoesVazias);
  };

  const handleSave = async () => {
    if (!usuarioEmpresaId) {
      alert('Erro: Usuario empresa não encontrado');
      return;
    }

    try {
      setLoading(true);

      // Preparar permissões para salvar
      const permissoesParaSalvar: PermissaoUsuario[] = [];

      Object.entries(permissoes).forEach(([modulo, perms]) => {
        // Só salvar se pelo menos uma permissão estiver marcada
        if (perms.visualizar || perms.criar || perms.editar || perms.excluir || perms.administrar) {
          permissoesParaSalvar.push({
            usuario_empresa_id: usuarioEmpresaId,
            modulo,
            permissoes: perms
          });
        }
      });

      console.log('💾 Salvando permissões:', permissoesParaSalvar);

      await onSave(permissoesParaSalvar);
      onClose();

    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      alert('Erro ao salvar permissões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPermissoes({});
    setUsuarioEmpresaId(null);
    onClose();
  };

  if (!isOpen) return null;

  const modulosComPermissao = Object.entries(permissoes).filter(([_, perms]) => 
    perms.visualizar || perms.criar || perms.editar || perms.excluir || perms.administrar
  ).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Gerenciar Permissões
                  </h3>
                  <p className="text-sm text-gray-500">
                    Funcionário: {employeeName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Carregando permissões...</span>
              </div>
            ) : (
              <>
                {/* Presets */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Presets Rápidos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => aplicarPreset(key as keyof typeof PRESETS)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {preset.nome}
                      </button>
                    ))}
                    <button
                      onClick={limparTodasPermissoes}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      Limpar Tudo
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Módulos configurados:</strong> {modulosComPermissao} de {MODULOS_SISTEMA.length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    O usuário verá apenas os módulos com pelo menos uma permissão marcada
                  </p>
                </div>

                {/* Módulos */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {MODULOS_SISTEMA.map(modulo => {
                    const moduloPermissoes = permissoes[modulo.id] || {
                      visualizar: false,
                      criar: false,
                      editar: false,
                      excluir: false,
                      administrar: false
                    };

                    const temAlgumaPermissao = Object.values(moduloPermissoes).some(p => p);

                    return (
                      <div
                        key={modulo.id}
                        className={`border rounded-lg p-4 ${temAlgumaPermissao ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{modulo.icone}</span>
                            <div>
                              <h5 className="font-medium text-gray-900">{modulo.nome}</h5>
                              <p className="text-xs text-gray-500">{modulo.descricao}</p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {modulo.categoria}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { key: 'visualizar', label: 'Ver', icon: Eye },
                            { key: 'criar', label: 'Criar', icon: null },
                            { key: 'editar', label: 'Editar', icon: null },
                            { key: 'excluir', label: 'Excluir', icon: null },
                            { key: 'administrar', label: 'Admin', icon: Settings }
                          ].map(({ key, label, icon: Icon }) => (
                            <label key={key} className="flex items-center space-x-1 text-xs">
                              <input
                                type="checkbox"
                                checked={moduloPermissoes[key as keyof typeof moduloPermissoes]}
                                onChange={(e) => handlePermissionChange(
                                  modulo.id,
                                  key as keyof PermissaoUsuario['permissoes'],
                                  e.target.checked
                                )}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              {Icon && <Icon className="h-3 w-3" />}
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={loading || loadingPermissions}
              className="w-full inline-flex justify-center items-center space-x-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Permissões'}</span>
            </button>
            <button
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de aviso quando não há credenciais */}
      <NoCredentialsWarning
        isOpen={showNoCredentialsWarning}
        onClose={() => {
          setShowNoCredentialsWarning(false);
          onClose();
        }}
        employeeName={employeeName}
        onCreateCredentials={() => {
          setShowNoCredentialsWarning(false);
          onClose();
          if (onCreateCredentials) {
            onCreateCredentials();
          }
        }}
      />
    </div>
  );
};