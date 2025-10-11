import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ModuloSistema, PermissaoModulo } from '../types/multitenant';

interface PermissoesCache {
  [usuarioId: string]: {
    permissoes: Record<ModuloSistema, PermissaoModulo>;
    timestamp: number;
    ttl: number; // Time to live em ms
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const permissoesCache: PermissoesCache = {};

export interface UsePermissoesCacheReturn {
  permissoes: Record<ModuloSistema, PermissaoModulo>;
  isLoading: boolean;
  error: string | null;
  verificarPermissao: (modulo: ModuloSistema, acao: keyof PermissaoModulo) => boolean;
  recarregarPermissoes: () => Promise<void>;
  invalidarCache: () => void;
}

export function usePermissoesCache(usuarioEmpresaId?: string): UsePermissoesCacheReturn {
  const [permissoes, setPermissoes] = useState<Record<ModuloSistema, PermissaoModulo>>({} as Record<ModuloSistema, PermissaoModulo>);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarPermissoes = useCallback(async () => {
    if (!usuarioEmpresaId) {
      setPermissoes({} as Record<ModuloSistema, PermissaoModulo>);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cacheKey = usuarioEmpresaId;
      const cached = permissoesCache[cacheKey];
      const now = Date.now();

      if (cached && (now - cached.timestamp) < cached.ttl) {
        setPermissoes(cached.permissoes);
        setIsLoading(false);
        return;
      }

      // Carregar do banco de dados
      const { data, error: dbError } = await supabase
        .from('permissoes_usuario')
        .select('modulo, permissoes')
        .eq('usuario_empresa_id', usuarioEmpresaId);

      if (dbError) {
        console.error('Erro ao carregar permissões:', dbError);
        setError(dbError.message);
        return;
      }

      // Converter para formato do hook
      const permissoesMap = {} as Record<ModuloSistema, PermissaoModulo>;
      
      data?.forEach(item => {
        const modulo = item.modulo as ModuloSistema;
        permissoesMap[modulo] = item.permissoes as PermissaoModulo;
      });

      // Atualizar cache
      permissoesCache[cacheKey] = {
        permissoes: permissoesMap,
        timestamp: now,
        ttl: CACHE_TTL
      };

      setPermissoes(permissoesMap);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [usuarioEmpresaId]);

  useEffect(() => {
    carregarPermissoes();
  }, [carregarPermissoes]);

  const verificarPermissao = useCallback((modulo: ModuloSistema, acao: keyof PermissaoModulo): boolean => {
    const permissaoModulo = permissoes[modulo];
    if (!permissaoModulo) return false;
    
    return permissaoModulo[acao] || false;
  }, [permissoes]);

  const recarregarPermissoes = useCallback(async () => {
    // Invalidar cache e recarregar
    if (usuarioEmpresaId) {
      delete permissoesCache[usuarioEmpresaId];
    }
    await carregarPermissoes();
  }, [usuarioEmpresaId, carregarPermissoes]);

  const invalidarCache = useCallback(() => {
    if (usuarioEmpresaId) {
      delete permissoesCache[usuarioEmpresaId];
    }
  }, [usuarioEmpresaId]);

  return {
    permissoes,
    isLoading,
    error,
    verificarPermissao,
    recarregarPermissoes,
    invalidarCache
  };
}

// Função utilitária para limpar todo o cache
export function limparCachePermissoes(): void {
  Object.keys(permissoesCache).forEach(key => {
    delete permissoesCache[key];
  });
}

// Função utilitária para invalidar cache de um usuário específico
export function invalidarCacheUsuario(usuarioEmpresaId: string): void {
  delete permissoesCache[usuarioEmpresaId];
}