// Configurações do Supabase

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Validação das credenciais
export const isValidSupabaseUrl = (url: string): boolean => {
  return url && url !== 'https://your-project.supabase.co' && url.includes('.supabase.co');
};

export const isValidSupabaseKey = (key: string, placeholder: string): boolean => {
  return key && key !== placeholder && key.length > 20;
};

export const isSupabaseFullyConfigured = (): boolean => {
  return (
    isValidSupabaseUrl(SUPABASE_CONFIG.url) &&
    isValidSupabaseKey(SUPABASE_CONFIG.anonKey, 'your-anon-key-here') &&
    isValidSupabaseKey(SUPABASE_CONFIG.serviceRoleKey || '', 'your-service-role-key-here')
  );
};

export const isSupabaseBasicConfigured = (): boolean => {
  return (
    isValidSupabaseUrl(SUPABASE_CONFIG.url) &&
    isValidSupabaseKey(SUPABASE_CONFIG.anonKey, 'your-anon-key-here')
  );
};