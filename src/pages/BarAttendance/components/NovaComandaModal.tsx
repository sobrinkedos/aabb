import React, { useState, useEffect } from 'react';
import { X, User, Users, MapPin } from 'lucide-react';
import { useBarTables } from '../../../hooks/useBarTables';
import { useComandas } from '../../../hooks/useComandas';
import { useAuth } from '../../../contexts/AuthContext';
import { BarTable, BarCustomer } from '../../../types';
import { supabase } from '../../../lib/supabase';

interface NovaComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: BarTable;
}

const NovaComandaModal: React.FC<NovaComandaModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedTable 
}) => {
  const { user } = useAuth();
  const { tables } = useBarTables();
  const { createComanda } = useComandas();
  
  const [formData, setFormData] = useState({
    table_id: selectedTable?.id || '',
    customer_id: '',
    customer_name: '',
    people_count: 1,
    notes: ''
  });
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<BarCustomer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [loading, setLoading] = useState(false);

  // Buscar clientes por telefone ou nome
  const searchCustomers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      return;
    }

    try {
      setSearchingCustomers(true);
      const { data, error } = await supabase
        .from('bar_customers')
        .select('*')
        .or(`phone.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .eq('status', 'active')
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const handleCustomerSelect = (customer: BarCustomer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name
    }));
    setCustomerSearch(customer.name);
    setCustomers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      
      const comandaData = {
        table_id: formData.table_id || undefined,
        customer_id: formData.customer_id || undefined,
        customer_name: formData.customer_name || undefined,
        employee_id: user.id,
        people_count: formData.people_count,
        notes: formData.notes || undefined
      };

      await createComanda(comandaData);
      onClose();
      
      // Reset form
      setFormData({
        table_id: '',
        customer_id: '',
        customer_name: '',
        people_count: 1,
        notes: ''
      });
      setCustomerSearch('');
    } catch (err) {
      console.error('Erro ao criar comanda:', err);
      alert('Erro ao criar comanda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      setFormData(prev => ({ ...prev, table_id: selectedTable.id }));
    }
  }, [selectedTable]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(customerSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Nova Comanda</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Seleção de Mesa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Mesa (opcional)
            </label>
            <select
              value={formData.table_id}
              onChange={(e) => setFormData(prev => ({ ...prev, table_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Balcão (sem mesa)</option>
              {tables
                .filter(table => table.status === 'available')
                .map(table => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.number} ({table.capacity} pessoas)
                  </option>
                ))
              }
            </select>
          </div>

          {/* Busca de Cliente */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Cliente (opcional)
            </label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                if (!e.target.value) {
                  setFormData(prev => ({ ...prev, customer_id: '', customer_name: '' }));
                }
              }}
              placeholder="Buscar por telefone ou nome..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Lista de clientes encontrados */}
            {customers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </button>
                ))}
              </div>
            )}
            
            {searchingCustomers && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Nome do cliente se não encontrado */}
          {customerSearch && !formData.customer_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do cliente
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Digite o nome do cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Número de pessoas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Número de pessoas
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.people_count}
              onChange={(e) => setFormData(prev => ({ ...prev, people_count: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre a comanda..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Comanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaComandaModal;