import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TestBarTablesConnection: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing bar_tables connection...');
      
      // Teste 1: Verificar se a tabela existe
      const { data: tables, error: tablesError } = await supabase
        .from('bar_tables')
        .select('*')
        .limit(5);

      console.log('Tables query result:', { tables, tablesError });

      if (tablesError) {
        throw new Error(`Erro na consulta: ${tablesError.message}`);
      }

      // Teste 2: Verificar estrutura da tabela
      const { data: tableInfo, error: infoError } = await supabase
        .rpc('get_table_info', { table_name: 'bar_tables' })
        .single();

      console.log('Table info result:', { tableInfo, infoError });

      setResult({
        tablesCount: tables?.length || 0,
        tables: tables || [],
        tableExists: !tablesError,
        error: tablesError?.message || null
      });

    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('bar_tables')
        .insert({
          number: 'TEST-1',
          capacity: 4,
          status: 'available',
          position_x: 100,
          position_y: 100,
          notes: 'Mesa de teste'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Table created:', data);
      alert('Mesa de teste criada com sucesso!');
      testConnection(); // Refresh
    } catch (err) {
      console.error('Create error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar mesa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Teste de Conexão - bar_tables</h2>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>

        <button
          onClick={createTable}
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-2"
        >
          {loading ? 'Criando...' : 'Criar Mesa de Teste'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Resultado do Teste:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestBarTablesConnection;