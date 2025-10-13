import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DivisaoContaModal from '../DivisaoContaModal';
import { ComandaWithItems, BillSplitConfig } from '../../../../types/bar-attendance';

// Mock da comanda para testes
const mockComanda: ComandaWithItems = {
  id: 'comanda-1',
  table_id: 'mesa-1',
  customer_name: 'João Silva',
  employee_id: 'emp-1',
  status: 'open',
  total: 0,
  people_count: 3,
  opened_at: '2024-01-01T10:00:00Z',
  closed_at: null,
  notes: null,
  items: [
    {
      id: 'item-1',
      comanda_id: 'comanda-1',
      menu_item_id: 'menu-1',
      quantity: 2,
      price: 15.50,
      status: 'delivered',
      added_at: '2024-01-01T10:05:00Z',
      notes: null,
      menu_item: {
        id: 'menu-1',
        name: 'Cerveja Artesanal',
        price: 15.50,
        category: 'Bebidas',
        description: 'Cerveja artesanal 500ml',
        available: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'item-2',
      comanda_id: 'comanda-1',
      menu_item_id: 'menu-2',
      quantity: 1,
      price: 25.00,
      status: 'delivered',
      added_at: '2024-01-01T10:10:00Z',
      notes: null,
      menu_item: {
        id: 'menu-2',
        name: 'Porção de Batata Frita',
        price: 25.00,
        category: 'Petiscos',
        description: 'Porção grande de batata frita',
        available: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  ],
  table: {
    id: 'mesa-1',
    number: '5',
    capacity: 4,
    status: 'occupied',
    position_x: 100,
    position_y: 200,
    created_at: '2024-01-01T00:00:00Z'
  }
};

const mockOnConfirmSplit = jest.fn();
const mockOnClose = jest.fn();

describe('DivisaoContaModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o modal quando aberto', () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    expect(screen.getByText('Divisão de Conta')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Resultado da Divisão')).toBeInTheDocument();
  });

  it('não deve renderizar quando fechado', () => {
    render(
      <DivisaoContaModal
        isOpen={false}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    expect(screen.queryByText('Divisão de Conta')).not.toBeInTheDocument();
  });

  it('deve calcular divisão igual corretamente', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    // Verificar se a divisão igual está selecionada por padrão
    const divisaoIgualRadio = screen.getByDisplayValue('equal');
    expect(divisaoIgualRadio).toBeChecked();

    // Verificar se o número de pessoas está correto (3 da comanda)
    const personCountInput = screen.getByDisplayValue('3');
    expect(personCountInput).toBeInTheDocument();

    // Verificar se os totais estão corretos
    // Total original: (2 * 15.50) + (1 * 25.00) = 56.00
    // Taxa de serviço (10%): 5.60
    // Total com taxa: 61.60
    // Por pessoa: 61.60 / 3 = 20.53
    await waitFor(() => {
      expect(screen.getByText('R$ 56,00')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('R$ 61,60')).toBeInTheDocument(); // Total
    });
  });

  it('deve permitir alterar o número de pessoas', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const personCountInput = screen.getByDisplayValue('3');
    
    // Alterar para 2 pessoas
    fireEvent.change(personCountInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    // Verificar se os nomes das pessoas foram atualizados
    expect(screen.getByDisplayValue('Pessoa 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pessoa 2')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Pessoa 3')).not.toBeInTheDocument();
  });

  it('deve permitir alterar nomes das pessoas', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const firstPersonInput = screen.getByDisplayValue('Pessoa 1');
    
    fireEvent.change(firstPersonInput, { target: { value: 'João' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('João')).toBeInTheDocument();
    });
  });

  it('deve permitir alterar taxa de serviço', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const serviceChargeInput = screen.getByDisplayValue('10');
    
    fireEvent.change(serviceChargeInput, { target: { value: '15' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });
  });

  it('deve permitir adicionar desconto', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const discountInput = screen.getByDisplayValue('0');
    
    fireEvent.change(discountInput, { target: { value: '5.60' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('5.6')).toBeInTheDocument();
    });
  });

  it('deve alternar para divisão por item', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const divisaoPorItemRadio = screen.getByDisplayValue('by_item');
    
    fireEvent.click(divisaoPorItemRadio);

    await waitFor(() => {
      expect(divisaoPorItemRadio).toBeChecked();
      expect(screen.getByText('Atribuir Itens às Pessoas')).toBeInTheDocument();
    });
  });

  it('deve confirmar divisão quando clicado', async () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const confirmButton = screen.getByText('Confirmar Divisão');
    
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirmSplit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'equal',
          person_count: 3,
          service_charge_percentage: 10,
          discount_amount: 0,
          splits: expect.arrayContaining([
            expect.objectContaining({
              person_name: 'Pessoa 1',
              total: expect.any(Number)
            })
          ])
        })
      );
    });
  });

  it('deve fechar modal quando cancelado', () => {
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deve mostrar aviso quando há diferença nos totais', async () => {
    // Este teste seria para divisão por item onde nem todos os itens foram atribuídos
    render(
      <DivisaoContaModal
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        onConfirmSplit={mockOnConfirmSplit}
      />
    );

    // Alternar para divisão por item
    const divisaoPorItemRadio = screen.getByDisplayValue('by_item');
    fireEvent.click(divisaoPorItemRadio);

    await waitFor(() => {
      // Quando não há itens atribuídos, deve haver diferença
      const confirmButton = screen.getByText('Confirmar Divisão');
      expect(confirmButton).toBeDisabled();
    });
  });
});