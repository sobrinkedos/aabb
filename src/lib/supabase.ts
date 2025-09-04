import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Verificar se as credenciais são válidas (não são placeholders)
const isValidCredentials = (
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl.includes('.supabase.co')
);

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
  isValidCredentials ? supabaseAnonKey : mockKey
);

// Export flag para componentes verificarem se estão em modo mock
export const isSupabaseConfigured = isValidCredentials;
