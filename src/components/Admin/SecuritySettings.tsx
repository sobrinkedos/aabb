import React, { useState } from 'react';
import { SecurityPolicy, PasswordPolicy, AccessPolicy } from '../../types/backup-security';

interface SecuritySettingsProps {
  policies: SecurityPolicy[];
  onClose?: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ policies, onClose }) => {
  const [activeTab, setActiveTab] = useState<'password' | 'access' | 'encryption' | 'audit'>('password');
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90,
    preventReuse: 5,
    lockoutAttempts: 5,
    lockoutDuration: 30
  });

  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy>({
    maxSessionDuration: 480,
    requireMFA: false,
    allowedIPs: [],
    blockedIPs: [],
    maxConcurrentSessions: 3,
    sessionTimeout: 30
  });

  const handleSavePasswordPolicy = () => {
    console.log('Salvando política de senha:', passwordPolicy);
    alert('Política de senha salva com sucesso!');
  };

  const handleSaveAccessPolicy = () => {
    console.log('Salvando política de acesso:', accessPolicy);
    alert('Política de acesso salva com sucesso!');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${onClose ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' : ''}`}>
      <div className={`bg-white rounded-lg ${onClose ? 'max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto' : ''}`}>
        {onClose && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'password', label: 'Políticas de Senha' },
              { id: 'access', label: 'Controle de Acesso' },
              { id: 'encryption', label: 'Criptografia' },
              { id: 'audit', label: 'Auditoria' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Políticas de Senha</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprimento Mínimo
                  </label>
                  <input
                    type="number"
                    value={passwordPolicy.minLength}
                    onChange={(e) => setPasswordPolicy(prev => ({ ...prev, minLength: parseInt(e.target.value) }))}
                    min="4"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idade Máxima (dias)
                  </label>
                  <input
                    type="number"
                    value={passwordPolicy.maxAge}
                    onChange={(e) => setPasswordPolicy(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tentativas de Login
                  </label>
                  <input
                    type="number"
                    value={passwordPolicy.lockoutAttempts}
                    onChange={(e) => setPasswordPolicy(prev => ({ ...prev, lockoutAttempts: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração do Bloqueio (min)
                  </label>
                  <input
                    type="number"
                    value={passwordPolicy.lockoutDuration}
                    onChange={(e) => setPasswordPolicy(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                    min="1"
                    max="1440"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Requisitos de Complexidade</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireUppercase}
                      onChange={(e) => setPasswordPolicy(prev => ({ ...prev, requireUppercase: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Letras maiúsculas</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireLowercase}
                      onChange={(e) => setPasswordPolicy(prev => ({ ...prev, requireLowercase: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Letras minúsculas</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireNumbers}
                      onChange={(e) => setPasswordPolicy(prev => ({ ...prev, requireNumbers: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Números</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireSpecialChars}
                      onChange={(e) => setPasswordPolicy(prev => ({ ...prev, requireSpecialChars: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Caracteres especiais</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSavePasswordPolicy}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar Política de Senha
              </button>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Controle de Acesso</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração Máxima da Sessão (min)
                  </label>
                  <input
                    type="number"
                    value={accessPolicy.maxSessionDuration}
                    onChange={(e) => setAccessPolicy(prev => ({ ...prev, maxSessionDuration: parseInt(e.target.value) }))}
                    min="5"
                    max="1440"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout de Inatividade (min)
                  </label>
                  <input
                    type="number"
                    value={accessPolicy.sessionTimeout}
                    onChange={(e) => setAccessPolicy(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    min="1"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sessões Simultâneas Máximas
                  </label>
                  <input
                    type="number"
                    value={accessPolicy.maxConcurrentSessions}
                    onChange={(e) => setAccessPolicy(prev => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={accessPolicy.requireMFA}
                      onChange={(e) => setAccessPolicy(prev => ({ ...prev, requireMFA: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Exigir Autenticação Multi-Fator</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveAccessPolicy}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar Política de Acesso
              </button>
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Configurações de Criptografia</h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Status da Criptografia</h5>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Dados em repouso: AES-256 ativo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Transmissão: TLS 1.3 ativo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Backups: Criptografia ativa</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Algoritmo de Criptografia
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="AES-256">AES-256</option>
                    <option value="AES-192">AES-192</option>
                    <option value="AES-128">AES-128</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotação de Chaves (dias)
                  </label>
                  <input
                    type="number"
                    defaultValue={90}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Salvar Configurações de Criptografia
              </button>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Configurações de Auditoria</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Log
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="minimal">Mínimo</option>
                    <option value="standard">Padrão</option>
                    <option value="detailed">Detalhado</option>
                    <option value="verbose">Verboso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retenção de Logs (dias)
                  </label>
                  <input
                    type="number"
                    defaultValue={365}
                    min="30"
                    max="2555"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Eventos Auditados</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Login/Logout',
                    'Alterações de usuário',
                    'Alterações de permissão',
                    'Acesso a dados sensíveis',
                    'Operações de backup',
                    'Configurações do sistema',
                    'Tentativas de acesso negado',
                    'Operações administrativas'
                  ].map(event => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Salvar Configurações de Auditoria
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};