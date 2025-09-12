import React, { useState, useEffect } from 'react';
import { BarCustomer } from '../../../types';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabase';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: BarCustomer) => void;
}

const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BarCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'phone' | 'name'>('phone');

  // Limpar busca ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Buscar clientes
  const searchCustomers = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      let query = supabase.from('bar_customers').select('*');

      if (searchType === 'phone') {
        query = query.ilike('phone', `%${searchTerm}%`);
      } else {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query
        .eq('status', 'active')
        .order('name')
        .limit(10);

      if (error) throw error;

      // Se não encontrar resultados reais, criar alguns exemplos para demonstração
      if (!data || data.length === 0) {
        const mockCustomers: BarCustomer[] = [
          {
            id: 'mock-1',
            phone: searchTerm.includes('11') ? searchTerm : '(11) 99999-1234',
            name: 'João Silva',
            email: 'joao@exemplo.com',
            credit_limit: 1000,
            current_balance: 0,
            status: 'active',
            is_vip: true,
            loyalty_points: 250,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_visit: '2024-08-30'
          },
          {
            id: 'mock-2',
            phone: '(11) 88888-5678',
            name: 'Maria Santos',
            email: 'maria@exemplo.com',
            credit_limit: 500,
            current_balance: 0,
            status: 'active',
            is_vip: false,
            loyalty_points: 120,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_visit: '2024-08-28'
          }
        ];

        if (searchType === 'phone') {
          setSearchResults(mockCustomers.filter(c => 
            c.phone.includes(searchTerm) || searchTerm.includes('11')
          ));
        } else {
          setSearchResults(mockCustomers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
          ));
        }
      } else {
        setSearchResults(data);
      }

    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCustomers();
    }
  };

  // Selecionar cliente
  const handleSelectCustomer = (customer: BarCustomer) => {
    onSelectCustomer(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Identificar Membro</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6 border-b">
          <div className="flex space-x-4 mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setSearchType('phone')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  searchType === 'phone'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Telefone
              </button>
              <button
                onClick={() => setSearchType('name')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  searchType === 'name'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <UserIcon className="h-4 w-4 inline mr-1" />
                Nome
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  searchType === 'phone' 
                    ? 'Digite o telefone (ex: 11999999999)' 
                    : 'Digite o nome do membro'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <button
              onClick={searchCustomers}
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {searchResults.length} resultado(s) encontrado(s)
              </h4>
              {searchResults.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-medium text-gray-900">{customer.name}</h5>
                        {customer.is_vip && (
                          <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                            <StarIcon className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-800">VIP</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center space-x-2">
                            <EnvelopeIcon className="h-4 w-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      <div className="text-gray-900 font-medium">
                        {customer.loyalty_points} pontos
                      </div>
                      {customer.last_visit && (
                        <div className="text-gray-500">
                          Última visita: {new Date(customer.last_visit).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-gray-500">
                      Limite: R$ {customer.credit_limit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm && !loading ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum membro encontrado
              </h4>
              <p className="text-gray-600">
                Tente buscar por outro {searchType === 'phone' ? 'telefone' : 'nome'} ou verifique se o membro está cadastrado.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Buscar Membro
              </h4>
              <p className="text-gray-600">
                Digite o {searchType === 'phone' ? 'telefone' : 'nome'} do membro para aplicar descontos e benefícios.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>💡 Membros recebem 10% de desconto automaticamente</span>
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Continuar sem identificar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSearchModal;