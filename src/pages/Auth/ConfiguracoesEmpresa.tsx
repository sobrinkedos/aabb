import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContextSimple';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';
import { ModuloSistema, CategoriaConfiguracao, ConfiguracaoEmpresa } from '../../types/multitenant';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import { ConfiguracaoCargos } from '../../components/Configuracoes/ConfiguracaoCargos';

interface ConfiguracaoSeguranca {
  tempo_sessao: number; // em minutos
  tentativas_login: number;
  bloqueio_temporario: number; // em minutos
  exigir_2fa: boolean;
  senha_minima_caracteres: number;
  senha_exigir_maiuscula: boolean;
  senha_exigir_numero: boolean;
  senha_exigir_simbolo: boolean;
  logout_automatico_inatividade: boolean;
}

interface ConfiguracaoSistema {
  tema: 'claro' | 'escuro' | 'auto';
  idioma: string;
  timezone: string;
  formato_data: string;
  formato_moeda: string;
  moeda_padrao: string;
  primeira_pagina: string;
  itens_por_pagina: number;
}

interface ConfiguracaoNotificacoes {
  email_novos_usuarios: boolean;
  email_tentativas_login: boolean;
  email_alteracoes_config: boolean;
  email_backup_diario: boolean;
  email_relatorios_semanais: boolean;
  notificacao_browser: boolean;
  som_notificacoes: boolean;
}

interface ConfiguracaoIntegracao {
  webhook_url?: string;
  api_keys: Record<string, string>;
  backup_automatico: boolean;
  backup_frequencia: 'diario' | 'semanal' | 'mensal';
  backup_horario: string;
  manutencao_automatica: boolean;
}

type TodasConfiguracoes = {
  seguranca: ConfiguracaoSeguranca;
  sistema: ConfiguracaoSistema;
  notificacoes: ConfiguracaoNotificacoes;
  integracao: ConfiguracaoIntegracao;
};

const CONFIGURACOES_PADRAO: TodasConfiguracoes = {
  seguranca: {
    tempo_sessao: 480, // 8 horas
    tentativas_login: 5,
    bloqueio_temporario: 30,
    exigir_2fa: false,
    senha_minima_caracteres: 8,
    senha_exigir_maiuscula: true,
    senha_exigir_numero: true,
    senha_exigir_simbolo: false,
    logout_automatico_inatividade: true
  },
  sistema: {
    tema: 'auto',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    formato_moeda: 'R$ 0,00',
    moeda_padrao: 'BRL',
    primeira_pagina: '/dashboard',
    itens_por_pagina: 20
  },
  notificacoes: {
    email_novos_usuarios: true,
    email_tentativas_login: true,
    email_alteracoes_config: true,
    email_backup_diario: false,
    email_relatorios_semanais: false,
    notificacao_browser: true,
    som_notificacoes: true
  },
  integracao: {
    webhook_url: '',
    api_keys: {},
    backup_automatico: true,
    backup_frequencia: 'diario',
    backup_horario: '02:00',
    manutencao_automatica: true
  }
};

