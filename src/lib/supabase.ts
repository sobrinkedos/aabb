import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { environmentManager, EnvironmentConfig } from '../config/environment';

// Variáveis globais para os clientes Supabase
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;
let currentConfig: EnvironmentConfig | null = null;

// Função para criar cliente Supabase com configuração do ambiente
const createSupabaseClient = (config: EnvironmentConfig, isAdmin = false): SupabaseClient<Database> => {
  const key = isAdmin ? config.supabaseServiceRoleKey : config.supabaseAnonKey;
  
  // Verifica se as configurações são válidas (não são placeholders)
  const isValidUrl = config.supabaseUrl && 
                    config.supabaseUrl !== 'https://your-project-dev.supabase.co' &&
                    config.supabaseUrl !== 'https://your-project-prod.supabase.co';
  
  const isValidKey = key && 
                    key !== 'your_development_anon_key_here' &&
                    key !== 'your_production_anon_key_here' &&
                    key !== 'your_development_service_role_key_here' &&
                    key !== 'your_production_service_role_key_here';

  if (!isValidUrl || !isValidKey) {
    console.warn(`⚠️ Configuração do Supabase não definida para ambiente ${config.name}. Usando cliente mock.`);
    // Retorna cliente mock para evitar erros
    return createClient<Database>('https://mock.supabase.co', 'mock-key');
  }

  return createClient<Database>(config.supabaseUrl, key, {
    auth: {
      autoRefreshToken: !isAdmin,
      persistSession: !isAdmin,
      detectSessionInUrl: !isAdmin,
      storageKey: `sb-${config.databaseName}-${isAdmin ? 'admin' : 'auth'}-token`
    }
  });
};

// Função para inicializar os clientes Supabase
const initializeSupabaseClients = (): void => {
  try {
    const config = environmentManager.getCurrentEnvironment();
    
    // Só recria os clientes se a configuração mudou
    if (!currentConfig || currentConfig.name !== config.name || currentConfig.supabaseUrl !== config.supabaseUrl) {
      console.log(`🔧 Inicializando clientes Supabase para ambiente: ${config.name}`);
      
      supabaseInstance = createSupabaseClient(config, false);
      supabaseAdminInstance = createSupabaseClient(config, true);
      currentConfig = config;
      
      console.log(`✅ Clientes Supabase configurados para: ${config.databaseName}`);
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar clientes Supabase:', error);
    
    // Cria clientes mock em caso de erro
    supabaseInstance = createClient<Database>('https://mock.supabase.co', 'mock-key');
    supabaseAdminInstance = createClient<Database>('https://mock.supabase.co', 'mock-key');
  }
};

// Inicializa imediatamente
initializeSupabaseClients();

// Getter para o cliente Supabase principal
export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    initializeSupabaseClients();
  }
  return supabaseInstance!;
};

// Getter para o cliente admin
export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (!supabaseAdminInstance) {
    initializeSupabaseClients();
  }
  return supabaseAdminInstance!;
};

// Cliente Supabase principal (exportação direta)
export const supabase = getSupabase();

// Cliente admin (exportação direta)
export const supabaseAdmin = getSupabaseAdmin();

// Função para forçar reinicialização (útil para troca de ambiente)
export const reinitializeSupabase = (): void => {
  supabaseInstance = null;
  supabaseAdminInstance = null;
  currentConfig = null;
  initializeSupabaseClients();
};

// Função para verificar se está configurado
export const isSupabaseConfigured = (): boolean => {
  try {
    const config = environmentManager.getCurrentEnvironment();
    
    // Verifica se as configurações são válidas (não são placeholders)
    const isValidUrl = config.supabaseUrl && 
                      config.supabaseUrl !== 'https://your-project-dev.supabase.co' &&
                      config.supabaseUrl !== 'https://your-project-prod.supabase.co' &&
                      config.supabaseUrl !== 'https://mock.supabase.co';
    
    const isValidKey = config.supabaseAnonKey && 
                      config.supabaseAnonKey !== 'your_development_anon_key_here' &&
                      config.supabaseAnonKey !== 'your_production_anon_key_here' &&
                      config.supabaseAnonKey !== 'mock-anon-key';

    return !!(isValidUrl && isValidKey);
  } catch {
    return false;
  }
};

// Função para verificar se admin está configurado
export const isAdminConfigured = (): boolean => {
  try {
    const config = environmentManager.getCurrentEnvironment();
    
    // Verifica se as configurações são válidas (não são placeholders)
    const isValidUrl = config.supabaseUrl && 
                      config.supabaseUrl !== 'https://your-project-dev.supabase.co' &&
                      config.supabaseUrl !== 'https://your-project-prod.supabase.co' &&
                      config.supabaseUrl !== 'https://mock.supabase.co';
    
    const isValidAnonKey = config.supabaseAnonKey && 
                          config.supabaseAnonKey !== 'your_development_anon_key_here' &&
                          config.supabaseAnonKey !== 'your_production_anon_key_here' &&
                          config.supabaseAnonKey !== 'mock-anon-key';

    const isValidServiceKey = config.supabaseServiceRoleKey && 
                             config.supabaseServiceRoleKey !== 'your_development_service_role_key_here' &&
                             config.supabaseServiceRoleKey !== 'your_production_service_role_key_here' &&
                             config.supabaseServiceRoleKey !== 'mock-service-role-key';

    return !!(isValidUrl && isValidAnonKey && isValidServiceKey);
  } catch {
    return false;
  }
}
