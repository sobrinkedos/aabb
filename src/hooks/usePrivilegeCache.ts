import { useState, useEffect, useCallback } from 'react';
import { useHierarchicalAuth } from '../contexts/HierarchicalAuthContext';
import { PapelUsuario, PrivilegiosAdmin } from '../types/multitenant';

interface PrivilegeCache {
  papel: PapelUsuario | null;
  privilegios: PrivilegiosAdmin;
  categoriasAcessiveis: string[];
  papeisGerenciaveis: PapelUsuario[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para cache de privilégios com invalidação automática
 */
export function usePrivilegeCache() {
  const { 
    papel, 
    privilegios, 
    getCategoriasAcessiveis, 
    getPapeisGerenciaveis,
    recarregarDados 
  } = useHierarchicalAuth();
  
  const [cache, setCache] = useState<PrivilegeCache | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Verificar se o cache é válido
  const isCacheValid = useCallback((cache: PrivilegeCache | null): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    const isExpired = (now - cache.timestamp) > CACHE_DURATION;
    const isPapelChanged = cache.papel !== papel;
    
    return !isExpired && !isPapelChanged;
  }, [papel]);

  // Atualizar cache
  const updateCache = useCallback(() => {
    if (!papel) {
      setCache(null);
      return;
    }

    const newCache: PrivilegeCache = {
      papel,
      privilegios,
      categoriasAcessiveis: getCategoriasAcessiveis(),
      papeisGerenciaveis: getPapeisGerenciaveis(),
      timestamp: Date.now()
    };

    setCache(newCache);
  }, [papel, privilegios, getCategoriasAcessiveis, getPapeisGerenciaveis]);

  // Invalidar cache e recarregar dados
  const invalidateCache = useCallback(async () => {
    setIsValidating(true);
    setCache(null);
    
    try {
      await recarregarDados();
    } catch (error) {
      console.error('Erro ao revalidar privilégios:', error);
    } finally {
      setIsValidating(false);
    }
  }, [recarregarDados]);

  // Efeito para atualizar cache quando dados mudarem
  useEffect(() => {
    if (!isCacheValid(cache)) {
      updateCache();
    }
  }, [papel, privilegios, cache, isCacheValid, updateCache]);

  // Verificar privilégio usando cache
  const verificarPrivilegio = useCallback((privilegio: keyof PrivilegiosAdmin): boolean => {
    if (!cache || !isCacheValid(cache)) {
      // Fallback para dados atuais se cache inválido
      return privilegios[privilegio] || false;
    }
    
    return cache.privilegios[privilegio] || false;
  }, [cache, isCacheValid, privilegios]);

  // Verificar se pode acessar categoria usando cache
  const podeAcessarCategoria = useCallback((categoria: string): boolean => {
    if (!cache || !isCacheValid(cache)) {
      // Fallback para cálculo atual se cache inválido
      return getCategoriasAcessiveis().includes(categoria);
    }
    
    return cache.categoriasAcessiveis.includes(categoria);
  }, [cache, isCacheValid, getCategoriasAcessiveis]);

  // Verificar se pode gerenciar papel usando cache
  const podeGerenciarPapel = useCallback((papelAlvo: PapelUsuario): boolean => {
    if (!cache || !isCacheValid(cache)) {
      // Fallback para cálculo atual se cache inválido
      return getPapeisGerenciaveis().includes(papelAlvo);
    }
    
    return cache.papeisGerenciaveis.includes(papelAlvo);
  }, [cache, isCacheValid, getPapeisGerenciaveis]);

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    if (!cache) {
      return {
        isValid: false,
        age: 0,
        papel: null,
        privilegiosCount: 0,
        categoriasCount: 0,
        papeisCount: 0
      };
    }

    const age = Date.now() - cache.timestamp;
    const privilegiosAtivos = Object.values(cache.privilegios).filter(Boolean).length;

    return {
      isValid: isCacheValid(cache),
      age,
      papel: cache.papel,
      privilegiosCount: privilegiosAtivos,
      categoriasCount: cache.categoriasAcessiveis.length,
      papeisCount: cache.papeisGerenciaveis.length
    };
  }, [cache, isCacheValid]);

  return {
    // Estado do cache
    cache,
    isValidating,
    isCacheValid: cache ? isCacheValid(cache) : false,
    
    // Métodos de verificação com cache
    verificarPrivilegio,
    podeAcessarCategoria,
    podeGerenciarPapel,
    
    // Controle do cache
    invalidateCache,
    updateCache,
    getCacheStats,
    
    // Dados atuais (fallback)
    papel,
    privilegios
  };
}