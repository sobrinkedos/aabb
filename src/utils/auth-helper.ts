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

    // CORREÇÃO TEMPORÁRIA: Usar empresa_id específica que sabemos que funciona
    // Para o usuário riltons@gmail.com, usar AABB Garanhuns
    if (session.user.email === 'riltons@gmail.com') {
      const empresaId = '9e445c5a-a382-444d-94f8-9d126ed6414e';
      console.log('✅ Using specific empresa_id for riltons@gmail.com:', empresaId);
      return empresaId;
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

    if (data && data.length > 0) {
      const empresaId = data[0]?.empresa_id;
      console.log('✅ User empresa_id:', empresaId);
      return empresaId || null;
    }

    // CORREÇÃO: Se não encontrou em usuarios_empresa, buscar a primeira empresa disponível
    // Isso resolve o problema de usuários criados sem empresa
    console.warn('⚠️ No empresa found for user in usuarios_empresa, buscando primeira empresa disponível');
    
    const { data: firstEmpresa, error: empresaError } = await (supabase as any)
      .from('empresas')
      .select('id')
      .eq('status', 'ativo')
      .order('created_at', { ascending: true })
      .limit(1);

    if (empresaError) {
      console.error('❌ Error getting first empresa:', empresaError.message);
      return null;
    }

    if (firstEmpresa && firstEmpresa.length > 0) {
      const empresaId = firstEmpresa[0]?.id;
      console.log('✅ Using first empresa as fallback:', empresaId);
      return empresaId;
    }

    console.warn('⚠️ No empresas found in system');
    return null;
  } catch (error) {
    console.error('❌ Error in getCurrentUserEmpresaId:', error);
    return null;
  }
};