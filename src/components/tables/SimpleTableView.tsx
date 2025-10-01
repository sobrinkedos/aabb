import React from 'react';
import { useBarTables } from '../../hooks/useBarTables';

const SimpleTableView: React.FC = () => {
  const { tables, loading, error } = useBarTables();

  console.log('SimpleTableView - tables:', tables);
  console.log('SimpleTableView - loading:', loading);
  console.log('SimpleTableView - error:', error);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Carregando mesas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erro:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Teste Simples - Mesas</h2>
      
      <div className="mb-4">
        <p><strong>Total de mesas:</strong> {tables.length}</p>
      </div>

      {tables.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Nenhuma mesa encontrada
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white border rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Mesa {table.number}</h3>
              <p>Capacidade: {table.capacity} pessoas</p>
              <p>Status: {table.status || 'N/A'}</p>
              <p>Posição: ({table.position_x || 0}, {table.position_y || 0})</p>
              {table.notes && <p>Notas: {table.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleTableView;