/**
 * Componente de Ajuda para Credenciais Mock
 * Mostra as credenciais disponíveis quando em modo mock
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Users, Info } from 'lucide-react';
import { mockAuth } from '../../services/mockAuth';

interface MockCredentialsHelperProps {
  onCredentialSelect?: (email: string, password: string) => void;
}

export const MockCredentialsHelper: React.FC<MockCredentialsHelperProps> = ({ 
  onCredentialSelect 
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const availableUsers = mockAuth.getAvailableUsers();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleCredentialClick = (email: string, password: string) => {
    if (onCredentialSelect) {
      onCredentialSelect(email, password);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <Info className="text-blue-600 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-blue-800 font-medium mb-2">
            Modo Demonstração Ativo
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            O sistema está funcionando em modo mock. Use uma das credenciais abaixo para testar:
          </p>
          
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 text-sm font-medium mb-3"
          >
            {showCredentials ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showCredentials ? 'Ocultar' : 'Ver'} credenciais disponíveis</span>
          </button>

          {showCredentials && (
            <div className="space-y-3">
              {availableUsers.map((user, index) => (
                <div 
                  key={user.email}
                  className="bg-white rounded border p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-gray-500" />
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </div>
                    
                    {onCredentialSelect && (
                      <button
                        onClick={() => handleCredentialClick(user.email, user.password)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Usar
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 min-w-[60px]">Email:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded flex-1 font-mono text-xs">
                        {user.email}
                      </code>
                      <button
                        onClick={() => copyToClipboard(user.email, `email-${index}`)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copiar email"
                      >
                        {copiedField === `email-${index}` ? 
                          <Check size={14} className="text-green-500" /> : 
                          <Copy size={14} />
                        }
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 min-w-[60px]">Senha:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded flex-1 font-mono text-xs">
                        {user.password}
                      </code>
                      <button
                        onClick={() => copyToClipboard(user.password, `password-${index}`)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copiar senha"
                      >
                        {copiedField === `password-${index}` ? 
                          <Check size={14} className="text-green-500" /> : 
                          <Copy size={14} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 <strong>Dica:</strong> Configure suas credenciais reais do Supabase nos arquivos .env para sair do modo mock
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockCredentialsHelper;