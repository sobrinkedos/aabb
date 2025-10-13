/**
 * Hook para cache de permissões de usuários
 * Reduz consultas desnecessárias ao Supabase
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface PermissionCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
}

export const usePermissionsCache = () => {
  const [cache, setCache] = useState<PermissionCache>({});
  const statsRef = useRef<CacheStats>({ hits: 0, misses: 0, totalRequests: 0 });
  
  // TTL padrão: 5 minutos
  const DEFAULT_TTL = 5 * 60 * 1000;
  
  /**
   * Gerar chave única para cache
   */
  const generateCacheKey = useCallback((type: string, params: Record<string, any>) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${type}:${sortedParams}`;
  }, []);
  
  /**
   * Verificar se item do cache é válido
   */
  const isCacheValid = useCallback((cacheItem: any) => {
    if (!cacheItem) return false;
    const now = Date.now();
    return (now - cacheItem.timestamp) < cacheItem.ttl;
  }, []);
  
  /**
   * Buscar permissões de usuário com cache
   */
  const getUserPermissions = useCallback(async (userId: string, empresaId?: string) => {
    const cacheKey = generateCacheKey('user_permissions', { userId, empresaId });
    const cached = cache[cacheKey];
    
    statsRef.current.totalRequests++;
    
    // Verificar cache
    if (isCacheValid(cached)) {
      console.log('🎯 Cache HIT - Permissões do usuário:', userId);
      statsRef.current.hits++;
      return cached.data;
    }
    
    console.log('🔍 Cache MISS - Buscando permissões do servidor:', userId);
    statsRef.current.misses++;
    
    try {
      // Buscar do servidor
      const { data: usuarioEmpresa, error: userError } = await supabase
        .from('usuarios_empresa')
        .select('id, user_id, nome_completo, email, papel, tem_acesso_sistema')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .maybeSingle();
      
      if (userError) throw userError;
      
      let permissions = [];
      
      if (usuarioEmpresa) {
        // Buscar permissões específicas
        const { data: permissoesData, error: permError } = await supabase
          .from('permissoes_usuario')
          .select('modulo, permissoes')
          .eq('usuario_empresa_id', usuarioEmpresa.id);
        
        if (permError) throw permError;
        permissions = permissoesData || [];
      }
      
      const result = {
        usuario: usuarioEmpresa,
        permissions
      };
      
      // Atualizar cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: result,
          timestamp: Date.now(),
          ttl: DEFAULT_TTL
        }
      }));
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar permissões:', error);
      return null;
    }
  }, [cache, generateCacheKey, isCacheValid]);
  
  /**
   * Buscar lista de usuários com cache
   */
  const getUsers = useCallback(async (empresaId: string, filters: Record<string, any> = {}) => {
    const cacheKey = generateCacheKey('users_list', { empresaId, ...filters });
    const cached = cache[cacheKey];
    
    statsRef.current.totalRequests++;
    
    // Verificar cache
    if (isCacheValid(cached)) {
      console.log('🎯 Cache HIT - Lista de usuários');
      statsRef.current.hits++;
      return cached.data;
    }
    
    console.log('🔍 Cache MISS - Buscando usuários do servidor');
    statsRef.current.misses++;
    
    try {
      let query = supabase
        .from('usuarios_empresa')
        .select('id, user_id, nome_completo, email, cargo, status, tem_acesso_sistema')
        .eq('empresa_id', empresaId)
        .order('nome_completo');
      
      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Atualizar cache com TTL menor para listas (2 minutos)
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: data || [],
          timestamp: Date.now(),
          ttl: 2 * 60 * 1000 // 2 minutos
        }
      }));
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return [];
    }
  }, [cache, generateCacheKey, isCacheValid]);
  
  /**
   * Invalidar cache específico
   */
  const invalidateCache = useCallback((pattern?: string) => {
    if (!pattern) {
      // Limpar todo o cache
      setCache({});
      console.log('🗑️ Cache completamente limpo');
      return;
    }
    
    // Limpar cache que corresponde ao padrão
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.includes(pattern)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
    
    console.log(`🗑️ Cache invalidado para padrão: ${pattern}`);
  }, []);
  
  /**
   * Invalidar cache de usuário específico
   */
  const invalidateUserCache = useCallback((userId: string) => {
    invalidateCache(`user_permissions:userId:${userId}`);
  }, [invalidateCache]);
  
  /**
   * Invalidar cache de lista de usuários
   */
  const invalidateUsersCache = useCallback((empresaId: string) => {
    invalidateCache(`users_list:empresaId:${empresaId}`);
  }, [invalidateCache]);
  
  /**
   * Obter estatísticas do cache
   */
  const getCacheStats = useCallback(() => {
    const stats = statsRef.current;
    const hitRate = stats.totalRequests > 0 ? (stats.hits / stats.totalRequests) * 100 : 0;
    
    return {
      ...stats,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: Object.keys(cache).length
    };
  }, [cache]);
  
  /**
   * Limpar cache expirado
   */
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        const item = newCache[key];
        if ((now - item.timestamp) >= item.ttl) {
          delete newCache[key];
          cleanedCount++;
        }
      });
      return newCache;
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} itens expirados removidos do cache`);
    }
  }, []);
  
  return {
    // Métodos principais
    getUserPermissions,
    getUsers,
    
    // Gerenciamento de cache
    invalidateCache,
    invalidateUserCache,
    invalidateUsersCache,
    cleanExpiredCache,
    
    // Estatísticas
    getCacheStats
  };
};

export default usePermissionsCache;