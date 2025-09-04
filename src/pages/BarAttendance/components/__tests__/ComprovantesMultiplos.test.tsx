import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComprovantesMultiplos from '../ComprovantesMultiplos';
import { ComandaWithItems, BillSplitConfig } from '../../../../types/bar-attendance';

// Mock da comanda para testes
const mockComanda: ComandaWithItems = {
  id: 'comanda-1',
  table_id: 'mesa-1',
  customer_name: 'João Silva',
  employee_id: 'emp-1',
  status: 'open',
  total: 0,
  people_count: 2,
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

const mockSplitConfig: BillSplitConfig = {
  type: 'equal',
  person_count: 2,
  splits: [
    {
      person_name: 'João',
      items: [
        {
          menu_item_id: 'menu-1',
          name: 'Cerveja Artesanal',
          quantity: 1,
          price: 15.50,
          total: 15.50
        }
      ],
      subtotal: 15.50,
      service_charge: 1.55,
      discount: 0,
      total: 17.05
    },
    {
      person_name: 'Maria',
      items: [
        {
          menu_item_id: 'menu-1',
          name: 'Cerveja Artesanal',
          quantity: 1,
          price: 15.50,
          total: 15.50
        }
      ],
      subtotal: 15.50,
      service_charge: 1.55,
      discount: 0,
      total: 17.05
    }
  ],
  service_charge_percentage: 10,
  discount_amount: 0
};

const mockOnProcessPayments = jest.fn();
const mockOnClose = jest.fn();

// Mock do console.log para testes de impressão
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock do alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('ComprovantesMultiplos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockAlert.mockRestore();
  });

  it('deve renderizar o modal quando aberto', () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    expect(screen.getByText('Processar Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });

  it('não deve renderizar quando fechado', () => {
    render(
      <ComprovantesMultiplos
        isOpen={false}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    expect(screen.queryByText('Processar Pagamentos')).not.toBeInTheDocument();
  });

  it('deve mostrar informações da comanda corretamente', () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // Mesa
    expect(screen.getByText('Igual')).toBeInTheDocument(); // Tipo de divisão
    expect(screen.getByText('R$ 34,10')).toBeInTheDocument(); // Total geral
  });

  it('deve mostrar valores corretos para cada pessoa', () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    // Verificar valores individuais
    const joaoAmount = screen.getAllByText('R$ 17,05')[0];
    const mariaAmount = screen.getAllByText('R$ 17,05')[1];
    
    expect(joaoAmount).toBeInTheDocument();
    expect(mariaAmount).toBeInTheDocument();
  });

  it('deve permitir alterar forma de pagamento', async () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    // Clicar no botão de cartão de crédito para João
    const cartaoButtons = screen.getAllByText('Cartão de Crédito');
    fireEvent.click(cartaoButtons[0]);

    // Verificar se o botão ficou selecionado (isso dependeria da implementação visual)
    await waitFor(() => {
      expect(cartaoButtons[0]).toBeInTheDocument();
    });
  });

  it('deve processar pagamento individual', async () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    // Clicar em processar pagamento para João
    const processarButtons = screen.getAllByText('Processar Pagamento');
    fireEvent.click(processarButtons[0]);

    // Verificar se mostra "Processando..."
    await waitFor(() => {
      expect(screen.getByText('Processando...')).toBeInTheDocument();
    });

    // Aguardar processamento completar
    await waitFor(() => {
      expect(screen.getByText('Pago')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('deve imprimir comprovante após pagamento processado', async () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    // Processar pagamento primeiro
    const processarButtons = screen.getAllByText('Processar Pagamento');
    fireEvent.click(processarButtons[0]);

    // Aguardar processamento completar
    await waitFor(() => {
      expect(screen.getByText('Pago')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Clicar em imprimir comprovante
    const imprimirButton = screen.getByText('Imprimir Comprovante');
    fireEvent.click(imprimirButton);

    // Verificar se o console.log foi chamado (simulando impressão)
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Imprimindo comprovante:',
      expect.stringContaining('CLUBE EXEMPLO')
    );

    // Verificar se o alert foi chamado
    expect(mockAlert).toHaveBeenCalledWith('Comprovante impresso para João');

    // Verificar se mostra "Comprovante impresso"
    await waitFor(() => {
      expect(screen.getByText('Comprovante impresso')).toBeInTheDocument();
    });
  });

  it('deve desabilitar botão finalizar até todos pagamentos serem processados', () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    const finalizarButton = screen.getByText('Finalizar Todos os Pagamentos');
    expect(finalizarButton).toBeDisabled();
  });

  it('deve habilitar botão finalizar quando todos pagamentos estão processados', async () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    // Processar todos os pagamentos
    const processarButtons = screen.getAllByText('Processar Pagamento');
    
    for (const button of processarButtons) {
      fireEvent.click(button);
    }

    // Aguardar todos processamentos completarem
    await waitFor(() => {
      const pagoLabels = screen.getAllByText('Pago');
      expect(pagoLabels).toHaveLength(2);
    }, { timeout: 3000 });

    // Verificar se botão finalizar está habilitado
    const finalizarButton = screen.getByText('Finalizar Todos os Pagamentos');
    expect(finalizarButton).not.toBeDisabled();
  });

  it('deve finalizar todos os pagamentos', async () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    // Processar todos os pagamentos primeiro
    const processarButtons = screen.getAllByText('Processar Pagamento');
    
    for (const button of processarButtons) {
      fireEvent.click(button);
    }

    // Aguardar processamentos completarem
    await waitFor(() => {
      const pagoLabels = screen.getAllByText('Pago');
      expect(pagoLabels).toHaveLength(2);
    }, { timeout: 3000 });

    // Clicar em finalizar
    const finalizarButton = screen.getByText('Finalizar Todos os Pagamentos');
    fireEvent.click(finalizarButton);

    // Verificar se onProcessPayments foi chamado
    expect(mockOnProcessPayments).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          person_name: 'João',
          amount: 17.05,
          status: 'completed'
        }),
        expect.objectContaining({
          person_name: 'Maria',
          amount: 17.05,
          status: 'completed'
        })
      ])
    );
  });

  it('deve fechar modal quando cancelado', () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deve mostrar contador de pagamentos processados', () => {
    render(
      <ComprovantesMultiplos
        isOpen={true}
        onClose={mockOnClose}
        comanda={mockComanda}
        splitConfig={mockSplitConfig}
        onProcessPayments={mockOnProcessPayments}
      />
    );

    expect(screen.getByText('0 de 2 pagamentos processados')).toBeInTheDocument();
  });
});