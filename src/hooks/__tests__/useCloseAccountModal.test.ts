/**
 * Testes para useCloseAccountModal hook
 */

import { renderHook, act } from '@testing-library/react';
import { useCloseAccountModal } from '../useCloseAccountModal';
import { Command, ComandaStatus, CloseAccountData } from '../../types/sales-management';

describe('useCloseAccountModal', () => {
  const mockComanda: Command = {
    id: 'CMD0001-123456',
    funcionario_id: 'func-123',
    status: ComandaStatus.ABERTA,
    total: 150.00,
    quantidade_pessoas: 4,
    aberta_em: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  const mockCloseAccountData: CloseAccountData = {
    comanda_id: 'CMD0001-123456',
    valor_base: 150.00,
    percentual_comissao: 10,
    valor_comissao: 15.00,
    valor_total: 165.00,
    metodo_pagamento: 'dinheiro'
  };

  describe('Estado inicial', () => {
    it('deve inicializar com valores padrão', () => {
      const { result } = renderHook(() => useCloseAccountModal());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedComanda).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('openModal', () => {
    it('deve abrir modal com comanda selecionada', () => {
      const { result } = renderHook(() => useCloseAccountModal());

      act(() => {
        result.current.openModal(mockComanda);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.selectedComanda).toBe(mockComanda);
      expect(result.current.error).toBe(null);
    });

    it('deve limpar erro ao abrir modal', () => {
      const { result } = renderHook(() => useCloseAccountModal());

      // Simular erro existente
      act(() => {
        result.current.handleConfirm(mockCloseAccountData);
      });

      // Abrir modal deve limpar erro
      act(() => {
        result.current.openModal(mockComanda);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('closeModal', () => {
    it('deve fechar modal e resetar estado', () => {
      const { result } = renderHook(() => useCloseAccountModal());

      // Abrir modal primeiro
      act(() => {
        result.current.openModal(mockComanda);
      });

      // Fechar modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedComanda).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('deve limpar erro', () => {
      const { result } = renderHook(() => useCloseAccountModal());

      // Simular erro
      act(() => {
        result.current.handleConfirm(mockCloseAccountData);
      });

      // Limpar erro
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('handleConfirm', () => {
    it('deve processar confirmação com sucesso', async () => {
      const onSuccess = vi.fn();
      const processPayment = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCloseAccountModal({ onSuccess, processPayment })
      );

      // Abrir modal
      act(() => {
        result.current.openModal(mockComanda);
      });

      // Confirmar
      await act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      expect(processPayment).toHaveBeenCalledWith(mockCloseAccountData);
      expect(onSuccess).toHaveBeenCalledWith(mockCloseAccountData);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('deve gerenciar estado de loading', async () => {
      const processPayment = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => 
        useCloseAccountModal({ processPayment })
      );

      act(() => {
        result.current.openModal(mockComanda);
      });

      // Iniciar confirmação
      const confirmPromise = act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      // Verificar loading durante processamento
      expect(result.current.loading).toBe(true);

      // Aguardar conclusão
      await confirmPromise;

      expect(result.current.loading).toBe(false);
    });

    it('deve tratar erros durante processamento', async () => {
      const onError = vi.fn();
      const processPayment = vi.fn().mockRejectedValue(new Error('Erro de pagamento'));

      const { result } = renderHook(() => 
        useCloseAccountModal({ onError, processPayment })
      );

      act(() => {
        result.current.openModal(mockComanda);
      });

      await act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      expect(result.current.error).toBe('Erro de pagamento');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(result.current.isOpen).toBe(true); // Modal deve permanecer aberto em caso de erro
      expect(result.current.loading).toBe(false);
    });

    it('deve tratar erros não-Error', async () => {
      const processPayment = vi.fn().mockRejectedValue('String de erro');

      const { result } = renderHook(() => 
        useCloseAccountModal({ processPayment })
      );

      act(() => {
        result.current.openModal(mockComanda);
      });

      await act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      expect(result.current.error).toBe('Erro desconhecido');
    });

    it('deve funcionar sem processPayment customizado', async () => {
      const onSuccess = vi.fn();

      const { result } = renderHook(() => 
        useCloseAccountModal({ onSuccess })
      );

      act(() => {
        result.current.openModal(mockComanda);
      });

      await act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockCloseAccountData);
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Integração completa', () => {
    it('deve gerenciar fluxo completo de abertura, processamento e fechamento', async () => {
      const onSuccess = vi.fn();
      const processPayment = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCloseAccountModal({ onSuccess, processPayment })
      );

      // Estado inicial
      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedComanda).toBe(null);

      // Abrir modal
      act(() => {
        result.current.openModal(mockComanda);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.selectedComanda).toBe(mockComanda);

      // Processar confirmação
      await act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      // Verificar estado final
      expect(processPayment).toHaveBeenCalledWith(mockCloseAccountData);
      expect(onSuccess).toHaveBeenCalledWith(mockCloseAccountData);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedComanda).toBe(null);
    });

    it('deve permitir múltiplas operações', async () => {
      const onSuccess = vi.fn();
      const processPayment = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => 
        useCloseAccountModal({ onSuccess, processPayment })
      );

      // Primeira operação
      act(() => {
        result.current.openModal(mockComanda);
      });

      await act(async () => {
        await result.current.handleConfirm(mockCloseAccountData);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);

      // Segunda operação
      const mockComanda2 = { ...mockComanda, id: 'CMD0002-789012' };
      
      act(() => {
        result.current.openModal(mockComanda2);
      });

      await act(async () => {
        await result.current.handleConfirm({
          ...mockCloseAccountData,
          comanda_id: 'CMD0002-789012'
        });
      });

      expect(onSuccess).toHaveBeenCalledTimes(2);
      expect(processPayment).toHaveBeenCalledTimes(2);
    });
  });
});