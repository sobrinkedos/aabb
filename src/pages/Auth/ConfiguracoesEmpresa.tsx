import React, { useState, useEffect } from 'react';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContext';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';
import { ModuloSistema, CategoriaConfiguracao, ConfiguracaoEmpresa } from '../../types/multitenant';
import { supabase } from '../../lib/supabase';

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
  const [activeTab, setActiveTab] = useState<CategoriaConfiguracao>(CategoriaConfiguracao.SISTEMA);
  const [configuracoes, setConfiguracoes] = useState<TodasConfiguracoes>(CONFIGURACOES_PADRAO);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Partial<TodasConfiguracoes>>({});

  // Carregar configurações da empresa
  useEffect(() => {
    if (empresa?.id) {
      carregarConfiguracoes();
    }
  }, [empresa?.id]);

  const carregarConfiguracoes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('*')
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
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar configurações
  const salvarConfiguracoes = async (categoria: CategoriaConfiguracao, novasConfigs: any) => {
    try {
      setIsSaving(true);
      setErrors({});

      // Upsert das configurações
      const { error } = await supabase
        .from('configuracoes_empresa')
        .upsert({
          empresa_id: empresa?.id,
          categoria,
          configuracoes: novasConfigs
        }, {
          onConflict: 'empresa_id,categoria'
        });

      if (error) {
        throw new Error(error.message);
      }

      // Atualizar estado local
      setConfiguracoes(prev => ({
        ...prev,
        [categoria]: novasConfigs
      }));

      setSuccessMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Registrar log de auditoria
      await supabase.rpc('registrar_log_auditoria', {
        p_empresa_id: empresa?.id,
        p_usuario_id: user?.user_id,
        p_acao: 'UPDATE_CONFIG',
        p_recurso: `configuracoes_${categoria}`,
        p_detalhes: {
          categoria,
          alteracoes: Object.keys(novasConfigs)
        }
      });

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar configurações' });
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar senha para alterações sensíveis
  const confirmarSenha = async () => {
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
  };

  // Aplicar alterações pendentes
  const aplicarAlteracoesPendentes = async () => {
    const senhaConfirmada = await confirmarSenha();
    if (!senhaConfirmada) return;

    for (const [categoria, configs] of Object.entries(pendingChanges)) {
      await salvarConfiguracoes(categoria as CategoriaConfiguracao, configs);
    }

    setPendingChanges({});
    setShowConfirmPassword(false);
    setConfirmPassword('');
  };

  // Atualizar configuração específica
  const atualizarConfiguracao = (categoria: CategoriaConfiguracao, campo: string, valor: any) => {
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
  };

  const tabs = [
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
  ];

  if (isLoading) {
    return (
      <ProtectedRoute modulo={ModuloSistema.CONFIGURACOES} acao="visualizar" requireAdmin={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute modulo={ModuloSistema.CONFIGURACOES} acao="visualizar" requireAdmin={true}>
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

          {errors.submit && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{errors.submit}</p>
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