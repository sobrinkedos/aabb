import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Key, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useEmployeeTwoStep } from '../../hooks/useEmployeeTwoStep';
import { useAuth } from '../../contexts/AuthContextSimple';
import { BasicEmployeeData } from '../../services/employee-basic-service';
import { CredentialsModal } from '../CredentialsModal';
import { PositionsService, Department, Position } from '../../services/positions-service';

interface EmployeeManagementPanelProps {
  className?: string;
}

export const EmployeeManagementPanel: React.FC<EmployeeManagementPanelProps> = ({ className }) => {
  const { user } = useAuth();
  const empresaId = user?.user_metadata?.empresa_id;

  const {
    isLoading,
    error,
    basicEmployees,
    employeesWithCredentials,
    createBasicEmployee,
    assignCredentials,
    removeCredentials,
    updateBasicEmployee,
    loadAllEmployees,
    clearError
  } = useEmployeeTwoStep(empresaId);

  const [activeTab, setActiveTab] = useState<'basic' | 'credentials'>('basic');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const [employeeForm, setEmployeeForm] = useState<BasicEmployeeData>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    position_id: '',
    department_id: '',
    employee_code: ''
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const positionsService = new PositionsService();

  useEffect(() => {
    if (empresaId) {
      loadAllEmployees();
      loadDepartmentsAndPositions();
    }
  }, [empresaId, loadAllEmployees]);

  const loadDepartmentsAndPositions = async () => {
    try {
      const [deptResult, posResult] = await Promise.all([
        positionsService.getDepartments(),
        positionsService.getPositions()
      ]);

      if (deptResult.success && deptResult.departments) {
        setDepartments(deptResult.departments);
      }

      if (posResult.success && posResult.positions) {
        setPositions(posResult.positions);
        setFilteredPositions(posResult.positions);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos e posições:', error);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    setEmployeeForm(prev => ({ ...prev, department_id: departmentId, position_id: '' }));
    
    if (departmentId) {
      const filtered = positions.filter(pos => pos.department_id === departmentId);
      setFilteredPositions(filtered);
    } else {
      setFilteredPositions(positions);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createBasicEmployee(employeeForm);
      
      if (result.success) {
        setShowEmployeeForm(false);
        resetForm();
        
        // Mensagem de sucesso será mostrada pelo componente pai
        console.log('✅ Funcionário criado com sucesso:', result.employee);
      }
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
    }
  };

  const handleAssignCredentials = async (employee: any) => {
    try {
      const result = await assignCredentials(employee.id);
      
      if (result.success && result.credentials) {
        setGeneratedCredentials(result.credentials);
        setSelectedEmployee(employee);
        setShowCredentialsModal(true);
      }
    } catch (error) {
      console.error('Erro ao atribuir credenciais:', error);
    }
  };

  const handleRemoveCredentials = async (employee: any) => {
    if (window.confirm(`Tem certeza que deseja remover as credenciais de acesso de ${employee.nome_completo}?`)) {
      try {
        await removeCredentials(employee.id);
      } catch (error) {
        console.error('Erro ao remover credenciais:', error);
      }
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEmployee) return;
    
    try {
      const result = await updateBasicEmployee(editingEmployee.id, employeeForm);
      
      if (result.success) {
        setEditingEmployee(null);
        resetForm();
        setShowEmployeeForm(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
    }
  };

  const startEditing = (employee: any) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      cpf: employee.cpf || '',
      position_id: employee.position_id,
      department_id: employee.department_id,
      employee_code: employee.employee_code
    });
    
    // Filtrar posições pelo departamento
    if (employee.department_id) {
      const filtered = positions.filter(pos => pos.department_id === employee.department_id);
      setFilteredPositions(filtered);
    }
    
    setShowEmployeeForm(true);
  };

  const resetForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      position_id: '',
      department_id: '',
      employee_code: ''
    });
    setFilteredPositions(positions);
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
    setShowEmployeeForm(false);
    resetForm();
  };

  if (!empresaId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erro: Empresa não identificada</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Gestão de Funcionários
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sistema de duas etapas: Criar funcionário → Atribuir credenciais
            </p>
          </div>
          <button
            onClick={() => loadAllEmployees()}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Funcionários Básicos
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {basicEmployees.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="w-4 h-4 mr-2" />
            Com Credenciais
            <span className="ml-2 bg-green-100 text-green-900 py-0.5 px-2.5 rounded-full text-xs">
              {employeesWithCredentials.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'basic' && (
          <div>
            {/* Basic Employees Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Etapa 1: Funcionários Básicos</h3>
                <p className="text-sm text-gray-600">
                  Funcionários cadastrados sem credenciais de acesso ao sistema
                </p>
              </div>
              <button
                onClick={() => setShowEmployeeForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </button>
            </div>

            {/* Basic Employees Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {basicEmployees.map(employee => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                          <div className="text-sm text-gray-400">Código: {employee.employee_code}</div>
                          {employee.cpf && <div className="text-sm text-gray-400">CPF: {employee.cpf}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.position?.name || 'N/A'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{employee.department?.name || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Sem credenciais
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleAssignCredentials(employee)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center"
                          disabled={isLoading}
                        >
                          <Key className="w-3 h-3 mr-1" />
                          Criar Credenciais
                        </button>
                        <button
                          onClick={() => startEditing(employee)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              
              {basicEmployees.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Nenhum funcionário básico cadastrado</p>
                  <button
                    onClick={() => setShowEmployeeForm(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Cadastrar primeiro funcionário →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div>
            {/* Employees with Credentials Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Etapa 2: Funcionários com Credenciais</h3>
                <p className="text-sm text-gray-600">
                  Funcionários que possuem acesso ao sistema
                </p>
              </div>
            </div>

            {/* Employees with Credentials Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credenciais Criadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeesWithCredentials.map(employee => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                          <div className="text-sm text-gray-400">Código: {employee.employee_code}</div>
                          {employee.cpf && <div className="text-sm text-gray-400">CPF: {employee.cpf}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.position?.name || 'N/A'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{employee.department?.name || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.data_credenciais_criadas 
                          ? new Date(employee.data_credenciais_criadas).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Com acesso
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEditing(employee)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleRemoveCredentials(employee)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remover Acesso
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              
              {employeesWithCredentials.length === 0 && (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Nenhum funcionário com credenciais ainda</p>
                  <p className="text-sm text-gray-400">
                    Crie funcionários básicos primeiro, depois atribua credenciais
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
              
              <form onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={employeeForm.name}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={employeeForm.cpf}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, cpf: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={employeeForm.phone}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código do Funcionário
                    </label>
                    <input
                      type="text"
                      value={employeeForm.employee_code}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, employee_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Deixe vazio para gerar automaticamente"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento *
                    </label>
                    <select
                      required
                      value={employeeForm.department_id}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição *
                    </label>
                    <select
                      required
                      value={employeeForm.position_id}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, position_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!employeeForm.department_id}
                    >
                      <option value="">Selecione uma posição</option>
                      {filteredPositions.map(pos => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                    </select>
                    {!employeeForm.department_id && (
                      <p className="text-xs text-gray-500 mt-1">Selecione um departamento primeiro</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Salvando...' : editingEmployee ? 'Atualizar' : 'Criar Funcionário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && selectedEmployee && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false);
            setGeneratedCredentials(null);
            setSelectedEmployee(null);
          }}
          credentials={{
            system: {
              email: generatedCredentials.email,
              password: generatedCredentials.temporaryPassword
            }
          }}
          employeeName={selectedEmployee.nome_completo}
        />
      )}
    </div>
  );
};