export const ConfiguracoesEmpresa: React.FC = () => {
  const { user, empresa } = useMultitenantAuth();
  const [activeTab, setActiveTab] = useState<CategoriaConfiguracao>('empresa' as CategoriaConfiguracao);
  const [configuracoes, setConfiguracoes] = useState<TodasConfiguracoes>(CONFIGURACOES_PADRAO);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentEmpresaId, setCurrentEmpresaId] = useState<string | null>(null);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Partial<TodasConfiguracoes>>({});
  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome: empresa?.nome || '',
    cnpj: '',
    email_admin: empresa?.email || '',
    telefone: empresa?.telefone || '',
    endereco: {
      logradouro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });
  const [isSavingEmpresa, setIsSavingEmpresa] = useState(false);
  
  // Debounce para evitar muitas chamadas de API
  const debouncedDadosEmpresa = useDebounce(dadosEmpresa, 500);

  // Carregar dados da empresa
  const carregarDadosEmpresa = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      const { data: empresaData, error } = await supabase
        .from('empresas')
        .select('nome, cnpj, email_admin, telefone, endereco')
        .eq('id', empresa.id)
        .single();

      if (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        return;
      }

      if (empresaData) {
        const endereco = empresaData.endereco || {};
        setDadosEmpresa({
          nome: empresaData.nome || '',
          cnpj: empresaData.cnpj || '',
          email_admin: empresaData.email_admin || '',
          telefone: empresaData.telefone || '',
          endereco: {
            logradouro: endereco.logradouro || '',
            cidade: endereco.cidade || '',
            estado: endereco.estado || '',
            cep: endereco.cep || ''
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  }, [empresa?.id]);

  // Salvar dados da empresa (com debug melhorado)
  const salvarDadosEmpresa = useCallback(async () => {
    if (!empresa?.id) {
      console.error('❌ Empresa ID não encontrado');
      return;
    }

    try {
      setIsSavingEmpresa(true);
      setError('');

      // Validar estrutura do endereço
      const enderecoValido = {
        logradouro: dadosEmpresa.endereco?.logradouro || '',
        cidade: dadosEmpresa.endereco?.cidade || '',
        estado: dadosEmpresa.endereco?.estado || '',
        cep: dadosEmpresa.endereco?.cep || ''
      };

      // Validar CNPJ (remover caracteres especiais se houver)
      const cnpjLimpo = dadosEmpresa.cnpj?.replace(/[^\d]/g, '') || '';
      
      // Verificar se o CNPJ já existe em outra empresa
      if (cnpjLimpo && cnpjLimpo.length > 0) {
        const { data: cnpjExistente, error: cnpjError } = await supabase
          .from('empresas')
          .select('id')
          .eq('cnpj', cnpjLimpo)
          .neq('id', empresa.id);
          
        if (cnpjError) {
          console.warn('⚠️ Erro ao verificar CNPJ:', cnpjError);
        } else if (cnpjExistente && cnpjExistente.length > 0) {
          throw new Error('CNPJ já está sendo usado por outra empresa');
        }
      }

      const camposParaAtualizar = {
        nome: dadosEmpresa.nome,
        cnpj: cnpjLimpo || null,
        email_admin: dadosEmpresa.email_admin,
        telefone: dadosEmpresa.telefone,
        endereco: enderecoValido,
        updated_at: new Date().toISOString()
      };

      // Tentar update com select, com fallback se não funcionar
      let data = null;
      let updateError = null;

      // Executar update com fallback robusto
      try {
        const result = await supabase
          .from('empresas')
          .update(camposParaAtualizar)
          .eq('id', empresa.id)
          .select();
        
        data = result.data;
        updateError = result.error;
        
        // Se não retornou dados, tentar verificação separada
        if (!updateError && (!data || data.length === 0)) {
          const { error: updateOnlyError } = await supabase
            .from('empresas')
            .update(camposParaAtualizar)
            .eq('id', empresa.id);
          
          if (!updateOnlyError) {
            const { data: checkData, error: checkError } = await supabase
              .from('empresas')
              .select('*')
              .eq('id', empresa.id)
              .single();
              
            if (!checkError && checkData) {
              data = [checkData];
            }
          }
        }
      } catch (err) {
        updateError = err;
      }

      if (updateError) {
        console.error('❌ Erro no update:', updateError);
        throw new Error(updateError.message);
      }

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Log de auditoria
      try {
        await supabase.rpc('registrar_log_auditoria', {
          p_empresa_id: empresa.id,
          p_usuario_id: user?.user_id,
          p_acao: 'UPDATE_COMPANY_DATA',
          p_recurso: 'empresas',
          p_detalhes: {
            campos_alterados: ['nome', 'cnpj', 'email_admin', 'telefone', 'endereco']
          }
        });
      } catch (logError) {
        // Log de auditoria não é crítico
      }

      setSuccessMessage('Dados da empresa salvos com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Recarregar dados para refletir as alterações
      setTimeout(async () => {
        if (empresa?.id) {
          try {
            const { data: empresaData, error } = await supabase
              .from('empresas')
              .select('nome, cnpj, email_admin, telefone, endereco')
              .eq('id', empresa.id)
              .single();

            if (!error && empresaData) {
              const endereco = empresaData.endereco || {};
              setDadosEmpresa({
                nome: empresaData.nome || '',
                cnpj: empresaData.cnpj || '',
                email_admin: empresaData.email_admin || '',
                telefone: empresaData.telefone || '',
                endereco: {
                  logradouro: endereco.logradouro || '',
                  cidade: endereco.cidade || '',
                  estado: endereco.estado || '',
                  cep: endereco.cep || ''
                }
              });
            }
          } catch (error) {
            console.error('Erro ao recarregar dados:', error);
          }
        }
      }, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar dados da empresa');
    } finally {
      setIsSavingEmpresa(false);
    }
  }, [dadosEmpresa, empresa?.id, user?.user_id]);

  // Carregar configurações da empresa
  const carregarConfiguracoes = useCallback(async () => {
    if (!empresa?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('categoria, configuracoes')
        .eq('empresa_id', empresa?.id);

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      // Organizar configurações por categoria
      const configsCarregadas = { ...CONFIGURACOES_PADRAO };
      
      data?.forEach(config => {
        const categoria = config.categoria as CategoriaConfiguracao;
        if (categoria in configsCarregadas) {
          configsCarregadas[categoria] = {
            ...configsCarregadas[categoria],
            ...config.configuracoes
          };
        }
      });

      setConfiguracoes(configsCarregadas);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, [empresa?.id]);

  // Carregar dados apenas quando empresa mudar
  useEffect(() => {
    if (empresa?.id && empresa.id !== currentEmpresaId) {
      setCurrentEmpresaId(empresa.id);
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Carregar dados em paralelo
      const loadData = async () => {
        try {
          await Promise.all([
            carregarConfiguracoes(),
            carregarDadosEmpresa()
          ]);
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [empresa?.id, currentEmpresaId]);

  // Salvar configurações (otimizado)
  const salvarConfiguracoes = useCallback(async (categoria: CategoriaConfiguracao, novasConfigs: any) => {
    try {
      setIsSaving(true);
      setErrors({});

      // Atualizar estado local imediatamente para melhor UX
      setConfiguracoes(prev => ({
        ...prev,
        [categoria]: novasConfigs
      }));

      // Executar upsert e log em paralelo
      const [upsertResult] = await Promise.allSettled([
        supabase
          .from('configuracoes_empresa')
          .upsert({
            empresa_id: empresa?.id,
            categoria,
            configuracoes: novasConfigs
          }, {
            onConflict: 'empresa_id,categoria'
          }),
        
        // Log de auditoria em paralelo
        supabase.rpc('registrar_log_auditoria', {
          p_empresa_id: empresa?.id,
          p_usuario_id: user?.user_id,
          p_acao: 'UPDATE_CONFIG',
          p_recurso: `configuracoes_${categoria}`,
          p_detalhes: {
            categoria,
            alteracoes: Object.keys(novasConfigs)
          }
        })
      ]);

      if (upsertResult.status === 'rejected' || upsertResult.value.error) {
        // Reverter estado local em caso de erro
        await carregarConfiguracoes();
        throw new Error(upsertResult.status === 'rejected' ? 'Erro na conexão' : upsertResult.value.error.message);
      }

      setSuccessMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar configurações' });
    } finally {
      setIsSaving(false);
    }
  }, [empresa?.id, user?.user_id, carregarConfiguracoes]);

  // Confirmar senha para alterações sensíveis (otimizado)
  const confirmarSenha = useCallback(async () => {
    if (!confirmPassword) {
      setErrors({ password: 'Senha é obrigatória para confirmar alterações' });
      return false;
    }

    try {
      // Verificar senha atual
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: confirmPassword
      });

      if (error) {
        setErrors({ password: 'Senha incorreta' });
        return false;
      }

      return true;
    } catch (error) {
      setErrors({ password: 'Erro ao verificar senha' });
      return false;
    }
  }, [confirmPassword, user?.email]);

  // Aplicar alterações pendentes (otimizado)
  const aplicarAlteracoesPendentes = useCallback(async () => {
    const senhaConfirmada = await confirmarSenha();
    if (!senhaConfirmada) return;

    // Salvar todas as configurações pendentes em paralelo
    const savePromises = Object.entries(pendingChanges).map(([categoria, configs]) =>
      salvarConfiguracoes(categoria as CategoriaConfiguracao, configs)
    );

    await Promise.all(savePromises);

    setPendingChanges({});
    setShowConfirmPassword(false);
    setConfirmPassword('');
  }, [confirmarSenha, pendingChanges, salvarConfiguracoes]);

  // Atualizar configuração específica (otimizado)
  const atualizarConfiguracao = useCallback((categoria: CategoriaConfiguracao, campo: string, valor: any) => {
    const novasConfigs = {
      ...configuracoes[categoria],
      [campo]: valor
    };

    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: novasConfigs
    }));

    // Para configurações de segurança, exigir confirmação de senha
    if (categoria === CategoriaConfiguracao.SEGURANCA) {
      setPendingChanges(prev => ({
        ...prev,
        [categoria]: novasConfigs
      }));
      setShowConfirmPassword(true);
    } else {
      // Salvar imediatamente para outras categorias
      salvarConfiguracoes(categoria, novasConfigs);
    }
  }, [configuracoes, salvarConfiguracoes]);

  // Memoizar tabs para evitar re-renders desnecessários
  const tabs = useMemo(() => [
    {
      id: 'empresa' as CategoriaConfiguracao,
      name: 'Empresa',
      icon: '🏢',
      description: 'Dados e informações da empresa'
    },
    {
      id: 'cargos' as CategoriaConfiguracao,
      name: 'Cargos',
      icon: '👔',
      description: 'Gerenciar cargos e departamentos'
    },
    {
      id: CategoriaConfiguracao.SISTEMA,
      name: 'Sistema',
      icon: '⚙️',
      description: 'Configurações gerais do sistema'
    },
    {
      id: CategoriaConfiguracao.SEGURANCA,
      name: 'Segurança',
      icon: '🔒',
      description: 'Configurações de segurança e autenticação'
    },
    {
      id: CategoriaConfiguracao.NOTIFICACOES,
      name: 'Notificações',
      icon: '🔔',
      description: 'Configurações de notificações e alertas'
    },
    {
      id: CategoriaConfiguracao.INTEGRACAO,
      name: 'Integração',
      icon: '🔗',
      description: 'Configurações de integração e backup'
    }
  ], []);

  // Componente de loading otimizado
  const LoadingSpinner = useMemo(() => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando configurações...</p>
      </div>
    </div>
  ), []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        {LoadingSpinner}
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Empresa</h1>
            <p className="mt-2 text-gray-600">
              Configure as preferências e comportamentos do sistema para {empresa?.nome}
            </p>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {(errors.submit || error) && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{errors.submit || error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Dados da Empresa */}
              {activeTab === 'empresa' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Empresa</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Configure as informações básicas da sua empresa.
                      </p>
                    </div>
                    <button
                      onClick={salvarDadosEmpresa}
                      disabled={isSavingEmpresa}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSavingEmpresa ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        'Salvar Dados'
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome da Empresa */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        value={dadosEmpresa.nome}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite o nome da empresa"
                        required
                      />
                    </div>

                    {/* CNPJ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={dadosEmpresa.cnpj}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={dadosEmpresa.email_admin}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, email_admin: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="contato@empresa.com"
                        required
                      />
                    </div>

                    {/* Telefone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={dadosEmpresa.telefone}
                        onChange={(e) => setDadosEmpresa(prev => ({ ...prev, telefone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>

                    {/* Endereço */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={dadosEmpresa.endereco.logradouro}
                        onChange={(e) => setDadosEmpresa(prev => ({ 
                          ...prev, 
                          endereco: { ...prev.endereco, logradouro: e.target.value }
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Rua, número, bairro"
                      />
                    </div>

                    {/* Cidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={dadosEmpresa.endereco.cidade}
                        onChange={(e) => setDadosEmpresa(prev => ({ 
                          ...prev, 
                          endereco: { ...prev.endereco, cidade: e.target.value }
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nome da cidade"
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={dadosEmpresa.endereco.estado}
                        onChange={(e) => setDadosEmpresa(prev => ({ 
                          ...prev, 
                          endereco: { ...prev.endereco, estado: e.target.value }
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione o estado</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                      </select>
                    </div>

                    {/* CEP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={dadosEmpresa.endereco.cep}
                        onChange={(e) => setDadosEmpresa(prev => ({ 
                          ...prev, 
                          endereco: { ...prev.endereco, cep: e.target.value }
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Informações Importantes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Os campos marcados com * são obrigatórios</li>
                      <li>• As alterações serão registradas nos logs de auditoria</li>
                      <li>• O nome da empresa será exibido em todo o sistema</li>
                      <li>• O email será usado para comunicações oficiais</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Configurações de Cargos e Departamentos */}
              {activeTab === 'cargos' && (
                <ConfiguracaoCargos />
              )}

              {/* Configurações de Sistema */}
              {activeTab === CategoriaConfiguracao.SISTEMA && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações do Sistema</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure a aparência e comportamento geral do sistema.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tema */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema da Interface
                      </label>
                      <select
                        value={configuracoes.sistema.tema}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SISTEMA, 'tema', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="claro">Claro</option>
                        <option value="escuro">Escuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>

                    {/* Idioma */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select
                        value={configuracoes.sistema.idioma}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SISTEMA, 'idioma', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuso Horário
                      </label>
                      <select
                        value={configuracoes.sistema.timezone}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SISTEMA, 'timezone', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                      </select>
                    </div>

                    {/* Formato de Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formato de Data
                      </label>
                      <select
                        value={configuracoes.sistema.formato_data}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SISTEMA, 'formato_data', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    {/* Moeda Padrão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moeda Padrão
                      </label>
                      <select
                        value={configuracoes.sistema.moeda_padrao}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SISTEMA, 'moeda_padrao', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="BRL">Real (R$)</option>
                        <option value="USD">Dólar ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>

                    {/* Itens por Página */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Itens por Página
                      </label>
                      <select
                        value={configuracoes.sistema.itens_por_pagina}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SISTEMA, 'itens_por_pagina', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações de Segurança */}
              {activeTab === CategoriaConfiguracao.SEGURANCA && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Segurança</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure as políticas de segurança e autenticação. Alterações nesta seção requerem confirmação de senha.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tempo de Sessão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo de Sessão (minutos)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="1440"
                        value={configuracoes.seguranca.tempo_sessao}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'tempo_sessao', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Tentativas de Login */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Tentativas de Login
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={configuracoes.seguranca.tentativas_login}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'tentativas_login', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Bloqueio Temporário */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bloqueio Temporário (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={configuracoes.seguranca.bloqueio_temporario}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'bloqueio_temporario', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Caracteres Mínimos da Senha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caracteres Mínimos da Senha
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="20"
                        value={configuracoes.seguranca.senha_minima_caracteres}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'senha_minima_caracteres', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Checkboxes de Segurança */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="exigir_2fa"
                        type="checkbox"
                        checked={configuracoes.seguranca.exigir_2fa}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'exigir_2fa', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="exigir_2fa" className="ml-2 block text-sm text-gray-900">
                        Exigir autenticação de dois fatores (2FA)
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="senha_exigir_maiuscula"
                        type="checkbox"
                        checked={configuracoes.seguranca.senha_exigir_maiuscula}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'senha_exigir_maiuscula', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="senha_exigir_maiuscula" className="ml-2 block text-sm text-gray-900">
                        Senha deve conter pelo menos uma letra maiúscula
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="senha_exigir_numero"
                        type="checkbox"
                        checked={configuracoes.seguranca.senha_exigir_numero}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'senha_exigir_numero', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="senha_exigir_numero" className="ml-2 block text-sm text-gray-900">
                        Senha deve conter pelo menos um número
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="senha_exigir_simbolo"
                        type="checkbox"
                        checked={configuracoes.seguranca.senha_exigir_simbolo}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'senha_exigir_simbolo', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="senha_exigir_simbolo" className="ml-2 block text-sm text-gray-900">
                        Senha deve conter pelo menos um símbolo
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="logout_automatico_inatividade"
                        type="checkbox"
                        checked={configuracoes.seguranca.logout_automatico_inatividade}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.SEGURANCA, 'logout_automatico_inatividade', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="logout_automatico_inatividade" className="ml-2 block text-sm text-gray-900">
                        Logout automático por inatividade
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações de Notificações */}
              {activeTab === CategoriaConfiguracao.NOTIFICACOES && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Notificações</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure quando e como receber notificações do sistema.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Notificações por Email */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Notificações por Email</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            id="email_novos_usuarios"
                            type="checkbox"
                            checked={configuracoes.notificacoes.email_novos_usuarios}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'email_novos_usuarios', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email_novos_usuarios" className="ml-2 block text-sm text-gray-900">
                            Novos usuários cadastrados
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="email_tentativas_login"
                            type="checkbox"
                            checked={configuracoes.notificacoes.email_tentativas_login}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'email_tentativas_login', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email_tentativas_login" className="ml-2 block text-sm text-gray-900">
                            Tentativas de login suspeitas
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="email_alteracoes_config"
                            type="checkbox"
                            checked={configuracoes.notificacoes.email_alteracoes_config}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'email_alteracoes_config', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email_alteracoes_config" className="ml-2 block text-sm text-gray-900">
                            Alterações nas configurações
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="email_backup_diario"
                            type="checkbox"
                            checked={configuracoes.notificacoes.email_backup_diario}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'email_backup_diario', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email_backup_diario" className="ml-2 block text-sm text-gray-900">
                            Relatório de backup diário
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="email_relatorios_semanais"
                            type="checkbox"
                            checked={configuracoes.notificacoes.email_relatorios_semanais}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'email_relatorios_semanais', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email_relatorios_semanais" className="ml-2 block text-sm text-gray-900">
                            Relatórios semanais de atividade
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Notificações do Navegador */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Notificações do Navegador</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            id="notificacao_browser"
                            type="checkbox"
                            checked={configuracoes.notificacoes.notificacao_browser}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'notificacao_browser', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="notificacao_browser" className="ml-2 block text-sm text-gray-900">
                            Habilitar notificações do navegador
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="som_notificacoes"
                            type="checkbox"
                            checked={configuracoes.notificacoes.som_notificacoes}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.NOTIFICACOES, 'som_notificacoes', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="som_notificacoes" className="ml-2 block text-sm text-gray-900">
                            Som nas notificações
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações de Integração */}
              {activeTab === CategoriaConfiguracao.INTEGRACAO && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Integração</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure integrações externas, backups e manutenção automática.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Webhook URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL do Webhook
                      </label>
                      <input
                        type="url"
                        value={configuracoes.integracao.webhook_url || ''}
                        onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.INTEGRACAO, 'webhook_url', e.target.value)}
                        placeholder="https://exemplo.com/webhook"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        URL para receber notificações de eventos do sistema
                      </p>
                    </div>

                    {/* Configurações de Backup */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Backup Automático</h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            id="backup_automatico"
                            type="checkbox"
                            checked={configuracoes.integracao.backup_automatico}
                            onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.INTEGRACAO, 'backup_automatico', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="backup_automatico" className="ml-2 block text-sm text-gray-900">
                            Habilitar backup automático
                          </label>
                        </div>

                        {configuracoes.integracao.backup_automatico && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Frequência do Backup
                              </label>
                              <select
                                value={configuracoes.integracao.backup_frequencia}
                                onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.INTEGRACAO, 'backup_frequencia', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="diario">Diário</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensal">Mensal</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Horário do Backup
                              </label>
                              <input
                                type="time"
                                value={configuracoes.integracao.backup_horario}
                                onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.INTEGRACAO, 'backup_horario', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manutenção Automática */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="manutencao_automatica"
                          type="checkbox"
                          checked={configuracoes.integracao.manutencao_automatica}
                          onChange={(e) => atualizarConfiguracao(CategoriaConfiguracao.INTEGRACAO, 'manutencao_automatica', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="manutencao_automatica" className="ml-2 block text-sm text-gray-900">
                          Habilitar manutenção automática do sistema
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 ml-6">
                        Limpeza automática de logs antigos, otimização de banco de dados, etc.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Senha */}
      {showConfirmPassword && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Alterações de Segurança
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Para sua segurança, confirme sua senha para aplicar as alterações nas configurações de segurança.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite sua senha atual"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmPassword(false);
                    setConfirmPassword('');
                    setPendingChanges({});
                    setErrors({});
                    // Reverter alterações
                    carregarConfiguracoes();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicarAlteracoesPendentes}
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};