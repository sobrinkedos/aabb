import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, User, Phone, Mail, Calendar, Badge, Eye, Edit, Trash2, Save, X, Settings } from 'lucide-react';
import { useBarEmployees, NewBarEmployeeData, UpdateBarEmployeeData } from '../../hooks/useBarEmployees';
import { useEmployeeCreation } from '../../hooks/useEmployeeCreation';
import { BarEmployee } from '../../types';
import { EmployeeModal, TwoStepEmployeeModal } from '../../components/EmployeeModal';
import { BasicEmployeeModal } from '../../components/EmployeeModal/BasicEmployeeModal';
import { CredentialsModal as SystemCredentialsModal } from '../../components/EmployeeModal/CredentialsModal';
import { NetworkNotification } from '../../components/NetworkNotification';
import { CredentialsModal } from '../../components/CredentialsModal';
import { Employee, EmployeeRole } from '../../types/employee.types';
import { ROLE_PRESETS } from '../../utils/permissionPresets';
import { useBasicEmployeeCreation } from '../../hooks/useBasicEmployeeCreation';
import { PermissionsModal } from '../../components/EmployeeModal/PermissionsModal';
import { useEmployeePermissions } from '../../hooks/useEmployeePermissions';

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
    getStats,
    refetch
  } = useBarEmployees();

  // Hook para criação completa de funcionários com credenciais (fluxo antigo)
  const { createEmployeeWithDefaultPermissions, loading: creationLoading } = useEmployeeCreation();
  
  // Hook para novo fluxo de criação em duas etapas
  const { createBasicEmployee, addCredentialsToEmployee, loading: basicCreationLoading } = useBasicEmployeeCreation();
  
  // Hook para gerenciar permissões
  const { saveEmployeePermissions, loading: permissionsLoading } = useEmployeePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<BarEmployee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [showBasicEmployeeModal, setShowBasicEmployeeModal] = useState(false);
  const [showSystemCredentialsModal, setShowSystemCredentialsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null);
  const [credentialsEmployeeName, setCredentialsEmployeeName] = useState('');
  const [selectedEmployeeForCredentials, setSelectedEmployeeForCredentials] = useState<BarEmployee | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedEmployeeForPermissions, setSelectedEmployeeForPermissions] = useState<BarEmployee | null>(null);
  
  // Estados não são mais necessários pois o modal gerencia seu próprio estado

  // Filtrar funcionários usando o hook
  const filteredEmployees = filterEmployees(searchTerm, roleFilter, statusFilter);
  
  // Estatísticas usando o hook
  const stats = getStats();

  // Função de conversão de Employee para BarEmployee
  const convertEmployeeToBarEmployee = (employee: Employee): NewBarEmployeeData => {
    // Mapear roles do novo sistema para o antigo
    const roleMapping: Record<EmployeeRole, 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente'> = {
      waiter: 'garcom',
      cook: 'cozinheiro',
      cashier: 'atendente',
      supervisor: 'gerente',
      manager: 'gerente',
      admin: 'gerente'
    };

    return {
      name: employee.name,
      cpf: employee.cpf,
      email: employee.email,
      phone: employee.phone,
      bar_role: roleMapping[employee.role] || 'atendente',
      shift_preference: 'qualquer',
      specialties: [],
      commission_rate: 0,
      notes: employee.observations || ''
    };
  };

  // Função de conversão de BarEmployee para Employee
  const convertBarEmployeeToEmployee = (barEmployee: BarEmployee): Employee => {
    // Mapear roles do sistema antigo para o novo
    const roleMapping: Record<string, EmployeeRole> = {
      'garcom': 'waiter',
      'cozinheiro': 'cook',
      'atendente': 'cashier',
      'barman': 'cashier',
      'gerente': 'manager'
    };

    return {
      id: barEmployee.id,
      name: barEmployee.employee?.name || '',
      email: barEmployee.employee?.email || '',
      cpf: barEmployee.employee?.cpf || '',
      phone: barEmployee.employee?.phone || '',
      role: roleMapping[barEmployee.bar_role] || 'waiter',
      permissions: ROLE_PRESETS[roleMapping[barEmployee.bar_role] || 'waiter']?.permissions || [],
      status: barEmployee.status === 'active' ? 'active' : 'inactive',
      hire_date: barEmployee.employee?.hire_date ? new Date(barEmployee.employee.hire_date) : new Date(),
      observations: barEmployee.notes || ''
    };
  };

  // Função auxiliar para converter roles
  const convertRoleToBarRole = (role: EmployeeRole): 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente' => {
    const roleMap: Record<EmployeeRole, 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente'> = {
      waiter: 'garcom',
      cook: 'cozinheiro',
      cashier: 'atendente',
      supervisor: 'barman',
      manager: 'gerente',
      admin: 'gerente'
    };
    return roleMap[role] || 'garcom';
  };

  // NOVO FLUXO: Criar funcionário básico (Etapa 1)
  const handleCreateBasicEmployee = async (employeeData: any) => {
    console.log('🚀 Iniciando criação de funcionário básico:', employeeData);
    try {
      const result = await createBasicEmployee(employeeData);
      console.log('📋 Resultado da criação:', result);
      
      if (result.success) {
        console.log('✅ Funcionário criado com sucesso:', result);
        console.log('✅ Processo concluído, recarregando lista');
        
        // Mostrar mensagem de sucesso uma única vez
        setTimeout(() => {
          alert('Funcionário criado com sucesso! Agora você pode criar as credenciais de acesso.');
          // Recarregar apenas a lista de funcionários, não a página toda
          refetch();
        }, 500);
        
      } else {
        console.error('❌ Erro na criação:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao criar funcionário básico:', error);
      
      // Usar setTimeout para mostrar alert depois dos logs
      setTimeout(() => {
        alert(`Erro ao criar funcionário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }, 100);
    }
  };

  // NOVO FLUXO: Adicionar credenciais (Etapa 2)
  const handleAddCredentials = (employee: BarEmployee) => {
    setSelectedEmployeeForCredentials(employee);
    setShowSystemCredentialsModal(true);
  };

  // NOVO: Gerenciar permissões (independente de credenciais)
  const handleManagePermissions = (employee: BarEmployee) => {
    setSelectedEmployeeForPermissions(employee);
    setShowPermissionsModal(true);
  };

  const handleCreateCredentials = async (credentialsData: any) => {
    if (!selectedEmployeeForCredentials?.employee) return;

    try {
      const result = await addCredentialsToEmployee(
        selectedEmployeeForCredentials.id,
        selectedEmployeeForCredentials.employee.email || '',
        credentialsData
      );

      if (result.success && result.credentials) {
        // Mostrar credenciais geradas
        setGeneratedCredentials({
          system: {
            email: result.credentials.email,
            password: result.credentials.senha_temporaria,
            temporaryPassword: result.credentials.deve_alterar_senha,
            username: result.credentials.email.split('@')[0]
          }
        });
        setCredentialsEmployeeName(selectedEmployeeForCredentials.employee.name);
        setShowCredentialsModal(true);
        
        // Recarregar lista
        setTimeout(() => refetch(), 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao criar credenciais:', error);
      alert('Erro ao criar credenciais. Tente novamente.');
    }
  };

  // NOVO: Salvar permissões
  const handleSavePermissions = async (permissions: any[]) => {
    if (!selectedEmployeeForPermissions?.employee?.id) return;

    try {
      const result = await saveEmployeePermissions(
        selectedEmployeeForPermissions.employee.id,
        permissions
      );

      if (result.success) {
        alert('Permissões salvas com sucesso!');
        setShowPermissionsModal(false);
        setSelectedEmployeeForPermissions(null);
        // Recarregar lista para refletir mudanças
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      alert('Erro ao salvar permissões. Tente novamente.');
    }
  };

  // Funções do formulário de novo funcionário - VERSÃO CORRIGIDA (Fluxo Antigo)
  const handleCreateEmployee = async (employee: Employee, credentials?: any) => {
    setProcessing(true);
    try {
      console.log('🚀 Criando funcionário com fluxo completo:', employee.name);
      
      // Usar o novo serviço que cria TUDO (bar_employees + usuarios_empresa + Auth + permissões)
      const result = await createEmployeeWithDefaultPermissions({
        nome_completo: employee.name,
        email: employee.email,
        telefone: employee.phone,
        cpf: employee.cpf,
        bar_role: convertRoleToBarRole(employee.role),
        shift_preference: 'qualquer', // Default
        specialties: [], // Default
        commission_rate: 0, // Default
        observacoes: employee.observations,
        tem_acesso_sistema: credentials ? true : false // Criar credenciais apenas se foram fornecidas
      });
      
      if (result.success) {
        console.log('✅ Funcionário criado com sucesso:', result);
        
        if (result.credentials) {
          // Mostrar credenciais REAIS geradas pelo sistema
          setGeneratedCredentials({
            system: {
              email: result.credentials.email,
              password: result.credentials.senha_temporaria,
              temporaryPassword: result.credentials.deve_alterar_senha,
              username: result.credentials.email.split('@')[0] // Extrair username do email
            }
          });
          setCredentialsEmployeeName(employee.name);
          setShowCredentialsModal(true);
          
          console.log('🔑 Credenciais geradas:', {
            email: result.credentials.email,
            senha: '[OCULTA]',
            temporaria: result.credentials.deve_alterar_senha
          });
        } else {
          alert('Funcionário cadastrado com sucesso!');
        }
        
        // Recarregar lista de funcionários sem reload da página
        setTimeout(() => {
          refetch();
        }, 1000);
        
      } else {
        throw new Error(result.error || 'Erro ao criar funcionário');
      }
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      throw error; // Re-throw para o modal tratar
    } finally {
      setProcessing(false);
    }
  };

  // Funções do formulário de edição
  const handleEditEmployee = (employee: BarEmployee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (employee: Employee, credentials?: any) => {
    if (!selectedEmployee) return;

    const barEmployeeData = convertEmployeeToBarEmployee(employee);
    
    setProcessing(true);
    try {
      await updateEmployee(selectedEmployee.id, barEmployeeData);
      setSelectedEmployee(null);
      
      // Credenciais não são geradas na edição, apenas na criação
      alert('Funcionário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error; // Re-throw para o modal tratar
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

  // Função resetForm removida - não é mais necessária

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
      <NetworkNotification />
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
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBasicEmployeeModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Funcionário</span>
          </button>
          <button
            onClick={() => setShowNewEmployeeModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
          >
            <Plus size={16} />
            <span>Fluxo Antigo</span>
          </button>
        </div>
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
                            <div className="text-sm text-gray-500">{employee.cpf || barEmployee.employee?.cpf || 'CPF não informado'}</div>
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
                            title="Ver detalhes"
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
                          {/* Botão para criar credenciais - só aparece se não tem acesso ao sistema */}
                          <button
                            onClick={() => handleAddCredentials(barEmployee)}
                            className="text-green-600 hover:text-green-900"
                            title="Criar credenciais de acesso"
                          >
                            <Badge size={16} />
                          </button>
                          {/* NOVO: Botão para gerenciar permissões */}
                          <button
                            onClick={() => handleManagePermissions(barEmployee)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Gerenciar permissões"
                          >
                            <Settings size={16} />
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

      {/* Modal Novo Funcionário - Usando o novo modal de duas etapas */}
      <TwoStepEmployeeModal
        isOpen={showNewEmployeeModal}
        onClose={() => setShowNewEmployeeModal(false)}
        onSave={handleCreateEmployee}
        mode="create"
      />

      {/* Modal Editar Funcionário */}
      <EmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(employee) => handleUpdateEmployee(employee)}
        employee={selectedEmployee ? convertBarEmployeeToEmployee(selectedEmployee) : undefined}
        mode="edit"
      />

      {/* Modal de Credenciais */}
      {generatedCredentials && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false);
            setGeneratedCredentials(null);
            setCredentialsEmployeeName('');
          }}
          credentials={generatedCredentials}
          employeeName={credentialsEmployeeName}
        />
      )}

      {/* NOVOS MODAIS - Fluxo de duas etapas */}
      
      {/* Modal Funcionário Básico (Etapa 1) */}
      <BasicEmployeeModal
        isOpen={showBasicEmployeeModal}
        onClose={() => setShowBasicEmployeeModal(false)}
        onSave={handleCreateBasicEmployee}
      />

      {/* Modal Credenciais do Sistema (Etapa 2) */}
      <SystemCredentialsModal
        isOpen={showSystemCredentialsModal}
        onClose={() => {
          setShowSystemCredentialsModal(false);
          setSelectedEmployeeForCredentials(null);
        }}
        onSave={handleCreateCredentials}
        employeeName={selectedEmployeeForCredentials?.employee?.name || ''}
        employeeRole={selectedEmployeeForCredentials?.bar_role || ''}
      />

      {/* NOVO: Modal de Gerenciamento de Permissões */}
      <PermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedEmployeeForPermissions(null);
        }}
        employeeId={selectedEmployeeForPermissions?.employee?.id || ''}
        employeeName={selectedEmployeeForPermissions?.employee?.name || ''}
        onSave={handleSavePermissions}
        onCreateCredentials={() => {
          // Fechar modal de permissões e abrir modal de credenciais
          setShowPermissionsModal(false);
          setSelectedEmployeeForCredentials(selectedEmployeeForPermissions);
          setSelectedEmployeeForPermissions(null);
          setShowSystemCredentialsModal(true);
        }}
      />

    </div>
  );
};

export default BarEmployeesModule;