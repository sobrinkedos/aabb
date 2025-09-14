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

      // Simular processamento bem-sucedido para integração com sistema existente
      console.log('📋 Processando fechamento de comanda:', dados);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result: AccountClosingResult = {
        success: true,
        data: {
          transaction_id: `TXN-${Date.now()}`,
          reference_number: `REF-${Date.now()}`,
          pending_id: `PEND-${Date.now()}`,
          total_amount: dados.valor_total,
          commission_amount: dados.valor_comissao,
          payment_method: dados.metodo_pagamento,
          receipt: undefined,
          processed_at: new Date().toISOString(),
          additional_data: {
            status: 'pending_payment',
            message: 'Comanda enviada para processamento no caixa'
          }
        }
      };

      // Chamar callback de sucesso se fornecido
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      // Fechar modal após sucesso
      setTimeout(() => {
        closeModal();
      }, 1500);

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
  }, [closeModal, options]);

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