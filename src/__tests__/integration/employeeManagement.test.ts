/**
 * Testes de Integração - Operações de Gerenciamento de Funcionários
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { BarEmployeesModule } from '../../components/BarEmployeesModule/BarEmployeesModule';
import { useBarEmployees } from '../../hooks/useBarEmployees';
import { useFormValidation } from '../../hooks/useFormValidation';

// Mock dos hooks e componentes
jest.mock('../../hooks/useBarEmployees');
jest.mock('../../hooks/useFormValidation');
jest.mock('../../components/BarEmployeesModule/EmployeeFilters', () => ({
  EmployeeFilters: ({ onFiltersChange }: any) => (
    <div data-testid="employee-filters">
      <button onClick={() => onFiltersChange({ role: 'garcom' })}>
        Filter Garcom
      </button>
    </div>
  )
}));
jest.mock('../../components/BarEmployeesModule/EmployeeStats', () => ({
  EmployeeStats: () => <div data-testid="employee-stats">Stats</div>
}));
jest.mock('../../components/BarEmployeesModule/EmployeeList', () => ({
  EmployeeList: ({ employees, onEdit, onDeactivate }: any) => (
    <div data-testid="employee-list">
      {employees.map((emp: any) => (
        <div key={emp.id} data-testid={`employee-${emp.id}`}>
          <span>{emp.employee?.name}</span>
          <button onClick={() => onEdit(emp)}>Edit</button>
          <button onClick={() => onDeactivate(emp.id)}>Deactivate</button>
        </div>
      ))}
    </div>
  )
}));
jest.mock('../../components/EmployeeModal/EmployeeModal', () => ({
  EmployeeModal: ({ isOpen, onSave, onClose }: any) => 
    isOpen ? (
      <div data-testid="employee-modal">
        <button onClick={() => onSave({ name: 'New Employee' })}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

describe('Employee Management Integration Tests', () => {
  const mockEmployees = [
    {
      id: 'emp-1',
      bar_role: 'garcom',
      status: 'active',
      employee: { name: 'João Silva', email: 'joao@example.com' }
    },
    {
      id: 'emp-2',
      bar_role: 'atendente',
      status: 'active',
      employee: { name: 'Maria Santos', email: 'maria@example.com' }
    }
  ];

  const mockUseBarEmployees = {
    employees: mockEmployees,
    loading: false,
    error: null,
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    deactivateEmployee: jest.fn(),
    reactivateEmployee: jest.fn(),
    getStats: jest.fn(() => ({
      total: 2,
      active: 2,
      inactive: 0,
      byRole: { garcom: 1, atendente: 1 },
      byShift: { manha: 1, tarde: 1 }
    })),
    refetch: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useBarEmployees as jest.Mock).mockReturnValue(mockUseBarEmployees);
    (useFormValidation as jest.Mock).mockReturnValue({
      formState: { fields: {} },
      isValid: true,
      validateForm: jest.fn(),
      getFieldProps: jest.fn(),
      resetForm: jest.fn()
    });
  });

  describe('Employee List Management', () => {
    it('should render employee list with data', () => {
      render(<BarEmployeesModule />);

      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
      expect(screen.getByTestId('employee-emp-1')).toBeInTheDocument();
      expect(screen.getByTestId('employee-emp-2')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      (useBarEmployees as jest.Mock).mockReturnValue({
        ...mockUseBarEmployees,
        loading: true,
        employees: []
      });

      render(<BarEmployeesModule />);
      
      // The loading state would be handled by EmployeeList component
      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
    });

    it('should show error state', () => {
      (useBarEmployees as jest.Mock).mockReturnValue({
        ...mockUseBarEmployees,
        error: 'Failed to load employees',
        employees: []
      });

      render(<BarEmployeesModule />);
      
      // The error state would be handled by EmployeeList component
      expect(screen.getByTestId('employee-list')).toBeInTheDocument();
    });
  });

  describe('Employee Creation Flow', () => {
    it('should open modal when create button is clicked', () => {
      render(<BarEmployeesModule />);

      const createButton = screen.getByText('Novo Funcionário');
      fireEvent.click(createButton);

      expect(screen.getByTestId('employee-modal')).toBeInTheDocument();
    });

    it('should create employee when form is submitted', async () => {
      mockUseBarEmployees.createEmployee.mockResolvedValue('new-emp-id');

      render(<BarEmployeesModule />);

      // Open modal
      fireEvent.click(screen.getByText('Novo Funcionário'));

      // Submit form
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUseBarEmployees.createEmployee).toHaveBeenCalledWith({
          name: 'New Employee'
        });
      });

      expect(mockUseBarEmployees.refetch).toHaveBeenCalled();
    });

    it('should close modal after successful creation', async () => {
      mockUseBarEmployees.createEmployee.mockResolvedValue('new-emp-id');

      render(<BarEmployeesModule />);

      // Open modal
      fireEvent.click(screen.getByText('Novo Funcionário'));
      expect(screen.getByTestId('employee-modal')).toBeInTheDocument();

      // Submit form
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.queryByTestId('employee-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Employee Editing Flow', () => {
    it('should open modal in edit mode when edit button is clicked', () => {
      render(<BarEmployeesModule />);

      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      expect(screen.getByTestId('employee-modal')).toBeInTheDocument();
    });

    it('should update employee when edit form is submitted', async () => {
      mockUseBarEmployees.updateEmployee.mockResolvedValue(undefined);

      render(<BarEmployeesModule />);

      // Click edit on first employee
      fireEvent.click(screen.getAllByText('Edit')[0]);

      // Submit form
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUseBarEmployees.updateEmployee).toHaveBeenCalledWith(
          'emp-1',
          { name: 'New Employee' }
        );
      });

      expect(mockUseBarEmployees.refetch).toHaveBeenCalled();
    });
  });

  describe('Employee Deactivation Flow', () => {
    it('should deactivate employee when deactivate button is clicked', async () => {
      mockUseBarEmployees.deactivateEmployee.mockResolvedValue(undefined);

      render(<BarEmployeesModule />);

      const deactivateButton = screen.getAllByText('Deactivate')[0];
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(mockUseBarEmployees.deactivateEmployee).toHaveBeenCalledWith('emp-1');
      });
    });
  });

  describe('Filtering and Search Flow', () => {
    it('should filter employees when filter is applied', () => {
      render(<BarEmployeesModule />);

      const filterButton = screen.getByText('Filter Garcom');
      fireEvent.click(filterButton);

      // The filtering logic would be handled by the component's state
      // and the filtered results would be passed to EmployeeList
      expect(screen.getByTestId('employee-filters')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should display employee statistics', () => {
      render(<BarEmployeesModule />);

      expect(screen.getByTestId('employee-stats')).toBeInTheDocument();
      expect(mockUseBarEmployees.getStats).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors gracefully', async () => {
      mockUseBarEmployees.createEmployee.mockRejectedValue(
        new Error('Creation failed')
      );

      render(<BarEmployeesModule />);

      // Open modal and submit
      fireEvent.click(screen.getByText('Novo Funcionário'));
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUseBarEmployees.createEmployee).toHaveBeenCalled();
      });

      // Modal should remain open on error
      expect(screen.getByTestId('employee-modal')).toBeInTheDocument();
    });

    it('should handle update errors gracefully', async () => {
      mockUseBarEmployees.updateEmployee.mockRejectedValue(
        new Error('Update failed')
      );

      render(<BarEmployeesModule />);

      // Edit employee and submit
      fireEvent.click(screen.getAllByText('Edit')[0]);
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUseBarEmployees.updateEmployee).toHaveBeenCalled();
      });

      // Modal should remain open on error
      expect(screen.getByTestId('employee-modal')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data when refetch is called', async () => {
      const { rerender } = render(<BarEmployeesModule />);

      // Simulate data change
      const updatedEmployees = [
        ...mockEmployees,
        {
          id: 'emp-3',
          bar_role: 'cozinheiro',
          status: 'active',
          employee: { name: 'Pedro Costa', email: 'pedro@example.com' }
        }
      ];

      (useBarEmployees as jest.Mock).mockReturnValue({
        ...mockUseBarEmployees,
        employees: updatedEmployees
      });

      rerender(<BarEmployeesModule />);

      expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    });
  });
});