import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, User, Phone, Mail, Calendar, Badge, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarEmployee } from '../../types';

const BarEmployeesModule: React.FC = () => {
  const [employees, setEmployees] = useState<BarEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<BarEmployee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);

  // Carregar funcionários do bar
  const loadBarEmployees = async () => {
    setLoading(true);
    
    try {
      // Buscar funcionários do bar sem join para evitar problemas de RLS
      const { data: barEmployeesData, error: barError } = await supabase
        .from('bar_employees')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (barError) throw barError;
      
      // Criar dados mock para funcionários enquanto o RLS não é corrigido
      const employeesWithMockData = (barEmployeesData || []).map((barEmp, index) => ({
        ...barEmp,
        employee: {
          id: barEmp.employee_id,
          name: `Funcionário ${index + 1}`,
          cpf: '000.000.000-00',
          email: `funcionario${index + 1}@aabb.com`,
          phone: `(11) 9999-${String(index + 1).padStart(4, '0')}`,
          hire_date: '2024-01-01',
          status: 'active'
        }
      }));
      
      setEmployees(employeesWithMockData);
    } catch (error) {
      console.error('Erro ao carregar funcionários do bar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarEmployees();
  }, []);

  // Filtrar funcionários
  const filteredEmployees = employees.filter(emp => {
    const employee = emp.employee;
    if (!employee) return false;
    
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.phone?.includes(searchTerm) ||
                         (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || emp.bar_role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    atendentes: employees.filter(e => e.bar_role === 'atendente').length,
    garcons: employees.filter(e => e.bar_role === 'garcom').length,
    cozinheiros: employees.filter(e => e.bar_role === 'cozinheiro').length,
    barmans: employees.filter(e => e.bar_role === 'barman').length,
    gerentes: employees.filter(e => e.bar_role === 'gerente').length
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
            <div className="text-xl font-bold text-blue-600">👥 {stats.atendentes}</div>
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
            <div className="text-xl font-bold text-green-600">🍽️ {stats.garcons}</div>
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
            <div className="text-xl font-bold text-orange-600">👨‍🍳 {stats.cozinheiros}</div>
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
            <div className="text-xl font-bold text-purple-600">🍹 {stats.barmans}</div>
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
                        <div className="text-sm text-gray-900">{formatPhone(employee.phone)}</div>
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
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit size={16} />
                          </button>
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
                  <p className="mt-1 text-sm text-gray-900">{formatPhone(selectedEmployee.employee.phone)}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione uma função</option>
                  <option value="atendente">Atendente</option>
                  <option value="garcom">Garçom</option>
                  <option value="cozinheiro">Cozinheiro</option>
                  <option value="barman">Barman</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewEmployeeModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // TODO: Implementar lógica de cadastro
                  alert('Funcionalidade em desenvolvimento');
                  setShowNewEmployeeModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarEmployeesModule;