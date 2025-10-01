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
      <div className="relative w-full h-96 bg-white border-2 border-gray-300 rounded-lg overflow-visible">
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
        {tables.map((table, index) => {
          // Ajustar posições para caber no container
          const originalX = table.position_x || 100;
          const originalY = table.position_y || 100;
          
          // Escalar posições para caber no container (800x400)
          const x = Math.min(originalX * 0.8, 700); // Máximo 700px
          const y = Math.min(originalY * 0.8, 300); // Máximo 300px
          
          console.log(`Mesa ${table.number}: original(${originalX}, ${originalY}) -> scaled(${x}, ${y})`);
          
          return (
            <div
              key={table.id}
              className="absolute w-16 h-16 bg-blue-500 border-2 border-blue-600 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors"
              style={{
                left: `${x}px`,
                top: `${y}px`
              }}
              onClick={() => console.log('Clicou na mesa:', table.number)}
            >
              <div className="text-xs text-center">
                <div>{table.number}</div>
                <div className="text-[10px] opacity-75">{table.capacity}p</div>
              </div>
            </div>
          );
        })}
        
        {/* Indicadores de referência */}
        <div className="absolute top-2 left-2 w-4 h-4 bg-red-500 rounded-full" title="Origem (0,0)"></div>
        <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full" title="Canto superior direito"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-yellow-500 rounded-full" title="Canto inferior esquerdo"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 bg-purple-500 rounded-full" title="Canto inferior direito"></div>
        
        {/* Indicador se não há mesas */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Nenhuma mesa encontrada
          </div>
        )}
        
        {/* Contador de mesas renderizadas */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm">
          {tables.length} mesas carregadas
        </div>
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