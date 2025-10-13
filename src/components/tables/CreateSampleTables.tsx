import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const CreateSampleTables: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createSampleTables = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Verificar se já existem mesas
      const { data: existingTables } = await supabase
        .from('bar_tables')
        .select('id')
        .limit(1);

      if (existingTables && existingTables.length > 0) {
        setMessage('Já existem mesas cadastradas no sistema.');
        setLoading(false);
        return;
      }

      // Criar mesas de exemplo
      const sampleTables = [
        { number: '1', capacity: 2, status: 'available', position_x: 100, position_y: 100 },
        { number: '2', capacity: 4, status: 'available', position_x: 200, position_y: 100 },
        { number: '3', capacity: 2, status: 'available', position_x: 300, position_y: 100 },
        { number: '4', capacity: 6, status: 'available', position_x: 400, position_y: 100 },
        { number: '5', capacity: 4, status: 'available', position_x: 100, position_y: 200 },
        { number: '6', capacity: 2, status: 'available', position_x: 200, position_y: 200 },
        { number: '7', capacity: 8, status: 'available', position_x: 300, position_y: 200 },
        { number: '8', capacity: 4, status: 'available', position_x: 400, position_y: 200 },
        { number: '9', capacity: 2, status: 'available', position_x: 100, position_y: 300 },
        { number: '10', capacity: 6, status: 'available', position_x: 200, position_y: 300 },
        { number: 'VIP-1', capacity: 4, status: 'available', position_x: 500, position_y: 100, notes: 'Mesa VIP com vista' },
        { number: 'VIP-2', capacity: 6, status: 'available', position_x: 500, position_y: 200, notes: 'Mesa VIP reservada' },
        { number: 'A1', capacity: 2, status: 'available', position_x: 100, position_y: 400 },
        { number: 'A2', capacity: 2, status: 'available', position_x: 200, position_y: 400 },
        { number: 'A3', capacity: 2, status: 'available', position_x: 300, position_y: 400 },
        { number: 'B1', capacity: 4, status: 'available', position_x: 400, position_y: 300 },
        { number: 'B2', capacity: 4, status: 'available', position_x: 500, position_y: 300 },
        { number: 'B3', capacity: 4, status: 'available', position_x: 600, position_y: 300 },
        { number: 'C1', capacity: 8, status: 'available', position_x: 400, position_y: 400 },
        { number: 'C2', capacity: 10, status: 'available', position_x: 500, position_y: 400 }
      ];

      const { error } = await supabase
        .from('bar_tables')
        .insert(sampleTables);

      if (error) throw error;

      setMessage(`${sampleTables.length} mesas de exemplo criadas com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar mesas:', error);
      setMessage('Erro ao criar mesas de exemplo: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllTables = async () => {
    if (!confirm('Tem certeza que deseja excluir TODAS as mesas? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('bar_tables')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      setMessage('Todas as mesas foram excluídas.');
    } catch (error) {
      console.error('Erro ao excluir mesas:', error);
      setMessage('Erro ao excluir mesas: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Configuração de Mesas</h2>
      
      <div className="space-y-4">
        <button
          onClick={createSampleTables}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando...' : 'Criar Mesas de Exemplo'}
        </button>

        <button
          onClick={clearAllTables}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Excluindo...' : 'Excluir Todas as Mesas'}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('Erro') 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p><strong>Nota:</strong> Este componente é apenas para desenvolvimento/teste.</p>
        <p>As mesas de exemplo incluem diferentes capacidades e posições no layout.</p>
      </div>
    </div>
  );
};

export default CreateSampleTables;