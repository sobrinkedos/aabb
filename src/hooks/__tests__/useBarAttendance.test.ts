import { renderHook, act, waitFor } from '@testing-library/react';
import { useBarAttendance } from '../useBarAttendance';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Mock do Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn()
  }
}));

// Mock do useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
};

const mockMesas = [
  {
    id: 'mesa-1',
    number: '1',
    capacity: 4,
    status: 'available',
    position_x: 100,
    position_y: 100,
    comandas: []
  },
  {
    id: 'mesa-2',
    number: '2',
    capacity: 2,
    status: 'occupied',
    position_x: 200,
    position_y: 100,
    comandas: [{
      id: 'comanda-1',
      customer_name: 'João Silva',
      people_count: 2,
      total: 50.00,
      opened_at: '2025-01-01T10:00:00Z',
      status: 'open',
      comanda_items: []
    }]
  }
];

const mockComandas = [
  {
    id: 'comanda-1',
    table_id: 'mesa-2',
    customer_name: 'João Silva',
    employee_id: 'user-123',
    status: 'open',
    total: 50.00,
    opened_at: '2025-01-01T10:00:00Z',
    people_count: 2,
    comanda_items: [
      {
        id: 'item-1',
        menu_item_id: 'menu-1',
        quantity: 2,
        price: 25.00,
        status: 'pending',
        menu_items: {
          name: 'Cerveja',
          price: 25.00,
          category: 'Bebidas'
        }
      }
    ],
    bar_tables: {
      number: '2',
      capacity: 2
    }
  }
];

const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error })
});

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis()
};

describe('useBarAttendance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseResponse([]));
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useBarAttendance());

    expect(result.current.mesas).toEqual([]);
    expect(result.current.comandas).toEqual([]);
    expect(result.current.metricas).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('deve carregar dados iniciais corretamente', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mesas).toHaveLength(2);
    expect(result.current.comandas).toHaveLength(1);
  });

  it('deve criar nova comanda corretamente', async () => {
    const novaComanda = {
      id: 'comanda-nova',
      table_id: 'mesa-1',
      customer_name: 'Maria Silva',
      employee_id: 'user-123',
      status: 'open',
      total: 0
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(novaComanda))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await act(async () => {
      const comandaId = await result.current.criarComanda('mesa-1', 'Maria Silva', 2);
      expect(comandaId).toBe('comanda-nova');
    });

    expect(supabase.from).toHaveBeenCalledWith('comandas');
  });

  it('deve adicionar item à comanda corretamente', async () => {
    const menuItem = { price: 15.00 };
    
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(menuItem))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse([
        { quantity: 1, price: 15.00 },
        { quantity: 2, price: 25.00 }
      ]))
      .mockReturnValueOnce(mockSupabaseResponse(null));

    const { result } = renderHook(() => useBarAttendance());

    await act(async () => {
      await result.current.adicionarItemComanda('comanda-1', 'menu-2', 1, 'Sem gelo');
    });

    expect(supabase.from).toHaveBeenCalledWith('menu_items');
    expect(supabase.from).toHaveBeenCalledWith('comanda_items');
  });

  it('deve processar pedido do balcão corretamente', async () => {
    const pedidoBalcao = {
      items: [
        {
          menu_item_id: 'menu-1',
          name: 'Cerveja',
          price: 25.00,
          quantity: 2
        }
      ],
      total: 50.00,
      payment_method: 'dinheiro'
    };

    const comandaCriada = {
      id: 'comanda-balcao',
      customer_name: 'Cliente Balcão',
      total: 50.00
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(comandaCriada))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await act(async () => {
      const comandaId = await result.current.processarPedidoBalcao(pedidoBalcao);
      expect(comandaId).toBe('comanda-balcao');
    });
  });

  it('deve atualizar status da mesa corretamente', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await act(async () => {
      await result.current.atualizarStatusMesa('mesa-1', 'occupied');
    });

    expect(supabase.from).toHaveBeenCalledWith('bar_tables');
  });

  it('deve fechar comanda corretamente', async () => {
    const comanda = {
      table_id: 'mesa-2',
      total: 50.00
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(comanda))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }))
      .mockReturnValueOnce(mockSupabaseResponse(null))
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await act(async () => {
      await result.current.fecharComanda('comanda-1', 'cartao', 'Cliente satisfeito');
    });

    expect(supabase.from).toHaveBeenCalledWith('comandas');
  });

  it('deve tratar erros corretamente', async () => {
    const erro = new Error('Erro de conexão');
    
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(null, erro));

    const { result } = renderHook(() => useBarAttendance());

    await waitFor(() => {
      expect(result.current.error).toContain('Erro em carregamento inicial');
      expect(result.current.loading).toBe(false);
    });
  });

  it('deve configurar subscriptions em tempo real', () => {
    renderHook(() => useBarAttendance());

    expect(supabase.channel).toHaveBeenCalledWith('bar-tables-changes');
    expect(supabase.channel).toHaveBeenCalledWith('comandas-changes');
    expect(supabase.channel).toHaveBeenCalledWith('comanda-items-changes');
    expect(mockChannel.on).toHaveBeenCalledTimes(3);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);
  });

  it('deve encontrar comanda por mesa', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const comanda = result.current.obterComandaPorMesa('mesa-2');
    expect(comanda).toBeDefined();
    expect(comanda?.customer_name).toBe('João Silva');
  });

  it('deve encontrar mesa por número', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSupabaseResponse(mockMesas))
      .mockReturnValueOnce(mockSupabaseResponse(mockComandas))
      .mockReturnValueOnce(mockSupabaseResponse(null, { code: 'PGRST116' }));

    const { result } = renderHook(() => useBarAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mesa = result.current.obterMesaPorNumero('1');
    expect(mesa).toBeDefined();
    expect(mesa?.id).toBe('mesa-1');
  });
});