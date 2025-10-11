import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BarCustomer } from '../../types';

interface CustomerQuickRegisterProps {
  onCustomerSelected: (customer: BarCustomer) => void;
  onClose: () => void;
}

interface CustomerFormData {
  phone: string;
  name: string;
  email?: string;
}

const CustomerQuickRegister: React.FC<CustomerQuickRegisterProps> = ({
  onCustomerSelected,
  onClose
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    phone: '',
    name: '',
    email: ''
  });
  const [existingCustomer, setExistingCustomer] = useState<BarCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar cliente por telefone
  const searchCustomerByPhone = async (phone: string) => {
    if (phone.length < 10) return;
    
    setSearchLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('get_bar_customer_by_phone', { customer_phone: phone });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const customer = data[0] as BarCustomer;
        setExistingCustomer(customer);
        setFormData({
          phone: customer.phone,
          name: customer.name,
          email: customer.email || ''
        });
      } else {
        setExistingCustomer(null);
        setFormData(prev => ({ ...prev, name: '', email: '' }));
      }
    } catch (err) {
      console.error('Erro ao buscar cliente:', err);
      setError('Erro ao buscar cliente');
    } finally {
      setSearchLoading(false);
    }
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedPhone = formatPhone(value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
    
    // Buscar automaticamente quando o telefone tiver 11 dígitos
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      searchCustomerByPhone(numbers);
    } else {
      setExistingCustomer(null);
    }
  };

  // Criar novo cliente
  const createNewCustomer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const phoneNumbers = formData.phone.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('bar_customers')
        .insert({
          phone: phoneNumbers,
          name: formData.name,
          email: formData.email || null,
          status: 'active',
          is_vip: false,
          loyalty_points: 0,
          credit_limit: 0,
          current_balance: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newCustomer = data as BarCustomer;
      onCustomerSelected(newCustomer);
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      setError('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  // Selecionar cliente existente
  const selectExistingCustomer = () => {
    if (existingCustomer) {
      onCustomerSelected(existingCustomer);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.name) {
      setError('Telefone e nome são obrigatórios');
      return;
    }
    
    if (existingCustomer) {
      selectExistingCustomer();
    } else {
      createNewCustomer();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {existingCustomer ? 'Cliente Encontrado' : 'Cadastro de Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={15}
                required
              />
              {searchLoading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!existingCustomer}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (opcional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!existingCustomer}
            />
          </div>

          {existingCustomer && (
            <div className="p-3 bg-green-100 border border-green-400 rounded">
              <p className="text-green-700 text-sm">
                <strong>Cliente encontrado!</strong><br />
                Última visita: {existingCustomer.last_visit ? 
                  new Date(existingCustomer.last_visit).toLocaleDateString('pt-BR') : 
                  'Primeira visita'
                }<br />
                Pontos de fidelidade: {existingCustomer.loyalty_points}
                {existingCustomer.is_vip && <span className="ml-2 text-yellow-600">⭐ VIP</span>}
              </p>
            </div>
          )}

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
              disabled={loading || !formData.phone || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </div>
              ) : existingCustomer ? (
                'Selecionar Cliente'
              ) : (
                'Cadastrar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerQuickRegister;