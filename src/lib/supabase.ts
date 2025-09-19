import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { SUPABASE_CONFIG, isSupabaseBasicConfigured, isSupabaseFullyConfigured } from '../config/supabase';

const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey: supabaseServiceRoleKey } = SUPABASE_CONFIG;

// Verificar se as credenciais básicas são válidas
const isValidCredentials = isSupabaseBasicConfigured();

// Verificar se a service role key está disponível
const hasServiceRoleKey = isSupabaseFullyConfigured();

if (!isValidCredentials) {
  console.warn('⚠️ Supabase credentials not configured. Using mock mode for development.');
  console.info('📝 To use real Supabase:')
  console.info('1. Update .env.local with your Supabase credentials');
  console.info('2. Get credentials from: https://supabase.com/dashboard');
}

// Criar cliente Supabase mesmo com credenciais inválidas para evitar erros
// O sistema detectará e usará dados mock quando necessário
const mockUrl = 'https://mock.supabase.co';
const mockKey = 'mock-anon-key';

export const supabase = createClient<Database>(
  isValidCredentials ? supabaseUrl : mockUrl,
  isValidCredentials ? supabaseAnonKey : mockKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Cliente admin para operações administrativas (criar usuários, etc.)
export const supabaseAdmin = createClient<Database>(
  isValidCredentials ? supabaseUrl : mockUrl,
  isValidCredentials && hasServiceRoleKey ? supabaseServiceRoleKey : mockKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Export flags para componentes verificarem configuração
export const isSupabaseConfigured = isValidCredentials;
export const isAdminConfigured = isValidCredentials && hasServiceRoleKey;
