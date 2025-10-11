/**
 * Utilitário para limpar tokens corrompidos do localStorage
 * Use este utilitário quando houver problemas com tokens de refresh inválidos
 */

export const clearSupabaseTokens = () => {
  try {
    // Limpar todos os tokens relacionados ao Supabase
    const keysToRemove = [];
    
    // Verificar todas as chaves do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase')) {
        keysToRemove.push(key);
      }
    }
    
    // Remover as chaves encontradas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Token removido: ${key}`);
    });
    
    console.log(`✅ ${keysToRemove.length} tokens do Supabase foram limpos`);
    
    // Recarregar a página para aplicar as mudanças
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erro ao limpar tokens:', error);
  }
};

// Função para verificar se há tokens corrompidos
export const checkForCorruptedTokens = () => {
  try {
    const supabaseKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase')) {
        supabaseKeys.push(key);
      }
    }
    
    console.log('🔍 Tokens do Supabase encontrados:', supabaseKeys);
    
    supabaseKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        if (value) {
          JSON.parse(value);
          console.log(`✅ Token válido: ${key}`);
        }
      } catch {
        console.log(`❌ Token corrompido: ${key}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar tokens:', error);
  }
};

// Exportar para uso global no console do navegador
if (typeof window !== 'undefined') {
  (window as any).clearSupabaseTokens = clearSupabaseTokens;
  (window as any).checkForCorruptedTokens = checkForCorruptedTokens;
}