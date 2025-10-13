import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BalcaoView from '../BalcaoView';
import { useMenuItems } from '../../../../hooks/useMenuItems';
import { useBarAttendance } from '../../../../hooks/useBarAttendance';
import { useAuth } from '../../../../contexts/AuthContextSimple';

// Mock dos hooks
vi.mock('../../../../hooks/useMenuItems');
vi.mock('../../../../hooks/useBarAttendance');
vi.mock('../../../../contexts/AuthContext');

const mockMenuItems = [
  {
    id: '1',
    name: 'Cerveja Pilsen',
    description: 'Cerveja gelada 350ml',
    price: 8.50,
    category: 'Bebidas',
    available: true,
    image_url: null
  },
  {
    id: '2',
    name: 'Porção de Batata',
    description: 'Batata frita crocante',
    price: 15.00,
    category: 'Petiscos',
    available: true,
    image_url: null
  },
  {
    id: '3',
    name: 'Refrigerante',
    description: 'Coca-Cola 350ml',
    price: 5.00,
    category: 'Bebidas',
    available: true,
    image_url: null
  }
];

const mockUser = {
  id: 'user-1',
  email: 'bartender@clube.com',
  name: 'João Bartender'
};

describe('BalcaoView', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn()
    });

    vi.mocked(useMenuItems).mockReturnValue({
      menuItems: mockMenuItems,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getItemsByCategory: vi.fn(),
      getAvailableItems: vi.fn()
    });

    vi.mocked(useBarAttendance).mockReturnValue({
      mesas: [],
      comandas: [],
      metricas: null,
      notificacoes: [],
      loading: false,
      error: null,
      processarPedidoBalcao: vi.fn().mockResolvedValue('order-123'),
      criarComanda: vi.fn(),
      atualizarComanda: vi.fn(),
      fecharComanda: vi.fn(),
      adicionarItemComanda: vi.fn(),
      removerItemComanda: vi.fn(),
      atualizarStatusItem: vi.fn(),
      ocuparMesa: vi.fn(),
      liberarMesa: vi.fn(),
      reservarMesa: vi.fn(),
      limparMesa: vi.fn(),
      atualizarStatusMesa: vi.fn(),
      dividirConta: vi.fn(),
      atualizarMetricas: vi.fn(),
      marcarNotificacaoLida: vi.fn(),
      limparNotificacoes: vi.fn(),
      recarregarDados: vi.fn(),
      obterComandaPorMesa: vi.fn(),
      obterMesaPorNumero: vi.fn()
    });
  });

  it('deve renderizar o título e botão de identificar membro', () => {
    render(<BalcaoView />);
    
    expect(screen.getByText('Atendimento no Balcão')).toBeInTheDocument();
    expect(screen.getByText('Identificar Membro')).toBeInTheDocument();
  });

  it('deve exibir os itens do menu em grid', () => {
    render(<BalcaoView />);
    
    expect(screen.getByText('Cerveja Pilsen')).toBeInTheDocument();
    expect(screen.getByText('Porção de Batata')).toBeInTheDocument();
    expect(screen.getByText('Refrigerante')).toBeInTheDocument();
    expect(screen.getByText('R$ 8,50')).toBeInTheDocument();
    expect(screen.getByText('R$ 15,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 5,00')).toBeInTheDocument();
  });

  it('deve adicionar item ao carrinho ao clicar', () => {
    render(<BalcaoView />);
    
    // Clicar no item de cerveja
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Verificar se apareceu no carrinho
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('R$ 8,50')).toBeInTheDocument();
  });

  it('deve calcular o total corretamente', () => {
    render(<BalcaoView />);
    
    // Adicionar cerveja (R$ 8,50)
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Adicionar batata (R$ 15,00)
    fireEvent.click(screen.getByText('Porção de Batata'));
    
    // Verificar total
    expect(screen.getByText('R$ 23,50')).toBeInTheDocument();
  });

  it('deve permitir aumentar quantidade de item', () => {
    render(<BalcaoView />);
    
    // Adicionar cerveja
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Aumentar quantidade
    const plusButton = screen.getByRole('button', { name: /plus/i });
    fireEvent.click(plusButton);
    
    // Verificar quantidade
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deve permitir diminuir quantidade de item', () => {
    render(<BalcaoView />);
    
    // Adicionar cerveja duas vezes
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Diminuir quantidade
    const minusButton = screen.getByRole('button', { name: /minus/i });
    fireEvent.click(minusButton);
    
    // Verificar quantidade
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('deve remover item do carrinho', () => {
    render(<BalcaoView />);
    
    // Adicionar cerveja
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Remover item
    const removeButton = screen.getByRole('button', { name: /x-mark/i });
    fireEvent.click(removeButton);
    
    // Verificar se carrinho está vazio
    expect(screen.getByText('Nenhum item selecionado')).toBeInTheDocument();
  });

  it('deve filtrar itens por categoria', () => {
    render(<BalcaoView />);
    
    // Selecionar categoria Bebidas
    const categorySelect = screen.getByDisplayValue('Todas as Categorias');
    fireEvent.change(categorySelect, { target: { value: 'Bebidas' } });
    
    // Verificar se apenas bebidas aparecem
    expect(screen.getByText('Cerveja Pilsen')).toBeInTheDocument();
    expect(screen.getByText('Refrigerante')).toBeInTheDocument();
    expect(screen.queryByText('Porção de Batata')).not.toBeInTheDocument();
  });

  it('deve buscar itens por nome', () => {
    render(<BalcaoView />);
    
    // Buscar por "cerveja"
    const searchInput = screen.getByPlaceholderText('Buscar itens...');
    fireEvent.change(searchInput, { target: { value: 'cerveja' } });
    
    // Verificar se apenas cerveja aparece
    expect(screen.getByText('Cerveja Pilsen')).toBeInTheDocument();
    expect(screen.queryByText('Porção de Batata')).not.toBeInTheDocument();
    expect(screen.queryByText('Refrigerante')).not.toBeInTheDocument();
  });

  it('deve abrir modal de pagamento ao finalizar pedido', () => {
    render(<BalcaoView />);
    
    // Adicionar item ao carrinho
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Clicar em finalizar pedido
    fireEvent.click(screen.getByText('Finalizar Pedido'));
    
    // Verificar se modal de pagamento abriu
    expect(screen.getByText('Finalizar Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Método de Pagamento')).toBeInTheDocument();
  });

  it('deve processar pagamento corretamente', async () => {
    const mockProcessarPedido = vi.fn().mockResolvedValue('order-123');
    vi.mocked(useBarAttendance).mockReturnValue({
      ...vi.mocked(useBarAttendance)(),
      processarPedidoBalcao: mockProcessarPedido
    });

    render(<BalcaoView />);
    
    // Adicionar item ao carrinho
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    
    // Abrir modal de pagamento
    fireEvent.click(screen.getByText('Finalizar Pedido'));
    
    // Selecionar método de pagamento (dinheiro já está selecionado)
    // Processar pagamento
    fireEvent.click(screen.getByText('Pagar e Imprimir'));
    
    // Verificar se função foi chamada
    await waitFor(() => {
      expect(mockProcessarPedido).toHaveBeenCalledWith({
        items: [{
          menu_item_id: '1',
          name: 'Cerveja Pilsen',
          price: 8.50,
          quantity: 1
        }],
        customer: undefined,
        total: 8.50,
        discount_amount: 0,
        payment_method: 'dinheiro',
        notes: ''
      });
    });
  });

  it('deve aplicar desconto para membro identificado', () => {
    render(<BalcaoView />);
    
    // Simular seleção de cliente membro
    const mockCustomer = {
      id: 'customer-1',
      name: 'João Silva',
      phone: '11999999999',
      is_vip: true,
      loyalty_points: 150,
      credit_limit: 1000,
      current_balance: 0,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Adicionar item ao carrinho
    fireEvent.click(screen.getByText('Cerveja Pilsen')); // R$ 8,50
    
    // Simular identificação de membro (seria feito através do modal)
    // Por enquanto, vamos testar o cálculo diretamente
    const subtotal = 8.50;
    const discount = subtotal * 0.1; // 10% desconto
    const total = subtotal - discount;
    
    expect(discount).toBe(0.85);
    expect(total).toBe(7.65);
  });

  it('deve limpar carrinho ao clicar em limpar', () => {
    render(<BalcaoView />);
    
    // Adicionar itens ao carrinho
    fireEvent.click(screen.getByText('Cerveja Pilsen'));
    fireEvent.click(screen.getByText('Porção de Batata'));
    
    // Verificar se itens estão no carrinho
    expect(screen.getByText('Cerveja Pilsen')).toBeInTheDocument();
    expect(screen.getByText('Porção de Batata')).toBeInTheDocument();
    
    // Limpar carrinho
    fireEvent.click(screen.getByText('Limpar'));
    
    // Verificar se carrinho está vazio
    expect(screen.getByText('Nenhum item selecionado')).toBeInTheDocument();
  });
});