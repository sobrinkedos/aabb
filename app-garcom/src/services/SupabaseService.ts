import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export class SupabaseService {
  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('mesas').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('Erro ao testar conexão com Supabase:', error);
      return false;
    }
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  static async signOut() {
    return await supabase.auth.signOut();
  }

  static async getUserProfile(userId: string) {
    try {
      // Buscar da tabela profiles (tabela correta do banco)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      // Buscar email do auth.users
      const { data: { user } } = await supabase.auth.getUser();
      
      return {
        ...data,
        email: user?.email || '',
      };
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<Record<string, unknown>>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      throw error;
    }
  }
}