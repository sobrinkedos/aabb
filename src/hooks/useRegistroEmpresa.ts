import { useState } from 'react';
import { RegistroEmpresaData } from '../types/multitenant';
import { RegistroEmpresaService, RegistroResult } from '../services/registroEmpresaService';

export interface UseRegistroEmpresaReturn {
  isLoading: boolean;
  error: string | null;
  registrarEmpresa: (dados: RegistroEmpresaData) => Promise<RegistroResult>;
  clearError: () => void;
}

export function useRegistroEmpresa(): UseRegistroEmpresaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrarEmpresa = async (dados: RegistroEmpresaData): Promise<RegistroResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const resultado = await RegistroEmpresaService.registrarEmpresa(dados);
      
      if (!resultado.success) {
        setError(resultado.error || 'Erro desconhecido');
      }

      return resultado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno do servidor';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    registrarEmpresa,
    clearError
  };
}