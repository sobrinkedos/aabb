import React from 'react';
import { useBarTables } from '../../hooks/useBarTables';

const SimpleTableLayout: React.FC = () => {
  const { tables, loading } = useBarTables();

  console.log('SimpleTableLayout - tables:', tables);

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="h-full bg-gray-100 p-4">
      <h2 className="text-xl font-bold mb-4">Layout Simples - {tables.length} mesas</h2>
      
      {/* Container do Layout */}
      <div className="relative w-full h-96 bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        {/* Grid de fundo */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Mesas */}
        {tables.map((table) => {
          const x = table.position_x || 100;
          const y = table.position_y || 100;
          
          console.log(`Mesa ${table.number}: x=${x}, y=${y}`);
          
          return (
            <div
              key={table.id}
              className="absolute w-16 h-16 bg-blue-500 border-2 border-blue-600 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => console.log('Clicou na mesa:', table.number)}
            >
              {table.number}
            </div>
          );
        })}
        
        {/* Indicador se não há mesas */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Nenhuma mesa encontrada
          </div>
        )}
      </div>
      
      {/* Lista de debug */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Debug - Mesas encontradas:</h3>
        <div className="grid grid-cols-4 gap-2 text-sm">
          {tables.map((table) => (
            <div key={table.id} className="bg-white p-2 rounded border">
              <div><strong>{table.number}</strong></div>
              <div>Pos: ({table.position_x}, {table.position_y})</div>
              <div>Status: {table.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleTableLayout;