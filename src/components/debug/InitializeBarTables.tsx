import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const InitializeBarTables: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const initializeTables = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Primeiro, verificar se a tabela existe
      const { data: tableExists, error: checkError } = await supabase
        .from('bar_tables')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === '42P01') {
        // Tabela não existe, vamos criá-la
        setMessage('Tabela bar_tables não encontrada. Criando...');
        
        // Executar SQL para criar a tabela
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.bar_tables (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              number VARCHAR(50) NOT NULL UNIQUE,
              capacity INTEGER NOT NULL CHECK (capacity > 0),
              status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
              position_x INTEGER DEFAULT 100,
              position_y INTEGER DEFAULT 100,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;

        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          throw new Error(`Erro ao criar tabela: ${createError.message}`);
        }

        setMessage('Tabela bar_tables criada com sucesso!');
      } else if (checkError) {
        throw checkError;
      } else {
        setMessage(`Tabela bar_tables já existe. Encontradas ${tableExists?.length || 0} mesas.`);
      }

      // Verificar se há mesas cadastradas
      const { data: tables, error: tablesError } = await supabase
        .from('bar_tables')
        .select('*');

      if (tablesError) throw tablesError;

      if (!tables || tables.length === 0) {
        setMessage(prev => prev + '\n\nNenhuma mesa encontrada. Criando mesas de exemplo...');
        
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
          { number: '10', capacity: 6, status: 'available', position_x: 200, position_y: 300 }
        ];

        const { error: insertError } = await supabase
          .from('bar_tables')
          .insert(sampleTables);

        if (insertError) throw insertError;

        setMessage(prev => prev + `\n\n${sampleTables.length} mesas de exemplo criadas com sucesso!`);
      } else {
        setMessage(prev => prev + `\n\nEncontradas ${tables.length} mesas no sistema.`);
      }

    } catch (error) {
      console.error('Erro ao inicializar tabelas:', error);
      setMessage(`Erro: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Inicializar Sistema de Mesas</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Este utilitário verifica se a tabela bar_tables existe e cria mesas de exemplo se necessário.
        </p>

        <button
          onClick={initializeTables}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Inicializando...' : 'Inicializar Sistema de Mesas'}
        </button>

        {message && (
          <div className={`p-4 rounded-lg text-sm whitespace-pre-line ${
            message.includes('Erro') 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default InitializeBarTables;