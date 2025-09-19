import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '../NotificationCenter';
import { useNotifications } from '../../../hooks/useNotifications';

// Mock do hook useNotifications
jest.mock('../../../hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Mock dos componentes filhos
jest.mock('../AlertRuleEditor', () => ({
  AlertRuleEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="alert-rule-editor">
      <button onClick={() => onSave({ name: 'Test Rule' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

jest.mock('../NotificationHistory', () => ({
  NotificationHistory: ({ notifications }: any) => (
    <div data-testid="notification-history">
      {notifications.length} notifications
    </div>
  )
}));

jest.mock('../ChannelManager', () => ({
  ChannelManager: ({ onSave, onCancel }: any) => (
    <div data-testid="channel-manager">
      <button onClick={() => onSave({ name: 'Test Channel' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

const mockRules = [
  {
    id: '1',
    name: 'CPU Alto',
    description: 'Alerta quando CPU > 80%',
    severity: 'high' as const,
    isActive: true,
    conditions: [],
    actions: [],
    channels: ['channel1'],
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    createdBy: 'user1'
  }
];

const mockChannels = [
  {
    id: 'channel1',
    name: 'Email Admin',
    description: 'Canal de email para administradores',
    type: 'email' as const,
    isActive: true,
    config: {},
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  }
];

const mockNotifications = [
  {
    id: 'notif1',
    title: 'CPU Alto Detectado',
    message: 'CPU está em 85%',
    severity: 'high' as const,
    status: 'sent' as const,
    channels: ['Email Admin'],
    createdAt: new Date().toISOString()
  }
];

const mockStats = {
  totalSent: 10,
  totalFailed: 2,
  totalPending: 1,
  activeRules: 5,
  activeChannels: 3,
  alertsToday: 8,
  criticalAlertsToday: 2
};

const mockHookReturn = {
  rules: mockRules,
  channels: mockChannels,
  notifications: mockNotifications,
  stats: mockStats,
  isLoading: false,
  error: null,
  createRule: jest.fn(),
  updateRule: jest.fn(),
  deleteRule: jest.fn(),
  createChannel: jest.fn(),
  updateChannel: jest.fn(),
  deleteChannel: jest.fn(),
  testChannel: jest.fn(),
  sendNotification: jest.fn(),
  getNotificationHistory: jest.fn(),
  retryNotification: jest.fn(),
  refreshData: jest.fn()
};

describe('NotificationCenter', () => {
  beforeEach(() => {
    mockUseNotifications.mockReturnValue(mockHookReturn);
    jest.clearAllMocks();
  });

  it('deve renderizar o centro de notificações', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByText('Centro de Notificações')).toBeInTheDocument();
    expect(screen.getByText('Gerencie alertas, regras e canais de comunicação')).toBeInTheDocument();
  });

  it('deve mostrar estatísticas corretas', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // Regras Ativas
    expect(screen.getByText('3')).toBeInTheDocument(); // Canais Ativos
    expect(screen.getByText('8')).toBeInTheDocument(); // Alertas Hoje
    expect(screen.getByText('2')).toBeInTheDocument(); // Falhas
  });

  it('deve mostrar loading quando carregando', () => {
    mockUseNotifications.mockReturnValue({
      ...mockHookReturn,
      isLoading: true
    });

    render(<NotificationCenter />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve mostrar erro quando há erro', () => {
    mockUseNotifications.mockReturnValue({
      ...mockHookReturn,
      error: 'Erro de conexão'
    });

    render(<NotificationCenter />);
    
    expect(screen.getByText('Erro: Erro de conexão')).toBeInTheDocument();
  });

  it('deve navegar entre abas', () => {
    render(<NotificationCenter />);
    
    // Clicar na aba de regras
    fireEvent.click(screen.getByText('Regras de Alerta'));
    expect(screen.getByText('CPU Alto')).toBeInTheDocument();
    
    // Clicar na aba de canais
    fireEvent.click(screen.getByText('Canais'));
    expect(screen.getByText('Email Admin')).toBeInTheDocument();
    
    // Clicar na aba de histórico
    fireEvent.click(screen.getByText('Histórico'));
    expect(screen.getByTestId('notification-history')).toBeInTheDocument();
  });

  it('deve abrir modal de nova regra', () => {
    render(<NotificationCenter />);
    
    fireEvent.click(screen.getByText('Nova Regra'));
    
    expect(screen.getByTestId('alert-rule-editor')).toBeInTheDocument();
  });

  it('deve abrir modal de gerenciar canais', () => {
    render(<NotificationCenter />);
    
    fireEvent.click(screen.getByText('Gerenciar Canais'));
    
    expect(screen.getByTestId('channel-manager')).toBeInTheDocument();
  });

  it('deve mostrar alertas recentes na visão geral', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByText('CPU Alto Detectado')).toBeInTheDocument();
    expect(screen.getByText('CPU está em 85%')).toBeInTheDocument();
  });

  it('deve permitir editar regra existente', () => {
    render(<NotificationCenter />);
    
    // Ir para aba de regras
    fireEvent.click(screen.getByText('Regras de Alerta'));
    
    // Clicar em editar
    fireEvent.click(screen.getByText('Editar'));
    
    expect(screen.getByTestId('alert-rule-editor')).toBeInTheDocument();
  });

  it('deve permitir deletar regra', async () => {
    render(<NotificationCenter />);
    
    // Ir para aba de regras
    fireEvent.click(screen.getByText('Regras de Alerta'));
    
    // Clicar em excluir
    fireEvent.click(screen.getByText('Excluir'));
    
    await waitFor(() => {
      expect(mockHookReturn.deleteRule).toHaveBeenCalledWith('1');
    });
  });

  it('deve permitir testar canal', async () => {
    mockHookReturn.testChannel.mockResolvedValue({
      success: true,
      responseTime: 100
    });

    render(<NotificationCenter />);
    
    // Ir para aba de canais
    fireEvent.click(screen.getByText('Canais'));
    
    // Clicar em testar
    fireEvent.click(screen.getByText('Testar'));
    
    await waitFor(() => {
      expect(mockHookReturn.testChannel).toHaveBeenCalledWith('channel1');
    });
  });

  it('deve salvar nova regra', async () => {
    mockHookReturn.createRule.mockResolvedValue(mockRules[0]);

    render(<NotificationCenter />);
    
    // Abrir modal de nova regra
    fireEvent.click(screen.getByText('Nova Regra'));
    
    // Salvar
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockHookReturn.createRule).toHaveBeenCalledWith({
        name: 'Test Rule'
      });
    });
  });

  it('deve salvar novo canal', async () => {
    mockHookReturn.createChannel.mockResolvedValue(mockChannels[0]);

    render(<NotificationCenter />);
    
    // Abrir modal de gerenciar canais
    fireEvent.click(screen.getByText('Gerenciar Canais'));
    
    // Salvar
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockHookReturn.createChannel).toHaveBeenCalledWith({
        name: 'Test Channel'
      });
    });
  });

  it('deve fechar modais ao cancelar', () => {
    render(<NotificationCenter />);
    
    // Abrir modal de nova regra
    fireEvent.click(screen.getByText('Nova Regra'));
    expect(screen.getByTestId('alert-rule-editor')).toBeInTheDocument();
    
    // Cancelar
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('alert-rule-editor')).not.toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há regras', () => {
    mockUseNotifications.mockReturnValue({
      ...mockHookReturn,
      rules: []
    });

    render(<NotificationCenter />);
    
    // Ir para aba de regras
    fireEvent.click(screen.getByText('Regras de Alerta'));
    
    expect(screen.getByText('Nenhuma regra configurada')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há canais', () => {
    mockUseNotifications.mockReturnValue({
      ...mockHookReturn,
      channels: []
    });

    render(<NotificationCenter />);
    
    // Ir para aba de canais
    fireEvent.click(screen.getByText('Canais'));
    
    expect(screen.getByText('Nenhum canal configurado')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há alertas recentes', () => {
    mockUseNotifications.mockReturnValue({
      ...mockHookReturn,
      notifications: []
    });

    render(<NotificationCenter />);
    
    expect(screen.getByText('Nenhum alerta recente')).toBeInTheDocument();
  });
});