/**
 * Modal de Exibição de Credenciais
 * 
 * Componente para exibir credenciais geradas de forma segura,
 * com funcionalidades de cópia, impressão e instruções de uso.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Copy, Printer, Eye, EyeOff, Download, Mail, Shield, Clock, 
  AlertTriangle, CheckCircle, User, Key, Smartphone, QrCode
} from 'lucide-react';
import { Employee } from '../../types/employee.types';
import { GeneratedPassword } from '../../utils/secure-password-generator';

// ============================================================================
// INTERFACES
// ============================================================================

interface EmployeeCredentials {
  employee: Employee;
  systemCredentials: {
    email: string;
    username: string;
    password: string;
    temporaryPassword: boolean;
    expiresAt?: Date;
  };
  mobileCredentials?: {
    appName: string;
    username: string;
    password: string;
    qrCode?: string;
    downloadUrl?: string;
  };
  generatedPassword?: GeneratedPassword;
  instructions?: string[];
  securityNotes?: string[];
}

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: EmployeeCredentials;
  onSendByEmail?: (credentials: EmployeeCredentials) => Promise<void>;
  onPrint?: (credentials: EmployeeCredentials) => void;
  showQRCode?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSendByEmail,
  onPrint,
  showQRCode = false
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'mobile' | 'security'>('system');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar modal com ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback
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

  const copyAllCredentials = async () => {
    const text = `
CREDENCIAIS DE ACESSO - ${credentials.employee.name}
=====================================================

ACESSO AO SISTEMA:
Email: ${credentials.systemCredentials.email}
Usuário: ${credentials.systemCredentials.username}
Senha: ${credentials.systemCredentials.password}

IMPORTANTE:
- Esta é uma senha temporária
- Altere a senha no primeiro acesso
- Não compartilhe suas credenciais

Gerado em: ${new Date().toLocaleString('pt-BR')}
    `.trim();

    await handleCopy(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-green-600" />
                  <span>Credenciais Geradas</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Credenciais de acesso para {credentials.employee.name}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* System Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Credenciais do Sistema</span>
              </h3>
              
              <div className="space-y-3">
                <div className="bg-white rounded p-3 border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <button
                      onClick={() => handleCopy(credentials.systemCredentials.email)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="font-mono text-sm">{credentials.systemCredentials.email}</div>
                </div>

                <div className="bg-white rounded p-3 border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Usuário</span>
                    <button
                      onClick={() => handleCopy(credentials.systemCredentials.username)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="font-mono text-sm">{credentials.systemCredentials.username}</div>
                </div>

                <div className="bg-white rounded p-3 border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Senha</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials.systemCredentials.password)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    {showPassword ? credentials.systemCredentials.password : '••••••••••••'}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            {credentials.systemCredentials.temporaryPassword && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Senha Temporária</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Esta senha deve ser alterada no primeiro acesso ao sistema.
                      A senha expira em 7 dias se não for alterada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Instruções de Uso</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Faça login no sistema usando as credenciais acima</li>
                <li>O sistema solicitará a alteração da senha temporária</li>
                <li>Escolha uma senha forte e única</li>
                <li>Mantenha suas credenciais em local seguro</li>
                <li>Nunca compartilhe suas credenciais com outras pessoas</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={copyAllCredentials}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Tudo'}</span>
                </button>
                
                {onPrint && (
                  <button
                    onClick={() => onPrint(credentials)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </button>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialsModal;