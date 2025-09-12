import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MesasView from '../MesasView';

// Mock dos hooks
vi.mock('../../../../hooks/useBarTables', () => ({
  useBarTables: () => ({
    tables: [
      {
        id: '1',
        number: '1',
        capacity: 4,
        status: 'available',
        position_x: 10,
        position_y: 10,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        number: '2',
        capacity: 2,
        status: 'occupied',
        position_x: 30,
        position_y: 20,
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    updateTableStatus: vi.fn(),
    updateTablePosition: vi.fn(),
    refetch: vi.fn()
  })
}));

vi.mock('../../../../hooks/useComandas', () => ({
  useComandas: () => ({
    comandas: [
      {
        id: 'cmd1',
        table_id: '2',
        status: 'open',
        total: 45.50,
        people_count: 2,
        opened_at: '2024-01-01T12:00:00Z',
        customer_name: 'João Silva'
      }
    ],
    loading: false,
    error: null,
    getComandaByTable: vi.fn(),
    removeItemFromComanda: vi.fn()
  })
}));

describe('MesasView', () => {
  it('should render the component title', () => {
    render(<MesasView />);
    expect(screen.getByText('Gestão de Mesas')).toBeInTheDocument();
  });

  it('should show table statistics', () => {
    render(<MesasView />);
    expect(screen.getByText('2 mesas configuradas')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<MesasView />);
    expect(screen.getByText('Nova Comanda')).toBeInTheDocument();
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
    expect(screen.getByText('Configurar Layout')).toBeInTheDocument();
  });

  it('should display status statistics correctly', () => {
    render(<MesasView />);
    
    // Verificar se as estatísticas estão corretas
    // 1 mesa disponível, 1 ocupada
    const availableCount = screen.getByText('1');
    const occupiedCount = screen.getByText('1');
    
    expect(availableCount).toBeInTheDocument();
    expect(occupiedCount).toBeInTheDocument();
  });
});