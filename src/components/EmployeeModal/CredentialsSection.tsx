import React, { useState } from 'react';
import { Key, Eye, EyeOff, Copy, RefreshCw, User, Smartphone, AlertTriangle } from 'lucide-react';
import { Employee } from '../../types/employee.types';
import { 
  generateEmployeeCredentials, 
  generateAccessCredentials,
  validateUsername,
  validatePasswordStrength,
  formatCredentialsForDisplay,
  UserCredentials
} from '../../utils/credentialsGenerator';

interface CredentialsSectionProps {
  employee: Partial<Employee>;
  onCredentialsGenerated: (credentials: any) => void;
  mode: 'create' | 'edit';
}

export const CredentialsSection: React.FC<CredentialsSectionProps> = ({
  employee,
  onCredentialsGenerated,
  mode
}) => {
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [customUsername, setCustomUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomCredentials, setUseCustomCredentials] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCredentials = () => {
    if (!employee.name) {
      alert('Preencha o nome do funcionário primeiro');
      return;
    }

    const newCredentials = generateEmployeeCredentials(employee as Employee);
    setCredentials(newCredentials);
    
    // Gerar credenciais completas incluindo mobile se for garçom
    const fullCredentials = generateAccessCredentials(employee as Employee);
    onCredentialsGenerated(fullCredentials);
  };

  const handleCustomCredentials = () => {
    if (!customUsername || !customPassword) {
      alert('Preencha usuário e senha personalizados');
      return;
    }

    const usernameValidation = validateUsername(customUsername);
    if (!usernameValidation.valid) {
      alert(usernameValidation.message);
      return;
    }

    const passwordStrength = validatePasswordStrength(customPassword);
    if (passwordStrength.strength === 'weak') {
      const confirm = window.confirm(
        `Senha fraca detectada. Sugestões:\n${passwordStrength.feedback.join('\n')}\n\nDeseja continuar mesmo assim?`
      );
      if (!confirm) return;
    }

    const customCreds: UserCredentials = {
      username: customUsername,
      password: customPassword,
      email: employee.email || '',
      temporaryPassword: false
    };

    setCredentials(customCreds);
    onCredentialsGenerated({
      system: customCreds,
      mobile: employee.role === 'waiter' ? {
        ...customCreds,
        appId: `garcom_${customUsername}`,
        deviceLimit: 2
      } : null,
      passwordExpiry: null // Senha personalizada não expira automaticamente
    });
  };

  const copyCredentials = async () => {
    if (!credentials) return;

    const text = formatCredentialsForDisplay(credentials);
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const passwordStrength = customPassword ? validatePasswordStrength(customPassword) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Key className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Credenciais de Acesso</h3>
      </div>

      {mode === 'create' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Geração de Credenciais</h4>
              <p className="text-sm text-blue-700 mt-1">
                Gere automaticamente usuário e senha para o funcionário acessar o sistema.
                {employee.role === 'waiter' && (
                  <span className="block mt-1">
                    <Smartphone className="inline h-4 w-4 mr-1" />
                    Como garçom, também receberá acesso ao app mobile.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Opções de geração */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={!useCustomCredentials}
              onChange={() => setUseCustomCredentials(false)}
              className="text-blue-600"
            />
            <span>Gerar automaticamente</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={useCustomCredentials}
              onChange={() => setUseCustomCredentials(true)}
              className="text-blue-600"
            />
            <span>Definir manualmente</span>
          </label>
        </div>

        {!useCustomCredentials ? (
          <div className="space-y-3">
            <button
              onClick={generateCredentials}
              disabled={!employee.name}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Gerar Credenciais</span>
            </button>
            
            {!employee.name && (
              <p className="text-sm text-gray-500">
                Preencha o nome do funcionário para gerar credenciais
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Usuário
              </label>
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value.toLowerCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario.exemplo"
              />
              {customUsername && (() => {
                const validation = validateUsername(customUsername);
                return !validation.valid ? (
                  <p className="mt-1 text-sm text-red-600">{validation.message}</p>
                ) : (
                  <p className="mt-1 text-sm text-green-600">✓ Nome de usuário válido</p>
                );
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite uma senha segura"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className={`text-sm font-medium ${
                      passwordStrength.strength === 'strong' ? 'text-green-600' :
                      passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      Força: {passwordStrength.strength === 'strong' ? 'Forte' :
                               passwordStrength.strength === 'medium' ? 'Média' : 'Fraca'}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength.strength === 'strong' ? 'bg-green-500' :
                          passwordStrength.strength === 'medium' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-600">Sugestões:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {passwordStrength.feedback.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleCustomCredentials}
              disabled={!customUsername || !customPassword}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Key className="h-4 w-4" />
              <span>Definir Credenciais</span>
            </button>
          </div>
        )}
      </div>

      {/* Exibição das credenciais geradas */}
      {credentials && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Credenciais Geradas</h4>
            <button
              onClick={copyCredentials}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Copy className="h-3 w-3" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-semibold">{credentials.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Usuário:</span>
              <span className="ml-2 font-semibold">{credentials.username}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">Senha:</span>
              <span className="ml-2 font-semibold">
                {showPassword ? credentials.password : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {credentials.temporaryPassword && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900">Senha Temporária</p>
                  <p className="text-yellow-700">
                    O funcionário deve alterar esta senha no primeiro acesso.
                    A senha expira em 7 dias.
                  </p>
                </div>
              </div>
            </div>
          )}

          {employee.role === 'waiter' && (
            <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded">
              <div className="flex items-start space-x-2">
                <Smartphone className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-indigo-900">Acesso ao App Garçom</p>
                  <p className="text-indigo-700">
                    Estas credenciais também funcionam no aplicativo mobile.
                    Limite: 2 dispositivos simultâneos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};