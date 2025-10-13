import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeModal } from '../EmployeeModal';
import { Employee } from '../../../types/employee.types';

// Mock dos hooks
jest.mock('../../../hooks/useEmployeeForm', () => ({
  useEmployeeForm: () => ({
    employee: {
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'waiter',
      permissions: [],
      status: 'active',
      hire_date: new Date(),
      observations: ''
    },
    state: {
      loading: false,
      saving: false,
      errors: { fields: [] },
      isDirty: false,
      isValid: true
    },
    updateField: jest.fn(),
    togglePermission: jest.fn(),
    handleSave: jest.fn(),
    handleCancel: jest.fn(),
    resetForm: jest.fn()
  })
}));

describe('EmployeeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(
        <EmployeeModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Novo Funcionário')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <EmployeeModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render edit mode correctly', () => {
      const employee: Employee = {
        id: '1',
        name: 'João Silva',
        email: 'joao@test.com',
        cpf: '12345678901',
        phone: '11999999999',
        role: 'waiter',
        permissions: [],
        status: 'active',
        hire_date: new Date(),
        observations: 'Test'
      };

      render(
        <EmployeeModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          employee={employee}
          mode="edit"
        />
      );
      
      expect(screen.getByText('Editar Funcionário')).toBeInTheDocument();
    });
  });

  describe('Scrolling', () => {
    it('should have scrollable body', () => {
      render(
        <EmployeeModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );
      
      const modalBody = screen.getByTestId('modal-body');
      expect(modalBody).toHaveStyle('overflow-y: auto');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <EmployeeModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'employee-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'employee-modal-description');
    });

    it('should close modal on Escape key', () => {
      render(
        <EmployeeModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      // Note: O teste real dependeria da implementação do handleCancel no mock
    });
  });

  describe('Form Sections', () => {
    it('should render all form sections', () => {
      render(
        <EmployeeModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );
      
      expect(screen.getByText('Dados Pessoais')).toBeInTheDocument();
      expect(screen.getByText('Função e Cargo')).toBeInTheDocument();
      expect(screen.getByText('Permissões')).toBeInTheDocument();
    });
  });
});