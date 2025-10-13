/**
 * Testes para CloseAccountModal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CloseAccountModal } from '../CloseAccountModal';
import { Command, ComandaStatus, ItemStatus } from '../../../types/sales-management';

// Mock do CommissionCalculator
vi.mock('../../../utils/commission-calculator', () => ({
  CommissionCalculator: {
    calculateWithValidation: vi.fn((base: number, percentage: number) => ({
      valor_base: base,
      percentual_comissao: percentage,
      valor_comissao: (base * percentage) / 100,
      valor_total: base + (base * percentage) / 100,
      percentual_valido: percentage >= 0 && percentage <= 30
    })),
    formatCurrency: vi.fn((value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`),
    formatPercentage: vi.fn((value: number) => `${value.toFixed(1)}%`)
  }
}));

describe('CloseAccountModal', () => {
  const mockComanda: Command = {
    id: 'CMD0001-123456',
    funcionario_id: 'func-123',
    status: ComandaStatus.ABERTA,
    total: 150.00,
    quantidade_pessoas: 4,
    aberta_em: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    mesa: {
      id: 'mesa-05',
      numero: '05',
      capacidade: 4
    },
    itens: [
      {
        id: 'item-1',
        comanda_id: 'CMD0001-123456',
        produto_id: 'prod-123',
        nome_produto: 'Hambúrguer Clássico',
        quantidade: 2,
        preco_unitario: 25.90,
        preco_total: 51.80,
        status: ItemStatus.ENTREGUE,
        adicionado_em: '2024-01-15T10:05:00Z',
        created_at: '2024-01-15T10:05:00Z',
        observacoes: 'Sem cebola'
      },
      {
        id: 'item-2',
        comanda_id: 'CMD0001-123456',
        produto_id: 'prod-456',
        nome_produto: 'Batata Frita Grande',
        quantidade: 1,
        preco_unitario: 18.50,
        preco_total: 18.50,
        status: ItemStatus.ENTREGUE,
        adicionado_em: '2024-01-15T10:10:00Z',
        created_at: '2024-01-15T10:10:00Z'
      }
    ]
  };

  const defaultProps = {
    isOpen: true,
    comanda: mockComanda,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o modal quando aberto', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByText('Fechamento de Conta')).toBeInTheDocument();
      expect(screen.getByText('Comanda #CMD0001-123456 - Mesa 05')).toBeInTheDocument();
    });

    it('não deve renderizar quando fechado', () => {
      render(<CloseAccountModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Fechamento de Conta')).not.toBeInTheDocument();
    });

    it('deve exibir lista de itens consumidos', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByText('Itens Consumidos')).toBeInTheDocument();
      expect(screen.getByText('Hambúrguer Clássico')).toBeInTheDocument();
      expect(screen.getByText('Batata Frita Grande')).toBeInTheDocument();
      expect(screen.getByText('2x R$ 25,90')).toBeInTheDocument();
      expect(screen.getByText('(Sem cebola)')).toBeInTheDocument();
    });

    it('deve exibir mensagem quando não há itens', () => {
      const comandaSemItens = { ...mockComanda, itens: [] };
      render(<CloseAccountModal {...defaultProps} comanda={comandaSemItens} />);

      expect(screen.getByText('Nenhum item encontrado na comanda')).toBeInTheDocument();
    });
  });

  describe('Configuração de Comissão', () => {
    it('deve inicializar com percentual padrão de 10%', () => {
      render(<CloseAccountModal {...defaultProps} />);

      const input = screen.getByDisplayValue('10');
      expect(input).toBeInTheDocument();
    });

    it('deve atualizar percentual de comissão', async () => {
      render(<CloseAccountModal {...defaultProps} />);

      const input = screen.getByDisplayValue('10');
      fireEvent.change(input, { target: { value: '15' } });

      await waitFor(() => {
        expect(input).toHaveValue(15);
      });
    });

    it('deve exibir cálculo da comissão', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByText('Valor da comissão:')).toBeInTheDocument();
      expect(screen.getByText('Percentual aplicado:')).toBeInTheDocument();
    });

    it('deve validar percentual fora do limite', async () => {
      render(<CloseAccountModal {...defaultProps} />);

      const input = screen.getByDisplayValue('10');
      fireEvent.change(input, { target: { value: '35' } });

      // O mock retornará percentual_valido: false para valores > 30
      await waitFor(() => {
        expect(input).toHaveClass('border-red-300');
      });
    });
  });

  describe('Métodos de Pagamento', () => {
    it('deve exibir todos os métodos de pagamento', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByText('Dinheiro')).toBeInTheDocument();
      expect(screen.getByText('Cartão de Débito')).toBeInTheDocument();
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
      expect(screen.getByText('PIX')).toBeInTheDocument();
      expect(screen.getByText('Crédito de Membro')).toBeInTheDocument();
      expect(screen.getByText('Transferência')).toBeInTheDocument();
    });

    it('deve selecionar método de pagamento', async () => {
      render(<CloseAccountModal {...defaultProps} />);

      const pixButton = screen.getByText('PIX').closest('button');
      fireEvent.click(pixButton!);

      await waitFor(() => {
        expect(pixButton).toHaveClass('border-blue-500');
      });
    });

    it('deve inicializar com dinheiro selecionado', () => {
      render(<CloseAccountModal {...defaultProps} />);

      const dinheiroButton = screen.getByText('Dinheiro').closest('button');
      expect(dinheiroButton).toHaveClass('border-blue-500');
    });
  });

  describe('Observações', () => {
    it('deve permitir adicionar observações', async () => {
      render(<CloseAccountModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Adicione observações sobre o fechamento...');
      fireEvent.change(textarea, { target: { value: 'Cliente satisfeito' } });

      await waitFor(() => {
        expect(textarea).toHaveValue('Cliente satisfeito');
      });
    });
  });

  describe('Totalizador', () => {
    it('deve exibir resumo dos valores', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByText('Valor dos itens:')).toBeInTheDocument();
      expect(screen.getByText('Comissão (10,0%):')).toBeInTheDocument();
      expect(screen.getByText('Total a Pagar:')).toBeInTheDocument();
    });

    it('deve calcular total corretamente', () => {
      render(<CloseAccountModal {...defaultProps} />);

      // Com 10% de comissão: 150 + 15 = 165
      expect(screen.getByText('R$ 165,00')).toBeInTheDocument();
    });
  });

  describe('Ações', () => {
    it('deve chamar onClose ao clicar em Cancelar', async () => {
      const onClose = vi.fn();
      render(<CloseAccountModal {...defaultProps
} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onClose ao clicar no X', async () => {
      const onClose = vi.fn();
      render(<CloseAccountModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '' }); // Botão X
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onConfirm com dados corretos', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      render(<CloseAccountModal {...defaultProps} onConfirm={onConfirm} />);

      // Alterar percentual para 15%
      const input = screen.getByDisplayValue('10');
      fireEvent.change(input, { target: { value: '15' } });

      // Selecionar PIX
      const pixButton = screen.getByText('PIX').closest('button');
      fireEvent.click(pixButton!);

      // Adicionar observação
      const textarea = screen.getByPlaceholderText('Adicione observações sobre o fechamento...');
      fireEvent.change(textarea, { target: { value: 'Pagamento via PIX' } });

      // Confirmar
      const confirmButton = screen.getByText('Confirmar Fechamento');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith({
          comanda_id: 'CMD0001-123456',
          valor_base: 150.00,
          percentual_comissao: 15,
          valor_comissao: 22.5,
          valor_total: 172.5,
          metodo_pagamento: 'pix',
          observacoes: 'Pagamento via PIX'
        });
      });
    });

    it('deve exibir erro quando percentual é inválido', async () => {
      render(<CloseAccountModal {...defaultProps} />);

      // Definir percentual inválido
      const input = screen.getByDisplayValue('10');
      fireEvent.change(input, { target: { value: '35' } });

      const confirmButton = screen.getByText('Confirmar Fechamento');
      fireEvent.click(confirmButton);

      // Não deve chamar onConfirm
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('deve exibir estado de loading', () => {
      render(<CloseAccountModal {...defaultProps} loading={true} />);

      expect(screen.getByText('Processando...')).toBeInTheDocument();
      
      const confirmButton = screen.getByText('Processando...');
      expect(confirmButton).toBeDisabled();
      
      const cancelButton = screen.getByText('Cancelar');
      expect(cancelButton).toBeDisabled();
    });

    it('deve desabilitar botão quando percentual é inválido', async () => {
      render(<CloseAccountModal {...defaultProps} />);

      const input = screen.getByDisplayValue('10');
      fireEvent.change(input, { target: { value: '35' } });

      await waitFor(() => {
        const confirmButton = screen.getByText('Confirmar Fechamento');
        expect(confirmButton).toBeDisabled();
      });
    });
  });

  describe('Reset de Estado', () => {
    it('deve resetar estado quando modal abre', () => {
      const { rerender } = render(<CloseAccountModal {...defaultProps} isOpen={false} />);

      // Abrir modal
      rerender(<CloseAccountModal {...defaultProps} isOpen={true} />);

      // Verificar valores padrão
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      const dinheiroButton = screen.getByText('Dinheiro').closest('button');
      expect(dinheiroButton).toHaveClass('border-blue-500');
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando onConfirm falha', async () => {
      const onConfirm = vi.fn().mockRejectedValue(new Error('Erro de processamento'));
      render(<CloseAccountModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirmar Fechamento');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Erro de processamento')).toBeInTheDocument();
      });
    });

    it('deve exibir erro genérico para erros desconhecidos', async () => {
      const onConfirm = vi.fn().mockRejectedValue('Erro desconhecido');
      render(<CloseAccountModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirmar Fechamento');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Erro ao processar fechamento')).toBeInTheDocument();
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByLabelText('Percentual de Comissão (0% - 30%)')).toBeInTheDocument();
      expect(screen.getByLabelText('Observações (opcional)')).toBeInTheDocument();
    });

    it('deve permitir navegação por teclado', () => {
      render(<CloseAccountModal {...defaultProps} />);

      const input = screen.getByDisplayValue('10');
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar grid de métodos de pagamento', () => {
      render(<CloseAccountModal {...defaultProps} />);

      const paymentGrid = screen.getByText('Dinheiro').closest('.grid');
      expect(paymentGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3');
    });
  });

  describe('Formatação de Valores', () => {
    it('deve formatar valores monetários corretamente', () => {
      render(<CloseAccountModal {...defaultProps} />);

      // Verificar se os mocks de formatação foram chamados
      expect(screen.getByText('R$ 150,00')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('R$ 15,00')).toBeInTheDocument(); // Comissão
      expect(screen.getByText('R$ 165,00')).toBeInTheDocument(); // Total
    });

    it('deve formatar percentuais corretamente', () => {
      render(<CloseAccountModal {...defaultProps} />);

      expect(screen.getByText('10,0%')).toBeInTheDocument();
    });
  });
});