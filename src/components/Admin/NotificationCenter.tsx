import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { AlertRuleEditor } from './AlertRuleEditor';
import { NotificationHistory } from './NotificationHistory';
import { ChannelManager } from './ChannelManager';
import { 
  NotificationRule, 
  NotificationChannel, 
  NotificationStatus,
  AlertSeverity 
} from '../../types/notifications';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const {
    rules,
    channels,
    notifications,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    createChannel,
    updateChannel,
    deleteChannel,
    testChannel,
    getNotificationHistory
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'channels' | 'history'>('overview');
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [showChannelManager, setShowChannelManager] = useState(false);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'info': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: NotificationStatus): string => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTestChannel = async (channel: NotificationChannel) => {
    try {
      const result = await testChannel(channel.id);
      if (result.success) {
        alert('Teste de canal enviado com sucesso!');
      } else {
        alert(`Erro no teste: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao testar canal:', error);
      alert('Erro ao testar canal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Centro de Notificações</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie alertas, regras e canais de comunicação
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowChannelManager(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Gerenciar Canais
            </button>
            <button
              onClick={() => setShowRuleEditor(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Nova Regra
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'rules', label: 'Regras de Alerta' },
            { id: 'channels', label: 'Canais' },
            { id: 'history', label: 'Histórico' }
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Regras Ativas</p>
                    <p className="text-2xl font-semibold text-blue-600">
                      {rules.filter(r => r.isActive).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Canais Ativos</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {channels.filter(c => c.isActive).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Alertas Hoje</p>
                    <p className="text-2xl font-semibold text-yellow-600">
                      {notifications.filter(n => 
                        new Date(n.createdAt).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Falhas</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {notifications.filter(n => n.status === 'failed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Alertas Recentes</h3>
              <div className="space-y-3">
                {notifications.slice(0, 5).map(notification => (
                  <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(notification.severity)}
                      <div>
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum alerta recente
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Regras de Alerta</h3>
              <button
                onClick={() => setShowRuleEditor(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Nova Regra
              </button>
            </div>

            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                            {rule.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            Canais: {rule.channels.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowRuleEditor(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {rules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM12 12l8-8M4 4l16 16" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma regra configurada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Crie regras para automatizar alertas e notificações
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Canais de Comunicação</h3>
              <button
                onClick={() => setShowChannelManager(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Novo Canal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map(channel => (
                <div key={channel.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${channel.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {channel.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleTestChannel(channel)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Testar
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedChannel(channel);
                          setShowChannelManager(true);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteChannel(channel.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {channels.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum canal configurado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure canais para envio de notificações
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <NotificationHistory notifications={notifications} />
        )}
      </div>

      {/* Modals */}
      {showRuleEditor && (
        <AlertRuleEditor
          rule={selectedRule}
          channels={channels}
          onSave={async (data) => {
            if (selectedRule) {
              await updateRule(selectedRule.id, data);
            } else {
              await createRule(data);
            }
            setShowRuleEditor(false);
            setSelectedRule(null);
          }}
          onCancel={() => {
            setShowRuleEditor(false);
            setSelectedRule(null);
          }}
        />
      )}

      {showChannelManager && (
        <ChannelManager
          channel={selectedChannel}
          onSave={async (data) => {
            if (selectedChannel) {
              await updateChannel(selectedChannel.id, data);
            } else {
              await createChannel(data);
            }
            setShowChannelManager(false);
            setSelectedChannel(null);
          }}
          onCancel={() => {
            setShowChannelManager(false);
            setSelectedChannel(null);
          }}
        />
      )}
    </div>
  );
};