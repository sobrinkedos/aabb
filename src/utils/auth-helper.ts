import { supabase, supabaseAdmin } from '../lib/supabase';

/**
 * Helper function to ensure user is authenticated before making database operations
 * This is a temporary solution until the full authentication flow is properly implemented
 */
export const ensureAuthenticated = async () => {
  try {
    // Check if user is already authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('✅ User already authenticated:', session.user.email);
      return { success: true, user: session.user };
    }

    console.log('⚠️ No active session found. Using admin client for database operations.');
    return { success: true, user: null, useAdmin: true };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

/**
 * Get the current user's empresa_id
 */
export const getCurrentUserEmpresaId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.warn('⚠️ No authenticated user found');
      return null;
    }

    // Query the usuarios_empresa table to get the empresa_id
    const { data, error } = await (supabase as any)
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('user_id', session.user.id)
      .eq('ativo', true) // Apenas usuários ativos
      .limit(1);

    if (error) {
      console.error('❌ Error getting empresa_id:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No empresa found for user:', session.user.id);
      return null;
    }

    const empresaId = data[0]?.empresa_id;
    console.log('✅ User empresa_id:', empresaId);
    return empresaId || null;
  } catch (error) {
    console.error('❌ Error in getCurrentUserEmpresaId:', error);
    return null;
  }
};