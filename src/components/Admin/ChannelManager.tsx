import React, { useState, useEffect } from 'react';
import { NotificationChannel, ChannelType } from '../../types/notifications';

interface ChannelManagerProps {
  channel?: NotificationChannel | null;
  onSave: (data: Partial<NotificationChannel>) => Promise<void>;
  onCancel: () => void;
}

export const ChannelManager: React.FC<ChannelManagerProps> = ({
  channel,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email' as ChannelType,
    isActive: true,
    config: {} as Record<string, any>
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (channel) {
      setFormData({
        name: channel.name,
        description: channel.description,
        type: channel.type,
        isActive: channel.isActive,
        config: channel.config
      });
    }
  }, [channel]);

  const channelTypes: { value: ChannelType; label: string; description: string }[] = [
    { 
      value: 'email', 
      label: 'Email', 
      description: 'Envio de notificações por email' 
    },
    { 
      value: 'sms', 
      label: 'SMS', 
      description: 'Envio de mensagens de texto' 
    },
    { 
      value: 'webhook', 
      label: 'Webhook', 
      description: 'Chamadas HTTP para sistemas externos' 
    },
    { 
      value: 'slack', 
      label: 'Slack', 
      description: 'Mensagens no Slack' 
    },
    { 
      value: 'teams', 
      label: 'Microsoft Teams', 
      description: 'Mensagens no Microsoft Teams' 
    },
    { 
      value: 'whatsapp', 
      label: 'WhatsApp', 
      description: 'Mensagens via WhatsApp Business API' 
    },
    { 
      value: 'push', 
      label: 'Push Notification', 
      description: 'Notificações push para dispositivos móveis' 
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Validações específicas por tipo de canal
    switch (formData.type) {
      case 'email':
        if (!formData.config.smtpHost) {
          newErrors.smtpHost = 'Servidor SMTP é obrigatório';
        }
        if (!formData.config.smtpPort) {
          newErrors.smtpPort = 'Porta SMTP é obrigatória';
        }
        if (!formData.config.fromEmail) {
          newErrors.fromEmail = 'Email remetente é obrigatório';
        }
        break;

      case 'sms':
        if (!formData.config.provider) {
          newErrors.provider = 'Provedor SMS é obrigatório';
        }
        if (!formData.config.apiKey) {
          newErrors.apiKey = 'API Key é obrigatória';
        }
        break;

      case 'webhook':
        if (!formData.config.url) {
          newErrors.url = 'URL do webhook é obrigatória';
        }
        break;

      case 'slack':
        if (!formData.config.webhookUrl) {
          newErrors.webhookUrl = 'Webhook URL do Slack é obrigatória';
        }
        break;

      case 'teams':
        if (!formData.config.webhookUrl) {
          newErrors.webhookUrl = 'Webhook URL do Teams é obrigatória';
        }
        break;

      case 'whatsapp':
        if (!formData.config.phoneNumberId) {
          newErrors.phoneNumberId = 'Phone Number ID é obrigatório';
        }
        if (!formData.config.accessToken) {
          newErrors.accessToken = 'Access Token é obrigatório';
        }
        break;

      case 'push':
        if (!formData.config.serverKey) {
          newErrors.serverKey = 'Server Key é obrigatória';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar canal:', error);
      setErrors({ general: 'Erro ao salvar canal de notificação' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={formData.config.smtpHost || ''}
                  onChange={(e) => updateConfig('smtpHost', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.smtpHost ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="smtp.gmail.com"
                />
                {errors.smtpHost && <p className="text-red-600 text-sm mt-1">{errors.smtpHost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porta SMTP
                </label>
                <input
                  type="number"
                  value={formData.config.smtpPort || ''}
                  onChange={(e) => updateConfig('smtpPort', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.smtpPort ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="587"
                />
                {errors.smtpPort && <p className="text-red-600 text-sm mt-1">{errors.smtpPort}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Remetente
              </label>
              <input
                type="email"
                value={formData.config.fromEmail || ''}
                onChange={(e) => updateConfig('fromEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fromEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="noreply@clube.com"
              />
              {errors.fromEmail && <p className="text-red-600 text-sm mt-1">{errors.fromEmail}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário SMTP
                </label>
                <input
                  type="text"
                  value={formData.config.smtpUser || ''}
                  onChange={(e) => updateConfig('smtpUser', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha SMTP
                </label>
                <input
                  type="password"
                  value={formData.config.smtpPassword || ''}
                  onChange={(e) => updateConfig('smtpPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.config.useTLS || false}
                  onChange={(e) => updateConfig('useTLS', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">Usar TLS</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.config.useSSL || false}
                  onChange={(e) => updateConfig('useSSL', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">Usar SSL</span>
              </label>
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provedor SMS
              </label>
              <select
                value={formData.config.provider || ''}
                onChange={(e) => updateConfig('provider', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.provider ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um provedor</option>
                <option value="twilio">Twilio</option>
                <option value="nexmo">Nexmo/Vonage</option>
                <option value="aws_sns">AWS SNS</option>
                <option value="zenvia">Zenvia</option>
              </select>
              {errors.provider && <p className="text-red-600 text-sm mt-1">{errors.provider}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData.config.apiKey || ''}
                onChange={(e) => updateConfig('apiKey', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apiKey ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.apiKey && <p className="text-red-600 text-sm mt-1">{errors.apiKey}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número Remetente
              </label>
              <input
                type="text"
                value={formData.config.fromNumber || ''}
                onChange={(e) => updateConfig('fromNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+5511999999999"
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Webhook
              </label>
              <input
                type="url"
                value={formData.config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.url ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://api.exemplo.com/webhook"
              />
              {errors.url && <p className="text-red-600 text-sm mt-1">{errors.url}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método HTTP
              </label>
              <select
                value={formData.config.method || 'POST'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers Customizados (JSON)
              </label>
              <textarea
                value={formData.config.headers ? JSON.stringify(formData.config.headers, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    updateConfig('headers', headers);
                  } catch (error) {
                    // Ignorar erro de parsing durante digitação
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              />
            </div>
          </div>
        );

      case 'slack':
      case 'teams':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.config.webhookUrl || ''}
                onChange={(e) => updateConfig('webhookUrl', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.webhookUrl ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={`https://hooks.${formData.type}.com/...`}
              />
              {errors.webhookUrl && <p className="text-red-600 text-sm mt-1">{errors.webhookUrl}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canal/Sala Padrão
              </label>
              <input
                type="text"
                value={formData.config.defaultChannel || ''}
                onChange={(e) => updateConfig('defaultChannel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#alertas"
              />
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                value={formData.config.phoneNumberId || ''}
                onChange={(e) => updateConfig('phoneNumberId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phoneNumberId ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumberId && <p className="text-red-600 text-sm mt-1">{errors.phoneNumberId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={formData.config.accessToken || ''}
                onChange={(e) => updateConfig('accessToken', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accessToken ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.accessToken && <p className="text-red-600 text-sm mt-1">{errors.accessToken}</p>}
            </div>
          </div>
        );

      case 'push':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server Key (FCM)
              </label>
              <input
                type="password"
                value={formData.config.serverKey || ''}
                onChange={(e) => updateConfig('serverKey', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.serverKey ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.serverKey && <p className="text-red-600 text-sm mt-1">{errors.serverKey}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bundle ID / Package Name
              </label>
              <input
                type="text"
                value={formData.config.bundleId || ''}
                onChange={(e) => updateConfig('bundleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="com.clube.app"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {channel ? 'Editar Canal' : 'Novo Canal de Notificação'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Canal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Email Administradores"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Canal
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as ChannelType,
                    config: {} // Reset config when changing type
                  }));
                  setErrors({}); // Clear errors
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {channelTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">
                {channelTypes.find(t => t.value === formData.type)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva o propósito deste canal"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">Canal Ativo</span>
              </label>
            </div>
          </div>

          {/* Configurações Específicas */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Configurações do {channelTypes.find(t => t.value === formData.type)?.label}
            </h4>
            {renderConfigFields()}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Salvando...' : 'Salvar Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};