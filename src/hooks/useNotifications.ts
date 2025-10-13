import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';
import { 
  NotificationRule,
  NotificationChannel,
  Notification,
  NotificationStats,
  NotificationsHook,
  ChannelTestResult
} from '../types/notifications';

export const useNotifications = (): NotificationsHook => {
  const { empresa, user } = useMultitenantAuth();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    activeRules: 0,
    activeChannels: 0,
    alertsToday: 0,
    criticalAlertsToday: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Carregar regras
      const { data: rulesData, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      // Carregar canais
      const { data: channelsData, error: channelsError } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (channelsError) throw channelsError;

      // Carregar notificações (últimas 1000)
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (notificationsError) throw notificationsError;

      setRules(rulesData || []);
      setChannels(channelsData || []);
      setNotifications(notificationsData || []);

      // Calcular estatísticas
      const today = new Date().toDateString();
      const todayNotifications = (notificationsData || []).filter(n => 
        new Date(n.created_at).toDateString() === today
      );

      setStats({
        totalSent: (notificationsData || []).filter(n => n.status === 'sent').length,
        totalFailed: (notificationsData || []).filter(n => n.status === 'failed').length,
        totalPending: (notificationsData || []).filter(n => n.status === 'pending').length,
        activeRules: (rulesData || []).filter(r => r.is_active).length,
        activeChannels: (channelsData || []).filter(c => c.is_active).length,
        alertsToday: todayNotifications.length,
        criticalAlertsToday: todayNotifications.filter(n => n.severity === 'critical').length
      });

    } catch (err) {
      console.error('Erro ao carregar dados de notificações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id]);

  // Criar regra
  const createRule = useCallback(async (ruleData: Partial<NotificationRule>) => {
    if (!empresa?.id || !user?.id) throw new Error('Empresa ou usuário não identificado');

    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .insert([{
          ...ruleData,
          empresa_id: empresa.id,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setRules(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar regra:', error);
      throw error;
    }
  }, [empresa?.id, user?.id]);

  // Atualizar regra
  const updateRule = useCallback(async (id: string, updates: Partial<NotificationRule>) => {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRules(prev => 
        prev.map(rule => 
          rule.id === id ? { ...rule, ...data } : rule
        )
      );

      return data;
    } catch (error) {
      console.error('Erro ao atualizar regra:', error);
      throw error;
    }
  }, []);

  // Deletar regra
  const deleteRule = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Erro ao deletar regra:', error);
      throw error;
    }
  }, []);

  // Criar canal
  const createChannel = useCallback(async (channelData: Partial<NotificationChannel>) => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .insert([{
          ...channelData,
          empresa_id: empresa.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setChannels(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar canal:', error);
      throw error;
    }
  }, [empresa?.id]);

  // Atualizar canal
  const updateChannel = useCallback(async (id: string, updates: Partial<NotificationChannel>) => {
    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setChannels(prev => 
        prev.map(channel => 
          channel.id === id ? { ...channel, ...data } : channel
        )
      );

      return data;
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      throw error;
    }
  }, []);

  // Deletar canal
  const deleteChannel = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChannels(prev => prev.filter(channel => channel.id !== id));
    } catch (error) {
      console.error('Erro ao deletar canal:', error);
      throw error;
    }
  }, []);

  // Testar canal
  const testChannel = useCallback(async (id: string): Promise<ChannelTestResult> => {
    const channel = channels.find(c => c.id === id);
    if (!channel) {
      throw new Error('Canal não encontrado');
    }

    try {
      const startTime = Date.now();
      
      // Simular teste baseado no tipo de canal
      const result = await performChannelTest(channel);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const testResult: ChannelTestResult = {
        success: result.success,
        responseTime,
        error: result.error,
        details: result.details
      };

      // Atualizar último uso do canal
      if (result.success) {
        await updateChannel(id, { 
          lastUsed: new Date().toISOString()
        });
      }

      return testResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [channels, updateChannel]);

  // Enviar notificação
  const sendNotification = useCallback(async (notificationData: Partial<Notification>) => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notificationData,
          empresa_id: empresa.id,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setNotifications(prev => [data, ...prev]);

      // Simular processamento da notificação
      setTimeout(async () => {
        const success = Math.random() > 0.1; // 90% de sucesso
        await supabase
          .from('notifications')
          .update({
            status: success ? 'sent' : 'failed',
            sent_at: success ? new Date().toISOString() : undefined,
            failure_reason: success ? undefined : 'Erro simulado no envio'
          })
          .eq('id', data.id);

        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => 
            n.id === data.id 
              ? { 
                  ...n, 
                  status: success ? 'sent' : 'failed',
                  sentAt: success ? new Date().toISOString() : undefined,
                  failureReason: success ? undefined : 'Erro simulado no envio'
                }
              : n
          )
        );
      }, 2000);

      return data;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }, [empresa?.id]);

  // Obter histórico de notificações
  const getNotificationHistory = useCallback(async (filters?: any): Promise<Notification[]> => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }, [empresa?.id]);

  // Reenviar notificação
  const retryNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'pending',
          retry_count: supabase.raw('COALESCE(retry_count, 0) + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === id 
            ? { ...n, status: 'pending', retryCount: (n.retryCount || 0) + 1 }
            : n
        )
      );

      // Simular reprocessamento
      setTimeout(async () => {
        const success = Math.random() > 0.2; // 80% de sucesso no retry
        await supabase
          .from('notifications')
          .update({
            status: success ? 'sent' : 'failed',
            sent_at: success ? new Date().toISOString() : undefined,
            failure_reason: success ? undefined : 'Erro no reenvio'
          })
          .eq('id', id);

        setNotifications(prev => 
          prev.map(n => 
            n.id === id 
              ? { 
                  ...n, 
                  status: success ? 'sent' : 'failed',
                  sentAt: success ? new Date().toISOString() : undefined,
                  failureReason: success ? undefined : 'Erro no reenvio'
                }
              : n
          )
        );
      }, 1000);

    } catch (error) {
      console.error('Erro ao reenviar notificação:', error);
      throw error;
    }
  }, []);

  // Função auxiliar para testar canal
  const performChannelTest = async (channel: NotificationChannel): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    // Simular teste baseado no tipo de canal
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const success = Math.random() > 0.15; // 85% de chance de sucesso
    
    if (success) {
      return { 
        success: true, 
        details: { 
          message: 'Teste enviado com sucesso',
          timestamp: new Date().toISOString()
        } 
      };
    } else {
      const errors = [
        'Credenciais inválidas',
        'Servidor indisponível',
        'Timeout na conexão',
        'Configuração incorreta'
      ];
      return { 
        success: false, 
        error: errors[Math.floor(Math.random() * errors.length)]
      };
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    rules,
    channels,
    notifications,
    stats,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    createChannel,
    updateChannel,
    deleteChannel,
    testChannel,
    sendNotification,
    getNotificationHistory,
    retryNotification,
    refreshData: loadData
  };
};