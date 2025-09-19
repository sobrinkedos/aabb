import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntegrationDashboard } from '../IntegrationDashboard';
import { useIntegrations } from '../../../hooks/useIntegrations';

// Mock do hook useIntegrations
jest.mock('../../../hooks/useIntegrations');
const mockUseIntegrations = useIntegrations as jest.MockedFunction<typeof useIntegrations>;

// Mock dos componentes filhos
jest.mock('../APIConfigForm', () => ({
  APIConfigForm: ({ onSave, onCancel }: any) => (
    <div data-testid="api-config-form">
      <button onClick={() => onSave({ name: 'Test Integration' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

jest.mock('../ConnectionTester', () => ({
  ConnectionTester: ({ onClose }: any) => (
    <div data-testid="connection-tester">
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

jest.mock('../DataMappingEditor', () => ({
  DataMappingEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="data-mapping-editor">
      <button onClick={() => onSave([])}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

const mockIntegrations = [
  {
    id: '1',
    name: 'Sistema ERP',
    type: 'erp' as const,
    status: 'connected' as const,
    config: {
      baseUrl: 'https://api.erp.com',
      apiKey: 'test-key'
    },
    lastSync: new Date('2023-01-01').toISOString(),
    errorLog: []
  },
  {
    id: '2',
    name: 'Gateway Pagamento',
    type: 'payment' as const,
    status: 'error' as const,
    config: {
      baseUrl: 'https://api.payment.com',
      apiKey: 'test-key'
    },
    lastSync: null,
    errorLog: [
      {
        timestamp: new Date('2023-01-01'),
        message: 'Erro de conexão',
        code: 'CONNECTION_ERROR'
      }
    ]
  }
];

const mockHookReturn = {
  integrations: mockIntegrations,
  isLoading: false,
  error: null,
  createIntegration: jest.fn(),
  updateIntegration: jest.fn(),
  deleteIntegration: jest.fn(),
  testConnection: jest.fn(),
  syncData: jest.fn(),
  getIntegrationLogs: jest.fn(),
  refreshIntegrations: jest.fn()
};

describe('IntegrationDashboard', () => {
  beforeEach(() => {
    mockUseIntegrations.mockReturnValue(mockHookReturn);
    jest.clearAllMocks();
  });

  it('deve renderizar o dashboard com integrações', () => {
    render(<IntegrationDashboard />);
    
    expect(screen.getByText('Integrações Externas')).toBeInTheDocument();
    expect(screen.getByText('Sistema ERP')).toBeInTheDocument();
    expect(screen.getByText('Gateway Pagamento')).toBeInTheDocument();
  });

  it('deve mostrar estatísticas corretas', () => {
    render(<IntegrationDashboard />);
    
    // 1 integração ativa (connected)
    expect(screen.getByText('1')).toBeInTheDocument();
    // 1 integração com erro
    expect(screen.getByText('1')).toBeInTheDocument();
    // 2 integrações no total
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deve mostrar loading quando carregando', () => {
    mockUseIntegrations.mockReturnValue({
      ...mockHookReturn,
      isLoading: true
    });

    render(<IntegrationDashboard />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve mostrar erro quando há erro', () => {
    mockUseIntegrations.mockReturnValue({
      ...mockHookReturn,
      error: 'Erro de conexão'
    });

    render(<IntegrationDashboard />);
    
    expect(screen.getByText('Erro: Erro de conexão')).toBeInTheDocument();
  });

  it('deve abrir modal de configuração ao clicar em Nova Integração', () => {
    render(<IntegrationDashboard />);
    
    fireEvent.click(screen.getByText('Nova Integração'));
    
    expect(screen.getByTestId('api-config-form')).toBeInTheDocument();
  });

  it('deve testar conexão quando clicado', async () => {
    mockHookReturn.testConnection.mockResolvedValue({
      success: true,
      responseTime: 100,
      timestamp: new Date()
    });

    render(<IntegrationDashboard />);
    
    const testButtons = screen.getAllByText('Testar');
    fireEvent.click(testButtons[0]);

    await waitFor(() => {
      expect(mockHookReturn.testConnection).toHaveBeenCalledWith('1');
    });
  });

  it('deve sincronizar dados quando clicado', async () => {
    mockHookReturn.syncData.mockResolvedValue({
      success: true,
      recordsProcessed: 50,
      duration: 1000,
      timestamp: new Date()
    });

    render(<IntegrationDashboard />);
    
    const syncButtons = screen.getAllByText('Sincronizar');
    fireEvent.click(syncButtons[0]);

    await waitFor(() => {
      expect(mockHookReturn.syncData).toHaveBeenCalledWith('1');
    });
  });

  it('deve mostrar logs de erro quando existem', () => {
    render(<IntegrationDashboard />);
    
    expect(screen.getByText('Últimos Erros:')).toBeInTheDocument();
    expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há integrações', () => {
    mockUseIntegrations.mockReturnValue({
      ...mockHookReturn,
      integrations: []
    });

    render(<IntegrationDashboard />);
    
    expect(screen.getByText('Nenhuma integração configurada')).toBeInTheDocument();
  });

  it('deve abrir editor de mapeamento ao clicar em Mapeamento', () => {
    render(<IntegrationDashboard />);
    
    const mappingButtons = screen.getAllByText('Mapeamento');
    fireEvent.click(mappingButtons[0]);
    
    expect(screen.getByTestId('data-mapping-editor')).toBeInTheDocument();
  });

  it('deve fechar modais ao cancelar', () => {
    render(<IntegrationDashboard />);
    
    // Abrir modal de configuração
    fireEvent.click(screen.getByText('Nova Integração'));
    expect(screen.getByTestId('api-config-form')).toBeInTheDocument();
    
    // Cancelar
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('api-config-form')).not.toBeInTheDocument();
  });

  it('deve salvar nova integração', async () => {
    mockHookReturn.createIntegration.mockResolvedValue(mockIntegrations[0]);

    render(<IntegrationDashboard />);
    
    // Abrir modal de configuração
    fireEvent.click(screen.getByText('Nova Integração'));
    
    // Salvar
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockHookReturn.createIntegration).toHaveBeenCalledWith({
        name: 'Test Integration'
      });
    });
  });

  it('deve desabilitar botão de sincronização para integrações desconectadas', () => {
    render(<IntegrationDashboard />);
    
    const syncButtons = screen.getAllByText('Sincronizar');
    
    // Primeira integração (connected) deve estar habilitada
    expect(syncButtons[0]).not.toBeDisabled();
    
    // Segunda integração (error) deve estar desabilitada
    expect(syncButtons[1]).toBeDisabled();
  });
});