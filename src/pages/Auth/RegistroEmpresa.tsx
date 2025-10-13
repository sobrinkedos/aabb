import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegistroEmpresaData } from '../../types/multitenant';
import { useRegistroEmpresa } from '../../hooks/useRegistroEmpresa';

interface FormErrors {
  [key: string]: string;
}

export const RegistroEmpresa: React.FC = () => {
  const navigate = useNavigate();
  const { registrarEmpresa, isLoading, error: registroError, clearError } = useRegistroEmpresa();
  
  const [formData, setFormData] = useState<RegistroEmpresaData>({
    nome_empresa: '',
    cnpj: '',
    telefone_empresa: '',
    endereco: {
      rua: '',
      numero: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    nome_admin: '',
    email_admin: '',
    telefone_admin: '',
    senha: '',
    confirmar_senha: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Função para validar CNPJ
  const validarCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let peso = 2;
    
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cleanCNPJ[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cleanCNPJ[12]) !== digito1) return false;
    
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cleanCNPJ[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const resto2 = soma % 11;
    const digito2 = resto2 < 2 ? 0 : 11 - resto2;
    
    return parseInt(cleanCNPJ[13]) === digito2;
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  // Função para formatar CEP
  const formatarCEP = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  // Função para formatar telefone
  const formatarTelefone = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  // Função para validar email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar senha
  const validarSenha = (senha: string): boolean => {
    return senha.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(senha);
  };

  // Função para validar formulário
  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {};

    // Validações do step 1 (dados da empresa)
    if (step >= 1) {
      if (!formData.nome_empresa.trim()) {
        newErrors.nome_empresa = 'Nome da empresa é obrigatório';
      }
      
      if (!formData.cnpj.trim()) {
        newErrors.cnpj = 'CNPJ é obrigatório';
      } else if (!validarCNPJ(formData.cnpj)) {
        newErrors.cnpj = 'CNPJ inválido';
      }
      
      if (formData.endereco?.cep && !/^\d{5}-?\d{3}$/.test(formData.endereco.cep)) {
        newErrors.cep = 'CEP inválido';
      }
    }

    // Validações do step 2 (dados do administrador)
    if (step >= 2) {
      if (!formData.nome_admin.trim()) {
        newErrors.nome_admin = 'Nome do administrador é obrigatório';
      }
      
      if (!formData.email_admin.trim()) {
        newErrors.email_admin = 'Email é obrigatório';
      } else if (!validarEmail(formData.email_admin)) {
        newErrors.email_admin = 'Email inválido';
      }
      
      if (!formData.senha) {
        newErrors.senha = 'Senha é obrigatória';
      } else if (!validarSenha(formData.senha)) {
        newErrors.senha = 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número';
      }
      
      if (!formData.confirmar_senha) {
        newErrors.confirmar_senha = 'Confirmação de senha é obrigatória';
      } else if (formData.senha !== formData.confirmar_senha) {
        newErrors.confirmar_senha = 'Senhas não coincidem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para atualizar dados do formulário
  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof RegistroEmpresaData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função para avançar para próximo step
  const nextStep = () => {
    if (validarFormulario()) {
      setStep(step + 1);
    }
  };

  // Função para voltar step anterior
  const prevStep = () => {
    setStep(step - 1);
  };

  // Função para submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    // Limpar erros anteriores
    clearError();
    setErrors({});

    const result = await registrarEmpresa(formData);
    
    if (result.success) {
      navigate('/dashboard', {
        state: {
          message: 'Empresa registrada com sucesso! Você foi automaticamente logado como Administrador Principal.',
          type: 'success',
          showOnboarding: true // Flag para mostrar onboarding
        }
      });
    } else {
      setErrors({ submit: result.error || 'Erro ao registrar empresa' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registrar Nova Empresa
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            faça login se já tem uma conta
          </Link>
        </p>
        
        {/* Informação sobre privilégios do administrador principal */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Administrador Principal
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Você será o <strong>Administrador Principal</strong> da empresa com acesso total a:</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                  <li>Configurações da empresa e segurança</li>
                  <li>Gerenciamento completo de usuários</li>
                  <li>Relatórios avançados e auditoria</li>
                  <li>Integrações externas e backup</li>
                  <li>Todos os módulos do sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Dados da Empresa</span>
              <span className="text-xs text-gray-500">Administrador</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Empresa</h3>
                
                <div>
                  <label htmlFor="nome_empresa" className="block text-sm font-medium text-gray-700">
                    Nome da Empresa *
                  </label>
                  <input
                    id="nome_empresa"
                    type="text"
                    value={formData.nome_empresa}
                    onChange={(e) => handleInputChange('nome_empresa', e.target.value)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nome_empresa ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.nome_empresa && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome_empresa}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                    CNPJ *
                  </label>
                  <input
                    id="cnpj"
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cnpj ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.cnpj && (
                    <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="telefone_empresa" className="block text-sm font-medium text-gray-700">
                    Telefone da Empresa
                  </label>
                  <input
                    id="telefone_empresa"
                    type="text"
                    value={formData.telefone_empresa}
                    onChange={(e) => handleInputChange('telefone_empresa', formatarTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rua" className="block text-sm font-medium text-gray-700">
                      Rua
                    </label>
                    <input
                      id="rua"
                      type="text"
                      value={formData.endereco?.rua || ''}
                      onChange={(e) => handleInputChange('endereco.rua', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
                      Número
                    </label>
                    <input
                      id="numero"
                      type="text"
                      value={formData.endereco?.numero || ''}
                      onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
                      Cidade
                    </label>
                    <input
                      id="cidade"
                      type="text"
                      value={formData.endereco?.cidade || ''}
                      onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="estado"
                      value={formData.endereco?.estado || ''}
                      onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="AC">AC</option>
                      <option value="AL">AL</option>
                      <option value="AP">AP</option>
                      <option value="AM">AM</option>
                      <option value="BA">BA</option>
                      <option value="CE">CE</option>
                      <option value="DF">DF</option>
                      <option value="ES">ES</option>
                      <option value="GO">GO</option>
                      <option value="MA">MA</option>
                      <option value="MT">MT</option>
                      <option value="MS">MS</option>
                      <option value="MG">MG</option>
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PR">PR</option>
                      <option value="PE">PE</option>
                      <option value="PI">PI</option>
                      <option value="RJ">RJ</option>
                      <option value="RN">RN</option>
                      <option value="RS">RS</option>
                      <option value="RO">RO</option>
                      <option value="RR">RR</option>
                      <option value="SC">SC</option>
                      <option value="SP">SP</option>
                      <option value="SE">SE</option>
                      <option value="TO">TO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
                    CEP
                  </label>
                  <input
                    id="cep"
                    type="text"
                    value={formData.endereco?.cep || ''}
                    onChange={(e) => handleInputChange('endereco.cep', formatarCEP(e.target.value))}
                    placeholder="00000-000"
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cep ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.cep && (
                    <p className="mt-1 text-sm text-red-600">{errors.cep}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Próximo
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Administrador Principal</h3>
                  
                  {/* Destaque dos privilégios */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-blue-900">
                          🎯 Você terá privilégios totais como Administrador Principal
                        </h4>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-800">
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Configurações críticas
                          </div>
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Gerenciar administradores
                          </div>
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Integrações externas
                          </div>
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Backup e segurança
                          </div>
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Auditoria completa
                          </div>
                          <div className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Todos os módulos
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-blue-700 font-medium">
                          💡 Após o registro, você poderá criar outros administradores com privilégios limitados.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="nome_admin" className="block text-sm font-medium text-gray-700">
                    Nome Completo *
                  </label>
                  <input
                    id="nome_admin"
                    type="text"
                    value={formData.nome_admin}
                    onChange={(e) => handleInputChange('nome_admin', e.target.value)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nome_admin ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.nome_admin && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome_admin}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email_admin" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    id="email_admin"
                    type="email"
                    value={formData.email_admin}
                    onChange={(e) => handleInputChange('email_admin', e.target.value)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email_admin ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email_admin && (
                    <p className="mt-1 text-sm text-red-600">{errors.email_admin}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="telefone_admin" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    id="telefone_admin"
                    type="text"
                    value={formData.telefone_admin}
                    onChange={(e) => handleInputChange('telefone_admin', formatarTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                    Senha *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      className={`block w-full border rounded-md px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.senha ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.senha && (
                    <p className="mt-1 text-sm text-red-600">{errors.senha}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Mínimo 8 caracteres, incluindo maiúscula, minúscula e número
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmar_senha" className="block text-sm font-medium text-gray-700">
                    Confirmar Senha *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmar_senha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmar_senha}
                      onChange={(e) => handleInputChange('confirmar_senha', e.target.value)}
                      className={`block w-full border rounded-md px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.confirmar_senha ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmar_senha && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmar_senha}</p>
                  )}
                </div>

                {/* Termos específicos para administradores */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Responsabilidades do Administrador Principal
                      </h4>
                      <div className="mt-1 text-sm text-yellow-700">
                        <p className="mb-2">Ao se registrar como Administrador Principal, você concorda em:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Ser responsável pela segurança e configurações da empresa</li>
                          <li>Gerenciar adequadamente os acessos de outros usuários</li>
                          <li>Manter as informações da empresa atualizadas e seguras</li>
                          <li>Usar os privilégios administrativos de forma responsável</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {(errors.submit || registroError) && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {errors.submit || registroError}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registrando...
                      </>
                    ) : (
                      'Registrar Empresa'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};