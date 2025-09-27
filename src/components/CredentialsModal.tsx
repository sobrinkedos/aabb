import React, { useState } from 'react';
import { X, Copy, Eye, EyeOff, User, Key, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    system: {
      username?: string;
      password: string;
      email: string;
      temporaryPassword?: boolean;
    };
    mobile?: {
      username: string;
      password: string;
      appId: string;
      deviceLimit: number;
    };
    firstAccessToken?: string;
    passwordExpiry?: Date;
  };
  employeeName: string;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  employeeName
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const formatCredentialsText = () => {
    return `
CREDENCIAIS DE ACESSO - ${employeeName.toUpperCase()}

📧 Email: ${credentials.system.email}
👤 Usuário: ${credentials.system.username}
🔑 Senha: ${credentials.system.password}

${credentials.system.temporaryPassword ? '⚠️ IMPORTANTE: Esta é uma senha temporária que deve ser alterada no primeiro acesso.' : ''}
${credentials.mobile ? `\n📱 APP GARÇOM:\n- Mesmo usuário e senha\n- Limite: ${credentials.mobile.deviceLimit} dispositivos` : ''}
${credentials.firstAccessToken ? `\n🎫 Token de primeiro acesso: ${credentials.firstAccessToken}` : ''}
${credentials.passwordExpiry ? `\n⏰ Senha expira em: ${credentials.passwordExpiry.toLocaleDateString('pt-BR')}` : ''}

---
Entregue estas informações ao funcionário de forma segura.
    `.trim();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Credenciais Geradas</h2>
              <p className="text-sm text-gray-600">{employeeName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">Funcionário cadastrado com sucesso!</p>
              </div>
            </div>

            {/* System Credentials */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <User className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Acesso ao Sistema</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{credentials.system.email}</span>
                    <button
                      onClick={() => copyToClipboard(credentials.system.email, 'email')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {credentials.system.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usuário:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{credentials.system.username}</span>
                      <button
                        onClick={() => copyToClipboard(credentials.system.username!, 'username')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Senha:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">
                      {showPassword ? credentials.system.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(credentials.system.password, 'password')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Access */}
            {credentials.mobile && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-medium text-indigo-900">App Garçom</h3>
                </div>
                <div className="text-sm text-indigo-700">
                  <p>✓ Mesmo usuário e senha funcionam no app mobile</p>
                  <p>✓ Limite: {credentials.mobile.deviceLimit} dispositivos simultâneos</p>
                  <p>✓ Sincronização automática com o sistema</p>
                </div>
              </div>
            )}

            {/* Temporary Password Warning */}
            {(credentials.system.temporaryPassword !== false) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Senha Temporária</p>
                    <p className="text-yellow-700">
                      O funcionário deve alterar esta senha no primeiro acesso.
                      {credentials.passwordExpiry && (
                        <span className="block mt-1">
                          Expira em: {credentials.passwordExpiry.toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* First Access Token */}
            {credentials.firstAccessToken && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Token de Primeiro Acesso</p>
                    <p className="text-sm text-blue-700">Para validação adicional</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg font-bold text-blue-900">
                      {credentials.firstAccessToken}
                    </span>
                    <button
                      onClick={() => copyToClipboard(credentials.firstAccessToken!, 'token')}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={() => copyToClipboard(formatCredentialsText(), 'all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                copied === 'all'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>{copied === 'all' ? 'Copiado!' : 'Copiar Tudo'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};