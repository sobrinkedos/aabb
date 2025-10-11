import React, { useState, useEffect } from 'react';
import { 
  NotificationRule, 
  NotificationChannel, 
  AlertSeverity, 
  AlertCondition,
  AlertAction 
} from '../../types/notifications';

interface AlertRuleEditorProps {
  rule?: NotificationRule | null;
  channels: NotificationChannel[];
  onSave: (data: Partial<NotificationRule>) => Promise<void>;
  onCancel: () => void;
}

export const AlertRuleEditor: React.FC<AlertRuleEditorProps> = ({
  rule,
  channels,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'medium' as AlertSeverity,
    isActive: true,
    conditions: [] as AlertCondition[],
    actions: [] as AlertAction[],
    channels: [] as string[],
    escalationRules: {
      enabled: false,
      timeoutMinutes: 30,
      escalationChannels: [] as string[]
    },
    cooldownMinutes: 60,
    maxAlertsPerHour: 10
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        isActive: rule.isActive,
        conditions: rule.conditions,
        actions: rule.actions,
        channels: rule.channels,
        escalationRules: rule.escalationRules || {
          enabled: false,
          timeoutMinutes: 30,
          escalationChannels: []
        },
        cooldownMinutes: rule.cooldownMinutes || 60,
        maxAlertsPerHour: rule.maxAlertsPerHour || 10
      });
    }
  }, [rule]);

  const severityOptions: { value: AlertSeverity; label: string; color: string }[] = [
    { value: 'critical', label: 'Crítico', color: 'text-red-600' },
    { value: 'high', label: 'Alto', color: 'text-orange-600' },
    { value: 'medium', label: 'Médio', color: 'text-yellow-600' },
    { value: 'low', label: 'Baixo', color: 'text-blue-600' },
    { value: 'info', label: 'Informativo', color: 'text-gray-600' }
  ];

  const conditionTypes = [
    { value: 'metric_threshold', label: 'Limite de Métrica' },
    { value: 'error_rate', label: 'Taxa de Erro' },
    { value: 'response_time', label: 'Tempo de Resposta' },
    { value: 'user_activity', label: 'Atividade de Usuário' },
    { value: 'system_event', label: 'Evento do Sistema' },
    { value: 'custom_query', label: 'Consulta Personalizada' }
  ];

  const operators = [
    { value: 'greater_than', label: 'Maior que' },
    { value: 'less_than', label: 'Menor que' },
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'contains', label: 'Contém' },
    { value: 'not_contains', label: 'Não contém' }
  ];

  const actionTypes = [
    { value: 'send_notification', label: 'Enviar Notificação' },
    { value: 'create_ticket', label: 'Criar Ticket' },
    { value: 'execute_webhook', label: 'Executar Webhook' },
    { value: 'run_script', label: 'Executar Script' },
    { value: 'pause_system', label: 'Pausar Sistema' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'Pelo menos uma condição é obrigatória';
    }

    if (formData.channels.length === 0) {
      newErrors.channels = 'Pelo menos um canal é obrigatório';
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
      console.error('Erro ao salvar regra:', error);
      setErrors({ general: 'Erro ao salvar regra de alerta' });
    } finally {
      setIsLoading(false);
    }
  };

  const addCondition = () => {
    const newCondition: AlertCondition = {
      id: Date.now().toString(),
      type: 'metric_threshold',
      field: '',
      operator: 'greater_than',
      value: '',
      timeWindow: 5
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (index: number, field: keyof AlertCondition, value: any) => {
    const updatedConditions = [...formData.conditions];
    updatedConditions[index] = { ...updatedConditions[index], [field]: value };
    setFormData(prev => ({ ...prev, conditions: updatedConditions }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    const newAction: AlertAction = {
      id: Date.now().toString(),
      type: 'send_notification',
      config: {}
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (index: number, field: keyof AlertAction, value: any) => {
    const updatedActions = [...formData.actions];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    setFormData(prev => ({ ...prev, actions: updatedActions }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {rule ? 'Editar Regra de Alerta' : 'Nova Regra de Alerta'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Regra
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: CPU Alto"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severidade
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as AlertSeverity }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {severityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
              placeholder="Descreva quando esta regra deve ser acionada"
            />
          </div>

          {/* Condições */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Condições de Disparo
              </label>
              <button
                type="button"
                onClick={addCondition}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Adicionar Condição
              </button>
            </div>
            {errors.conditions && <p className="text-red-600 text-sm mb-2">{errors.conditions}</p>}
            
            <div className="space-y-3">
              {formData.conditions.map((condition, index) => (
                <div key={condition.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <select
                        value={condition.type}
                        onChange={(e) => updateCondition(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {conditionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        placeholder="Campo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Valor"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={condition.timeWindow}
                        onChange={(e) => updateCondition(index, 'timeWindow', parseInt(e.target.value))}
                        placeholder="Min"
                        min="1"
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">min</span>
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Ações a Executar
              </label>
              <button
                type="button"
                onClick={addAction}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Adicionar Ação
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {actionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canais */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canais de Notificação
            </label>
            {errors.channels && <p className="text-red-600 text-sm mb-2">{errors.channels}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {channels.map(channel => (
                <label key={channel.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          channels: [...prev.channels, channel.id]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          channels: prev.channels.filter(id => id !== channel.id)
                        }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">{channel.name}</span>
                  <span className="text-xs text-gray-500">({channel.type})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Configurações Avançadas</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooldown (minutos)
                </label>
                <input
                  type="number"
                  value={formData.cooldownMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Alertas/Hora
                </label>
                <input
                  type="number"
                  value={formData.maxAlertsPerHour}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAlertsPerHour: parseInt(e.target.value) }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Regra Ativa</span>
                </label>
              </div>
            </div>

            {/* Escalonamento */}
            <div className="mt-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.escalationRules.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    escalationRules: { ...prev.escalationRules, enabled: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-900">Habilitar Escalonamento</span>
              </label>

              {formData.escalationRules.enabled && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout para Escalonamento (minutos)
                    </label>
                    <input
                      type="number"
                      value={formData.escalationRules.timeoutMinutes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        escalationRules: { 
                          ...prev.escalationRules, 
                          timeoutMinutes: parseInt(e.target.value) 
                        }
                      }))}
                      min="1"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
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
              {isLoading ? 'Salvando...' : 'Salvar Regra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};