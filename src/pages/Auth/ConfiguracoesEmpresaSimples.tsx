import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContextSimple';

interface DadosEmpresa {
  nome: string;
  cnpj: string;
  email_admin: string;
  telefone: string;
  endereco: {
    logradouro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

export const ConfiguracoesEmpresaSimples: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('empresa');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({
    nome: '',
    cnpj: '',
    email_admin: '',
    telefone: '',
    endereco: {
      logradouro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });

  // Carregar dados da empresa
  useEffect(() => {
    const carregarDados = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError('');

        // Primeiro, obter a empresa do usuário
        const { data: usuarioEmpresa, error: userError } = await supabase
          .from('usuarios_empresa')
          .select('empresa_id')
          .eq('user_id', user.id)
          .single();

        if (userError) {
          console.error('Erro ao obter empresa do usuário:', userError);
          setError('Erro ao carregar dados do usuário');
          return;
        }

        if (!usuarioEmpresa?.empresa_id) {
          setError('Usuário não está associado a nenhuma empresa');
          return;
        }

        // Carregar dados da empresa
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('nome, cnpj, email_admin, telefone, endereco')
          .eq('id', usuarioEmpresa.empresa_id)
          .single();

        if (empresaError) {
          console.error('Erro ao carregar dados da empresa:', empresaError);
          setError('Erro ao carregar dados da empresa');
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
        console.error('Erro ao carregar dados:', error);
        setError('Erro interno ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [user]);

  // Salvar dados da empresa
  const salvarDados = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      // Obter empresa do usuário
      const { data: usuarioEmpresa, error: userError } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (userError || !usuarioEmpresa?.empresa_id) {
        setError('Erro ao identificar empresa do usuário');
        return;
      }

      // Validar dados básicos
      if (!dadosEmpresa.nome.trim()) {
        setError('Nome da empresa é obrigatório');
        return;
      }

      if (!dadosEmpresa.email_admin.trim()) {
        setError('Email é obrigatório');
        return;
      }

      // Preparar dados para atualização
      const dadosAtualizacao = {
        nome: dadosEmpresa.nome.trim(),
        cnpj: dadosEmpresa.cnpj.replace(/[^\d]/g, '') || null,
        email_admin: dadosEmpresa.email_admin.trim(),
        telefone: dadosEmpresa.telefone.trim(),
        endereco: {
          logradouro: dadosEmpresa.endereco.logradouro.trim(),
          cidade: dadosEmpresa.endereco.cidade.trim(),
          estado: dadosEmpresa.endereco.estado,
          cep: dadosEmpresa.endereco.cep.replace(/[^\d]/g, '')
        },
        updated_at: new Date().toISOString()
      };

      // Atualizar dados da empresa
      const { error: updateError } = await supabase
        .from('empresas')
        .update(dadosAtualizacao)
        .eq('id', usuarioEmpresa.empresa_id);

      if (updateError) {
        console.error('Erro ao atualizar empresa:', updateError);
        setError('Erro ao salvar dados da empresa');
        return;
      }

      setSuccessMessage('Dados salvos com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setError('Erro interno ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Empresa</h1>
          <p className="mt-2 text-gray-600">
            Configure as informações da sua empresa
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

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('empresa')}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'empresa'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg mr-2">🏢</span>
                Dados da Empresa
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Empresa</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure as informações básicas da sua empresa.
                  </p>
                </div>
                <button
                  onClick={salvarDados}
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
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={dadosEmpresa.telefone}
                    onChange={(e) => setDadosEmpresa(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};