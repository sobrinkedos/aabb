import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Phone, Mail, Star, Calendar, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarCustomer } from '../../types';
import CustomerQuickRegister from '../../components/Bar/CustomerQuickRegister';

const BarCustomersModule: React.FC = () => {
  const [customers, setCustomers] = useState<BarCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<BarCustomer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Carregar clientes
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bar_customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    vip: customers.filter(c => c.is_vip).length,
    totalLoyaltyPoints: customers.reduce((sum, c) => sum + c.loyalty_points, 0)
  };

  const handleCustomerAdded = (customer: BarCustomer) => {
    setCustomers(prev => [customer, ...prev]);
    setShowAddModal(false);
  };

  const handleViewDetails = (customer: BarCustomer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes do Bar</h1>
          <p className="text-gray-600 mt-1">Gerencie os clientes e suas informações</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Phone className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes VIP</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.vip}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pontos Totais</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalLoyaltyPoints.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Visita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            {customer.is_vip && (
                              <Star className="ml-2 h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{customer.cpf || 'CPF não informado'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPhone(customer.phone)}</div>
                      <div className="text-sm text-gray-500">{customer.email || 'Email não informado'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' ? 'bg-green-100 text-green-800' :
                        customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {customer.status === 'active' ? 'Ativo' :
                         customer.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.loyalty_points.toLocaleString()} pts
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.last_visit ? 
                        new Date(customer.last_visit).toLocaleDateString('pt-BR') : 
                        'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Adicionar Cliente */}
      {showAddModal && (
        <CustomerQuickRegister
          onCustomerSelected={handleCustomerAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Modal de Detalhes do Cliente */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalhes do Cliente</h2>
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
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <p className="mt-1 text-sm text-gray-900">{formatPhone(selectedCustomer.phone)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.email || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CPF</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedCustomer.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedCustomer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.status === 'active' ? 'Ativo' :
                       selectedCustomer.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                    </span>
                    {selectedCustomer.is_vip && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⭐ VIP
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pontos de Fidelidade</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.loyalty_points.toLocaleString()} pontos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limite de Crédito</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCustomer.credit_limit)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Saldo Atual</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCustomer.current_balance)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Última Visita</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.last_visit ? 
                      new Date(selectedCustomer.last_visit).toLocaleDateString('pt-BR') : 
                      'Nunca'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cadastrado em</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedCustomer.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {selectedCustomer.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.notes}</p>
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
    </div>
  );
};

export default BarCustomersModule;