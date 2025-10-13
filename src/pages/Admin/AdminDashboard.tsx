import React, { useState } from 'react';
import { UserManagementPanel } from '../../components/Admin/UserManagementPanel';
import { useMultitenantAuth } from '../../contexts/MultitenantAuthContextSimple';
import { PermissionGuard } from '../../components/Auth/PermissionGuard';
import { ModuloSistema } from '../../types/multitenant';

export const AdminDashboard: React.FC = () => {
  const { user, empresa } = useMultitenantAuth();
  const [activeSection, setActiveSection] = useState<'users' | 'settings' | 'security' | 'reports'>('users');

  const sections = [
    {
      key: 'users' as const,
      name: 'Usuários e Permissões',
      description: 'Gerencie usuários, funções e permissões',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      permission: 'administrar'
    },
    {
      key: 'settings' as const,
      name: 'Configurações do Sistema',
      description: 'Configure parâmetros gerais e integrações',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      permission: 'administrar'
    },
    {
      key: 'security' as const,
      name: 'Segurança e Auditoria',
      description: 'Monitore segurança e logs do sistema',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      permission: 'administrar'
    },
    {
      key: 'reports' as const,
      name: 'Relatórios e Analytics',
      description: 'Visualize métricas e gere relatórios',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      permission: 'visualizar'
    }
  ];

  return (
    <PermissionGuard
      module={ModuloSistema.CONFIGURACOES}
      permission="visualizar"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {empresa?.nome} • Painel de controle administrativo
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Logado como: <span className="font-medium text-gray-900">{user?.nome_completo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-2">
                {sections.map(section => (
                  <PermissionGuard
                    key={section.key}
                    module={ModuloSistema.CONFIGURACOES}
                    permission={section.permission}
                  >
                    <button
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeSection === section.key
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${
                        activeSection === section.key ? 'text-blue-500' : 'text-gray-400'
                      }`}>
                        {section.icon}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                      </div>
                    </button>
                  </PermissionGuard>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Status do Sistema</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Usuários Ativos</span>
                    <span className="text-sm font-medium text-green-600">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Último Backup</span>
                    <span className="text-sm font-medium text-gray-900">Hoje</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Uptime</span>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Alertas</span>
                    <span className="text-sm font-medium text-yellow-600">2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {activeSection === 'users' && (
                <UserManagementPanel />
              )}

              {activeSection === 'settings' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações do Sistema</h2>
                  <p className="text-gray-600">
                    Esta seção será implementada nas próximas tarefas e incluirá:
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li>• Configurações gerais do clube</li>
                    <li>• Integrações externas</li>
                    <li>• Notificações e alertas</li>
                    <li>• Personalização da interface</li>
                  </ul>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Segurança e Auditoria</h2>
                  <p className="text-gray-600">
                    Esta seção será implementada nas próximas tarefas e incluirá:
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li>• Backup e restauração</li>
                    <li>• Políticas de segurança</li>
                    <li>• Logs de auditoria</li>
                    <li>• Monitoramento de ameaças</li>
                  </ul>
                </div>
              )}

              {activeSection === 'reports' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Relatórios e Analytics</h2>
                  <p className="text-gray-600">
                    Esta seção será implementada nas próximas tarefas e incluirá:
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li>• Relatórios personalizados</li>
                    <li>• Métricas de performance</li>
                    <li>• Analytics de uso</li>
                    <li>• Dashboards executivos</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};