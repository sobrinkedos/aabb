import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagementPanel } from '../UserManagementPanel';
import { useUserManagement } from '../../../hooks/useUserManagement';

// Mock do hook
vi.mock('../../../hooks/useUserManagement');

const mockUseUserManagement = vi.mocked(useUserManagement);

const mockUsers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@teste.com',
    role: { id: '1', name: 'Administrador', description: 'Admin', defaultPermissions: [] },
    department: 'TI',
    permissions: [],
    lastLogin: new Date('2024-01-15'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@teste.com',
    role: { id: '2', name: 'Funcionário', description: 'Func', defaultPermissions: [] },
    department: 'Atendimento',
    permissions: [],
    lastLogin: null,
    isActive: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

const mockRoles = [
  { id: '1', name: 'Administrador', description: 'Administrador do sistema', defaultPermissions: [] },
  { id: '2', name: 'Funcionário', description: 'Funcionário padrão', defaultPermissions: [] }
];

describe('UserManagementPanel', () => {
  beforeEach(() => {
    mockUseUserManagement.mockReturnValue({
      users: mockUsers,
      roles: mockRoles,
      isLoading: false,
      error: null,
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      assignRole: vi.fn(),
      updatePermissions: vi.fn(),
      refreshData: vi.fn()
    });
  });

  it('deve renderizar o painel de gerenciamento de usuários', () => {
    render(<UserManagementPanel />);
    
    expect(screen.getByText('Gerenciamento de Usuários')).toBeInTheDocument();
    expect(screen.getByText('Gerencie usuários, funções e permissões do sistema')).toBeInTheDocument();
  });

  it('deve mostrar as abas de navegação', () => {
    render(<UserManagementPanel />);
    
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Funções')).toBeInTheDocument();
    expect(screen.getByText('Permissões')).toBeInTheDocument();
    expect(screen.getByText('Logs de Acesso')).toBeInTheDocument();
  });

  it('deve exibir a lista de usuários por padrão', () => {
    render(<UserManagementPanel />);
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@teste.com')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('maria@teste.com')).toBeInTheDocument();
  });

  it('deve mostrar o status correto dos usuários', () => {
    render(<UserManagementPanel />);
    
    const activeStatus = screen.getByText('Ativo');
    const inactiveStatus = screen.getByText('Inativo');
    
    expect(activeStatus).toBeInTheDocument();
    expect(inactiveStatus).toBeInTheDocument();
  });

  it('deve mostrar o último login dos usuários', () => {
    render(<UserManagementPanel />);
    
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
    expect(screen.getByText('Nunca')).toBeInTheDocument();
  });

  it('deve abrir o modal de novo usuário ao clicar no botão', () => {
    render(<UserManagementPanel />);
    
    const newUserButton = screen.getByText('Novo Usuário');
    fireEvent.click(newUserButton);
    
    expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('deve permitir preencher o formulário de novo usuário', () => {
    render(<UserManagementPanel />);
    
    const newUserButton = screen.getByText('Novo Usuário');
    fireEvent.click(newUserButton);
    
    const nameInput = screen.getByLabelText('Nome');
    const emailInput = screen.getByLabelText('Email');
    const departmentInput = screen.getByLabelText('Departamento');
    
    fireEvent.change(nameInput, { target: { value: 'Novo Usuário' } });
    fireEvent.change(emailInput, { target: { value: 'novo@teste.com' } });
    fireEvent.change(departmentInput, { target: { value: 'Vendas' } });
    
    expect(nameInput).toHaveValue('Novo Usuário');
    expect(emailInput).toHaveValue('novo@teste.com');
    expect(departmentInput).toHaveValue('Vendas');
  });

  it('deve chamar createUser ao submeter o formulário', async () => {
    const mockCreateUser = vi.fn().mockResolvedValue({});
    mockUseUserManagement.mockReturnValue({
      ...mockUseUserManagement(),
      createUser: mockCreateUser
    });

    render(<UserManagementPanel />);
    
    const newUserButton = screen.getByText('Novo Usuário');
    fireEvent.click(newUserButton);
    
    const nameInput = screen.getByLabelText('Nome');
    const emailInput = screen.getByLabelText('Email');
    const departmentInput = screen.getByLabelText('Departamento');
    const roleSelect = screen.getByLabelText('Função');
    
    fireEvent.change(nameInput, { target: { value: 'Novo Usuário' } });
    fireEvent.change(emailInput, { target: { value: 'novo@teste.com' } });
    fireEvent.change(departmentInput, { target: { value: 'Vendas' } });
    fireEvent.change(roleSelect, { target: { value: '1' } });
    
    const createButton = screen.getByText('Criar Usuário');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'Novo Usuário',
        email: 'novo@teste.com',
        department: 'Vendas',
        roleId: '1',
        isActive: true
      });
    });
  });

  it('deve mostrar loading quando isLoading for true', () => {
    mockUseUserManagement.mockReturnValue({
      ...mockUseUserManagement(),
      isLoading: true
    });

    render(<UserManagementPanel />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve mostrar erro quando error não for null', () => {
    mockUseUserManagement.mockReturnValue({
      ...mockUseUserManagement(),
      error: 'Erro de teste'
    });

    render(<UserManagementPanel />);
    
    expect(screen.getByText('Erro: Erro de teste')).toBeInTheDocument();
  });

  it('deve permitir alternar entre as abas', () => {
    render(<UserManagementPanel />);
    
    const rolesTab = screen.getByText('Funções');
    fireEvent.click(rolesTab);
    
    // Verifica se a aba de funções está ativa
    expect(rolesTab.closest('button')).toHaveClass('text-blue-600');
  });

  it('deve confirmar antes de excluir usuário', () => {
    const mockDeleteUser = vi.fn();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    mockUseUserManagement.mockReturnValue({
      ...mockUseUserManagement(),
      deleteUser: mockDeleteUser
    });

    render(<UserManagementPanel />);
    
    const deleteButtons = screen.getAllByText('Excluir');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este usuário?');
    expect(mockDeleteUser).toHaveBeenCalledWith('1');
    
    mockConfirm.mockRestore();
  });

  it('deve mostrar contadores nas abas', () => {
    render(<UserManagementPanel />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Contador de usuários
    expect(screen.getByText('2')).toBeInTheDocument(); // Contador de funções
  });
});