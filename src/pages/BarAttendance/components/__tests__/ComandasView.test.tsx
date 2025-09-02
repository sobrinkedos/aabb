import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ComandasView from '../ComandasView';
import { useComandas } from '../../../../hooks/useComandas';
import { useBarTables } from '../../../../hooks/useBarTables';

// Mock dos hooks
vi.mock('../../../../hooks/useComandas');
vi.mock('../../../../hooks/useBarTables');

const mockUseComandas = useComandas as vi.MockedFunction<typeof useComandas>;
const mockUseBarTables = useBarTables as vi.MockedFunction<typeof useBarTables>;

const mockComandas = [
  {
    id: '1',
    table_id: 'table-1',
    customer_name: 'João Silva',
    employee_id: 'emp-1',
    status: 'open' as const,
    total: 45.50,
    people_count: 2,
    opened_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
    closed_at: null,
    notes: null,
    table: { id: 'table-1', number: '5' },
    employee: { id: 'emp-1', name: 'Maria Santos' },
    items: [
      {
        id: 'item-1',
        comanda_id: '1',
        menu_item_id: 'menu-1',
        quantity: 2,
        price: 15.00,
        status: 'delivered' as const,
        added_at: new Date().toISOString(),
        menu_item: { id: 'menu-1', name: 'Cerveja', price: 15.00 }
      }
    ]
  },
  {
    id: '2',
    table_id: null,
    customer_name: 'Ana Costa',
    employee_id: 'emp-2',
    status: 'open' as const,
    total: 25.00,
    people_count: 1,
    opened_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
    closed_at: null,
    notes: null,
    table: null,
    employee: { id: 'emp-2', name: 'Carlos Lima' },
    items: []
  }
];

const mockTables = [
  { id: 'table-1', number: '5', capacity: 4, status: 'occupied' as const, position_x: 0, position_y: 0 },
  { id: 'table-2', number: '3', capacity: 2, status: 'available' as const, position_x: 0, position_y: 0 }
];

describe('ComandasView', () => {
  beforeEach(() => {
    mockUseComandas.mockReturnValue({
      comandas: mockComandas,
      loading: false,
      error: null,
      refetch: vi.fn(),
      createComanda: vi.fn(),
      updateComandaStatus: vi.fn(),
      addItemToComanda: vi.fn(),
      updateItemStatus: vi.fn(),
      getComandaByTable: vi.fn(),
      removeItemFromComanda: vi.fn()
    });

    mockUseBarTables.mockReturnValue({
      tables: mockTables,
      loading: false,
      error: null,
      refetch: vi.fn(),
      updateTableStatus: vi.fn(),
      updateTablePosition: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a lista de comandas', () => {
    render(<ComandasView />);
    
    expect(screen.getByText('Comandas')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
  });

  it('deve mostrar alertas para comandas com tempo excessivo', () => {
    render(<ComandasView />);
    
    // A comanda de João Silva tem 3 horas, deve aparecer como atrasada
    expect(screen.getByText(/Atenção - 5/)).toBeInTheDocument();
  });

  it('deve filtrar comandas por texto de busca', async () => {
    render(<ComandasView />);
    
    const searchInput = screen.getByPlaceholderText(/Mesa, cliente ou funcionário/);
    fireEvent.change(searchInput, { target: { value: 'João' } });
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.queryByText('Ana Costa')).not.toBeInTheDocument();
    });
  });

  it('deve filtrar comandas por status', async () => {
    render(<ComandasView />);
    
    const statusSelect = screen.getByDisplayValue('Todos os Status');
    fireEvent.change(statusSelect, { target: { value: 'open' } });
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });
  });

  it('deve filtrar comandas por mesa', async () => {
    render(<ComandasView />);
    
    const tableSelect = screen.getByDisplayValue('Todas as Mesas');
    fireEvent.change(tableSelect, { target: { value: 'balcao' } });
    
    await waitFor(() => {
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });
  });

  it('deve filtrar comandas por tempo', async () => {
    render(<ComandasView />);
    
    const timeSelect = screen.getByDisplayValue('Todos os Tempos');
    fireEvent.change(timeSelect, { target: { value: 'overdue' } });
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.queryByText('Ana Costa')).not.toBeInTheDocument();
    });
  });

  it('deve abrir modal de detalhes ao clicar em "Ver Detalhes"', async () => {
    render(<ComandasView />);
    
    const detailsButton = screen.getAllByText('Ver Detalhes')[0];
    fireEvent.click(detailsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Detalhes da Comanda')).toBeInTheDocument();
    });
  });

  it('deve abrir modal de nova comanda', async () => {
    render(<ComandasView />);
    
    const newComandaButton = screen.getByText('+ Nova Comanda');
    fireEvent.click(newComandaButton);
    
    await waitFor(() => {
      // Assumindo que o modal de nova comanda tem um título específico
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('deve limpar filtros ao clicar em "Limpar Filtros"', async () => {
    render(<ComandasView />);
    
    // Aplicar alguns filtros primeiro
    const searchInput = screen.getByPlaceholderText(/Mesa, cliente ou funcionário/);
    fireEvent.change(searchInput, { target: { value: 'João' } });
    
    const statusSelect = screen.getByDisplayValue('Todos os Status');
    fireEvent.change(statusSelect, { target: { value: 'open' } });
    
    // Clicar em limpar filtros
    const clearButton = screen.getByText('Limpar Filtros');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(statusSelect).toHaveValue('all');
    });
  });

  it('deve mostrar indicadores de comandas abertas, aguardando pagamento e atrasadas', () => {
    render(<ComandasView />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Comandas abertas
    expect(screen.getByText('Comandas Abertas')).toBeInTheDocument();
    expect(screen.getByText('Aguardando Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Com Atraso')).toBeInTheDocument();
  });

  it('deve mostrar tempo decorrido para cada comanda', () => {
    render(<ComandasView />);
    
    expect(screen.getByText(/3h \d+m decorrido/)).toBeInTheDocument();
    expect(screen.getByText(/\d+m decorrido/)).toBeInTheDocument();
  });

  it('deve destacar comandas atrasadas', () => {
    render(<ComandasView />);
    
    expect(screen.getByText('⚠️ Atrasada')).toBeInTheDocument();
  });
});