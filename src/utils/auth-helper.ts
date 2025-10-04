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
 * Get the current user's empresa_id de forma robusta
 * Prioriza a consulta ao banco, mas mantém fallbacks seguros
 */
export const getCurrentUserEmpresaId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.warn('⚠️ No authenticated user found');
      return null;
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    
    console.log(`🔍 Buscando empresa_id para usuário: ${userEmail} (${userId})`);

    // 1. PRIORIDADE: Buscar na tabela usuarios_empresa
    const { data, error } = await (supabase as any)
      .from('usuarios_empresa')
      .select('empresa_id, nome_completo, cargo')
      .eq('user_id', userId)
      .eq('ativo', true)
      .limit(1);

    if (error) {
      console.error('❌ Error getting empresa_id from usuarios_empresa:', error.message);
    } else if (data && data.length > 0) {
      const empresaId = data[0]?.empresa_id;
      console.log(`✅ Empresa ID encontrado em usuarios_empresa: ${empresaId}`);
      console.log(`👤 Dados do usuário: ${data[0]?.nome_completo} - ${data[0]?.cargo}`);
      return empresaId || null;
    }

    // 2. FALLBACK: Buscar empresas onde o email_admin é o email do usuário
    console.warn('⚠️ Usuário não encontrado em usuarios_empresa, tentando via email_admin');
    
    const { data: empresaByEmail, error: emailError } = await (supabase as any)
      .from('empresas')
      .select('id, nome')
      .eq('email_admin', userEmail)
      .eq('status', 'ativo')
      .limit(1);

    if (emailError) {
      console.error('❌ Error getting empresa by email:', emailError.message);
    } else if (empresaByEmail && empresaByEmail.length > 0) {
      const empresaId = empresaByEmail[0]?.id;
      const nomeEmpresa = empresaByEmail[0]?.nome;
      console.log(`✅ Empresa encontrada via email_admin: ${empresaId} (${nomeEmpresa})`);
      
      // AUTO-CORREÇÃO: Tentar criar registro em usuarios_empresa se não existir
      try {
        await (supabase as any)
          .from('usuarios_empresa')
          .insert({
            user_id: userId,
            empresa_id: empresaId,
            nome_completo: session.user.user_metadata?.name || userEmail?.split('@')[0] || 'Usuário',
            email: userEmail,
            tipo_usuario: 'administrador',
            cargo: 'Administrador',
            status: 'ativo',
            ativo: true,
            tem_acesso_sistema: true
          });
        console.log(`✅ Registro criado em usuarios_empresa para ${userEmail}`);
      } catch (insertError) {
        console.warn('⚠️ Não foi possível criar registro em usuarios_empresa:', insertError);
      }
      
      return empresaId;
    }

    // 3. ÚLTIMO FALLBACK: Primeira empresa ativa (COM LOG DE ALERTA)
    console.warn('⚠️ FALLBACK DE EMERGÊNCIA: Buscando primeira empresa ativa');
    console.warn(`⚠️ USUÁRIO SEM EMPRESA: ${userEmail} não está associado a nenhuma empresa`);
    
    const { data: firstEmpresa, error: empresaError } = await (supabase as any)
      .from('empresas')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('created_at', { ascending: true })
      .limit(1);

    if (empresaError) {
      console.error('❌ Error getting first empresa:', empresaError.message);
      return null;
    }

    if (firstEmpresa && firstEmpresa.length > 0) {
      const empresaId = firstEmpresa[0]?.id;
      const nomeEmpresa = firstEmpresa[0]?.nome;
      console.warn(`⚠️ USANDO FALLBACK DE EMERGÊNCIA: ${empresaId} (${nomeEmpresa})`);
      console.warn(`⚠️ AÇÃO REQUERIDA: Associar usuário ${userEmail} à empresa correta`);
      return empresaId;
    }

    console.error('❌ ERRO CRÍTICO: Nenhuma empresa encontrada no sistema');
    return null;
  } catch (error) {
    console.error('❌ Error in getCurrentUserEmpresaId:', error);
    return null;
  }
};

/**
 * Garante que um usuário está associado a uma empresa
 * Deve ser chamado após criação de novos usuários
 */
export const ensureUserHasEmpresa = async (userId: string, userEmail: string, empresaId?: string): Promise<boolean> => {
  try {
    console.log(`🔒 Garantindo associação de empresa para usuário: ${userEmail}`);
    
    // Verificar se o usuário já tem empresa associada
    const { data: existingUser } = await (supabase as any)
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('user_id', userId)
      .limit(1);
    
    if (existingUser && existingUser.length > 0) {
      console.log(`✅ Usuário ${userEmail} já tem empresa associada: ${existingUser[0].empresa_id}`);
      return true;
    }
    
    // Determinar empresa_id
    let targetEmpresaId = empresaId;
    
    if (!targetEmpresaId) {
      // Buscar empresa por email_admin
      const { data: empresaByEmail } = await (supabase as any)
        .from('empresas')
        .select('id')
        .eq('email_admin', userEmail)
        .eq('status', 'ativo')
        .limit(1);
      
      if (empresaByEmail && empresaByEmail.length > 0) {
        targetEmpresaId = empresaByEmail[0].id;
      } else {
        // Usar primeira empresa ativa como fallback
        const { data: firstEmpresa } = await (supabase as any)
          .from('empresas')
          .select('id')
          .eq('status', 'ativo')
          .order('created_at', { ascending: true })
          .limit(1);
        
        if (firstEmpresa && firstEmpresa.length > 0) {
          targetEmpresaId = firstEmpresa[0].id;
          console.warn(`⚠️ FALLBACK: Associando ${userEmail} à primeira empresa: ${targetEmpresaId}`);
        }
      }
    }
    
    if (!targetEmpresaId) {
      console.error(`❌ Não foi possível determinar empresa para ${userEmail}`);
      return false;
    }
    
    // Criar associação
    const { error } = await (supabase as any)
      .from('usuarios_empresa')
      .insert({
        user_id: userId,
        empresa_id: targetEmpresaId,
        nome_completo: userEmail?.split('@')[0] || 'Usuário',
        email: userEmail,
        tipo_usuario: 'funcionario',
        cargo: 'Funcionário',
        status: 'ativo',
        ativo: true,
        tem_acesso_sistema: true
      });
    
    if (error) {
      console.error(`❌ Erro ao associar usuário ${userEmail} à empresa:`, error);
      return false;
    }
    
    console.log(`✅ Usuário ${userEmail} associado à empresa ${targetEmpresaId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro em ensureUserHasEmpresa para ${userEmail}:`, error);
    return false;
  }
};

/**
 * Valida se o empresaId fornecido pertence ao usuário atual
 */
export const validateUserEmpresaAccess = async (empresaId: string): Promise<boolean> => {
  try {
    const userEmpresaId = await getCurrentUserEmpresaId();
    
    if (!userEmpresaId) {
      console.warn('⚠️ Usuário não tem empresa associada');
      return false;
    }
    
    const hasAccess = userEmpresaId === empresaId;
    
    if (!hasAccess) {
      console.warn(`🚫 Acesso negado: usuário (${userEmpresaId}) tentou acessar empresa (${empresaId})`);
    }
    
    return hasAccess;
  } catch (error) {
    console.error('❌ Erro ao validar acesso à empresa:', error);
    return false;
  }
};