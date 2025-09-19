import React, { useEffect } from 'react';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { useAuth } from '../../../contexts/AuthContextSimple';

export const CashTest: React.FC = () => {
  const { user } = useAuth();
  const { currentSession, loading, error } = useCashManagement();

  useEffect(() => {
    console.log('CashTest: Usuário:', user);
    console.log('CashTest: Sessão atual:', currentSession);
    console.log('CashTest: Loading:', loading);
    console.log('CashTest: Error:', error);
  }, [user, currentSession, loading, error]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Cash Management</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Usuário:</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Sessão Atual:</h3>
          <pre>{JSON.stringify(currentSession, null, 2)}</pre>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Status:</h3>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'Nenhum erro'}</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  );
};