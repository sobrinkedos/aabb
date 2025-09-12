import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, User, Phone, Mail, Calendar, Badge, Eye, Edit, Trash2, Save, X } from 'lucide-react';
import { useBarEmployees, NewBarEmployeeData, UpdateBarEmployeeData } from '../../hooks/useBarEmployees';
import { BarEmployee } from '../../types';

const BarEmployeesModule: React.FC = () => {
  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    filterEmployees,
    getStats
  } = useBarEmployees();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<BarEmployee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState<NewBarEmployeeData>({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    bar_role: 'atendente',
    shift_preference: 'qualquer',
    specialties: [],
    commission_rate: 0,
    notes: ''
  });
  
  const [editFormData, setEditFormData] = useState<UpdateBarEmployeeData>({});

  // Filtrar funcionários usando o hook
  const filteredEmployees = filterEmployees(searchTerm, roleFilter, statusFilter);
  
  // Estatísticas usando o hook
  const stats = getStats();

  // Funções do formulário de novo funcionário
  const handleCreateEmployee = async () => {
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do funcionário');
      return;
    }

    setProcessing(true);
    try {
      await createEmployee(formData);
      setShowNewEmployeeModal(false);
      resetForm();
      alert('Funcionário cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      alert('Erro ao cadastrar funcionário. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Funções do formulário de edição
  const handleEditEmployee = (employee: BarEmployee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      name: employee.employee?.name || '',
      cpf: employee.employee?.cpf || '',
      email: employee.employee?.email || '',
      phone: employee.employee?.phone || '',
      bar_role: employee.bar_role,
      shift_preference: employee.shift_preference,
      specialties: employee.specialties || [],
      commission_rate: employee.commission_rate,
      notes: employee.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    setProcessing(true);
    try {
      await updateEmployee(selectedEmployee.id, editFormData);
      setShowEditModal(false);
      setSelectedEmployee(null);
      setEditFormData({});
      alert('Funcionário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      alert('Erro ao atualizar funcionário. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Função para desativar funcionário
  const handleDeactivateEmployee = async (employee: BarEmployee) => {
    const confirmed = confirm(`Tem certeza que deseja desativar o funcionário ${employee.employee?.name}?`);
    if (!confirmed) return;

    try {
      await deactivateEmployee(employee.id);
      alert('Funcionário desativado com sucesso!');
    } catch (error) {
      console.error('Erro ao desativar funcionário:', error);
      alert('Erro ao desativar funcionário. Tente novamente.');
    }
  };

  // Função para reativar funcionário
  const handleReactivateEmployee = async (employee: BarEmployee) => {
    const confirmed = confirm(`Tem certeza que deseja reativar o funcionário ${employee.employee?.name}?`);
    if (!confirmed) return;

    try {
      await reactivateEmployee(employee.id);
      alert('Funcionário reativado com sucesso!');
    } catch (error) {
      console.error('Erro ao reativar funcionário:', error);
      alert('Erro ao reativar funcionário. Tente novamente.');
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      cpf: '',
      email: '',
      phone: '',
      bar_role: 'atendente',
      shift_preference: 'qualquer',
      specialties: [],
      commission_rate: 0,
      notes: ''
    });
  };

  const handleViewDetails = (employee: BarEmployee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return 'Não informado';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'atendente': return '👥';
      case 'garcom': return '🍽️';
      case 'cozinheiro': return '👨‍🍳';
      case 'barman': return '🍹';
      case 'gerente': return '👔';
      default: return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'atendente': return 'bg-blue-100 text-blue-800';
      case 'garcom': return 'bg-green-100 text-green-800';
      case 'cozinheiro': return 'bg-orange-100 text-orange-800';
      case 'barman': return 'bg-purple-100 text-purple-800';
      case 'gerente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'atendente': return 'Atendente';
      case 'garcom': return 'Garçom';
      case 'cozinheiro': return 'Cozinheiro';
      case 'barman': return 'Barman';
      case 'gerente': return 'Gerente';
      default: return role;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Exibir erro se houver */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Funcionários do Bar</h1>
          <p className="text-gray-600 mt-1">Gerencie a equipe do bar e suas funções</p>
        </div>
        <button
          onClick={() => setShowNewEmployeeModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Ativos</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">👥 {stats.byRole.atendente}</div>
            <div className="text-sm text-gray-600">Atendentes</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">🍽️ {stats.byRole.garcom}</div>
            <div className="text-sm text-gray-600">Garçons</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">👨‍🍳 {stats.byRole.cozinheiro}</div>
            <div className="text-sm text-gray-600">Cozinheiros</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">🍹 {stats.byRole.barman}</div>
            <div className="text-sm text-gray-600">Barmans</div>
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Funções</option>
              <option value="atendente">Atendente</option>
              <option value="garcom">Garçom</option>
              <option value="cozinheiro">Cozinheiro</option>
              <option value="barman">Barman</option>
              <option value="gerente">Gerente</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando funcionários...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum funcionário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função no Bar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Contratação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((barEmployee) => {
                  const employee = barEmployee.employee;
                  if (!employee) return null;
                  
                  return (
                    <motion.tr
                      key={barEmployee.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.cpf || 'CPF não informado'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(barEmployee.bar_role)}`}>
                          <span className="mr-1">{getRoleIcon(barEmployee.bar_role)}</span>
                          {getRoleName(barEmployee.bar_role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPhone(employee.phone || null)}</div>
                        <div className="text-sm text-gray-500">{employee.email || 'Email não informado'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          barEmployee.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {barEmployee.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.hire_date ? 
                          new Date(employee.hire_date).toLocaleDateString('pt-BR') : 
                          'Não informado'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(barEmployee)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditEmployee(barEmployee)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Editar funcionário"
                          >
                            <Edit size={16} />
                          </button>
                          {barEmployee.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivateEmployee(barEmployee)}
                              className="text-red-600 hover:text-red-900"
                              title="Desativar funcionário"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateEmployee(barEmployee)}
                              className="text-green-600 hover:text-green-900"
                              title="Reativar funcionário"
                            >
                              <User size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Funcionário */}
      {showDetailsModal && selectedEmployee && selectedEmployee.employee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalhes do Funcionário</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmployee.employee.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Função no Bar</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedEmployee.bar_role)}`}>
                      <span className="mr-1">{getRoleIcon(selectedEmployee.bar_role)}</span>
                      {getRoleName(selectedEmployee.bar_role)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <p className="mt-1 text-sm text-gray-900">{formatPhone(selectedEmployee.employee?.phone || null)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmployee.employee.email || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CPF</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmployee.employee.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedEmployee.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEmployee.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Contratação</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEmployee.employee.hire_date ? 
                      new Date(selectedEmployee.employee.hire_date).toLocaleDateString('pt-BR') : 
                      'Não informado'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cadastrado no Bar em</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEmployee.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {selectedEmployee.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmployee.notes}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Funcionário */}
      {showNewEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Funcionário</h3>
              <button
                onClick={() => setShowNewEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                <select 
                  value={formData.bar_role}
                  onChange={(e) => setFormData(prev => ({ ...prev, bar_role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="atendente">Atendente</option>
                  <option value="garcom">Garçom</option>
                  <option value="cozinheiro">Cozinheiro</option>
                  <option value="barman">Barman</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno Preferido</label>
                <select 
                  value={formData.shift_preference}
                  onChange={(e) => setFormData(prev => ({ ...prev, shift_preference: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="qualquer">Qualquer</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewEmployeeModal(false);
                  resetForm();
                }}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEmployee}
                disabled={processing || !formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Cadastrar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Funcionário */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Funcionário</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setEditFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={editFormData.cpf || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                <select 
                  value={editFormData.bar_role || 'atendente'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bar_role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="atendente">Atendente</option>
                  <option value="garcom">Garçom</option>
                  <option value="cozinheiro">Cozinheiro</option>
                  <option value="barman">Barman</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno Preferido</label>
                <select 
                  value={editFormData.shift_preference || 'qualquer'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, shift_preference: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="qualquer">Qualquer</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editFormData.commission_rate || 0}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={editFormData.is_active !== undefined ? (editFormData.is_active ? 'active' : 'inactive') : 'active'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setEditFormData({});
                }}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateEmployee}
                disabled={processing || !editFormData.name?.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarEmployeesModule;