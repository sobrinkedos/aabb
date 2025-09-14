/**
 * Hook para gerenciar o modal de fechamento de conta
 * 
 * Centraliza a lógica de estado e processamento do fechamento de contas,
 * incluindo cálculos de comissão e integração com sistemas de pagamento
 */

import { useState, useCallback } from 'react';
import { 
  Command, 
  CloseAccountData, 
  AccountClosingResult
} from '../types/sales-management';
import { AccountClosingService } from '../services/account-closing-service';

interface UseCloseAccountModalReturn {
  isOpen: boolean;
  selectedComanda: Command | null;
  loading: boolean;
  error: string | null;
  openModal: (comanda: Command) => void;
  closeModal: () => void;
  handleConfirm: (dados: CloseAccountData) => Promise<AccountClosingResult>;
  clearError: () => void;
}

interface UseCloseAccountModalOptions {
  onSuccess?: (result: AccountClosingResult) => void;
  onError?: (error: Error) => void;
}

export const useCloseAccountModal = (
  options: UseCloseAccountModalOptions = {}
): UseCloseAccountModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Command | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const accountClosingService = AccountClosingService.getInstance();

  const openModal = useCallback((comanda: Command) => {
    setSelectedComanda(comanda);
    setIsOpen(true);
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedComanda(null);
    setError(null);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleConfirm = useCallback(async (dados: CloseAccountData): Promise<AccountClosingResult> => {
    try {
      setLoading(true);
      setError(null);

      // Validar se pode processar o fechamento
      const validation = await accountClosingService.validateAccountClosing(dados);
      
      if (!validation.can_process) {
        const errorMessage = validation.errors.join('; ');
        setError(errorMessage);
        return {
          success: false,
          error: {
            type: 'validation',
            message: errorMessage,
            details: { errors: validation.errors }
          }
        };
      }

      // Mostrar avisos se houver
      if (validation.warnings.length > 0) {
        console.warn('Avisos no fechamento:', validation.warnings);
      }

      // Processar fechamento através do serviço integrado
      const result = await accountClosingService.processAccountClosing(dados, 'current-operator');

      if (result.success) {
        // Chamar callback de sucesso se fornecido
        if (options.onSuccess) {
          options.onSuccess(result);
        }

        // Fechar modal após sucesso
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(result.error.message);
        
        // Chamar callback de erro se fornecido
        if (options.onError) {
          options.onError(new Error(result.error.message));
        }
      }

      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro interno do sistema');
      setError(error.message);
      
      // Chamar callback de erro se fornecido
      if (options.onError) {
        options.onError(error);
      }
      
      return {
        success: false,
        error: {
          type: 'system',
          message: error.message,
          details: { error: error instanceof Error ? error.stack : String(error) }
        }
      };
    } finally {
      setLoading(false);
    }
  }, [accountClosingService, closeModal, options]);

  return {
    isOpen,
    selectedComanda,
    loading,
    error,
    openModal,
    closeModal,
    handleConfirm,
    clearError
  };
};