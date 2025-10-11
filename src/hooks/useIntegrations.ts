import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';
import { 
  Integration, 
  IntegrationsHook, 
  ConnectionTestResult, 
  SyncResult, 
  IntegrationLog,
  IntegrationError
} from '../types/integrations';

export const useIntegrations = (): IntegrationsHook => {
  const { empresa } = useMultitenantAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar integrações
  const loadIntegrations = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIntegrations(data || []);
    } catch (err) {
      console.error('Erro ao carregar integrações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [empresa?.id]);

  // Criar nova integração
  const createIntegration = useCallback(async (integrationData: Partial<Integration>) => {
    if (!empresa?.id) throw new Error('Empresa não identificada');

    try {
      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          ...integrationData,
          empresa_id: empresa.id,
          status: 'inactive',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar integração:', error);
      throw error;
    }
  }, [empresa?.id]);

  // Atualizar integração
  const updateIntegration = useCallback(async (id: string, updates: Partial<Integration>) => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? { ...integration, ...data } : integration
        )
      );

      return data;
    } catch (error) {
      console.error('Erro ao atualizar integração:', error);
      throw error;
    }
  }, []);

  // Deletar integração
  const deleteIntegration = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    } catch (error) {
      console.error('Erro ao deletar integração:', error);
      throw error;
    }
  }, []);

  // Testar conexão
  const testConnection = useCallback(async (id: string): Promise<ConnectionTestResult> => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    try {
      // Atualizar status para 'testing'
      await updateIntegration(id, { status: 'testing' });

      const startTime = Date.now();
      
      // Simular teste de conexão
      const testResult = await performConnectionTest(integration);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result: ConnectionTestResult = {
        success: testResult.success,
        responseTime,
        timestamp: new Date(),
        error: testResult.error,
        details: testResult.details
      };

      // Atualizar status baseado no resultado
      const newStatus = result.success ? 'connected' : 'error';
      await updateIntegration(id, { 
        status: newStatus,
        last_test: new Date().toISOString()
      });

      // Registrar log do teste
      await logIntegrationEvent(id, 'connection_test', result);

      return result;
    } catch (error) {
      await updateIntegration(id, { status: 'error' });
      throw error;
    }
  }, [integrations, updateIntegration]);

  // Sincronizar dados
  const syncData = useCallback(async (id: string): Promise<SyncResult> => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    if (integration.status !== 'connected') {
      throw new Error('Integração não está conectada');
    }

    try {
      const startTime = Date.now();
      
      // Simular sincronização de dados
      const recordsProcessed = Math.floor(Math.random() * 100) + 1;
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result: SyncResult = {
        success,
        recordsProcessed: success ? recordsProcessed : 0,
        duration,
        timestamp: new Date(),
        error: success ? undefined : 'Erro simulado na sincronização'
      };

      // Atualizar última sincronização
      await updateIntegration(id, { 
        lastSync: new Date().toISOString()
      });

      // Registrar log da sincronização
      await logIntegrationEvent(id, 'data_sync', result);

      return result;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }, [integrations, updateIntegration]);

  // Obter logs da integração
  const getIntegrationLogs = useCallback(async (id: string): Promise<IntegrationLog[]> => {
    try {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('integration_id', id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      return [];
    }
  }, []);

  // Função auxiliar para registrar eventos
  const logIntegrationEvent = async (
    integrationId: string, 
    eventType: string, 
    eventData: any
  ) => {
    try {
      await supabase
        .from('integration_logs')
        .insert([{
          integration_id: integrationId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  // Função auxiliar para testar conexão
  const performConnectionTest = async (integration: Integration): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> => {
    // Simular teste baseado no tipo de integração
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const success = Math.random() > 0.2; // 80% de chance de sucesso
    
    if (success) {
      return { 
        success: true, 
        details: { 
          status: 200, 
          message: 'Conexão estabelecida com sucesso' 
        } 
      };
    } else {
      return { 
        success: false, 
        error: 'Falha na conexão - timeout ou credenciais inválidas' 
      };
    }
  };

  // Carregar integrações ao montar o componente
  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  return {
    integrations,
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncData,
    getIntegrationLogs,
    refreshIntegrations: loadIntegrations
  };
      