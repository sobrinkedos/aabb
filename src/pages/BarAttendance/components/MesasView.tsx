import React, { useState } from 'react';
import NovaComandaModal from './NovaComandaModal';
import ConfigurarLayoutModal from './ConfigurarLayoutModal';
import { useBarTables } from '../../../hooks/useBarTables';

const MesasView: React.FC = () => {
  const { tables, loading } = useBarTables();
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);
  const [showConfigurarLayoutModal, setShowConfigurarLayoutModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const handleNewComanda = () => {
    setShowNovaComandaModal(true);
  };

  const handleConfigureLayout = () => {
    setShowConfigurarLayoutModal(true);
  };

  const handleTableClick = (table: any) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setShowNovaComandaModal(true);
    }
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600 cursor-pointer';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'cleaning': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="mesas-container">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Mesas</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleNewComanda}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Nova Comanda
            </button>
            <button 
              onClick={handleConfigureLayout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Configurar Layout
            </button>
          </div>
        </div>
        
        {/* Layout do salão */}
        <div className="bg-gray-50 rounded-lg p-6 min-h-96">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Layout do Salão</h3>
            
            {/* Legenda */}
            <div className="flex flex-wrap justify-center gap-4 text-sm mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Disponível (clique para abrir comanda)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Ocupada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Reservada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Limpeza</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Manutenção</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Carregando mesas...</span>
            </div>
          ) : (
            <div className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-80 overflow-hidden">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={`absolute w-12 h-12 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs transition-transform hover:scale-110 ${
                    getTableColor(table.status)
                  }`}
                  style={{
                    left: `${table.position_x}%`,
                    top: `${table.position_y}%`
                  }}
                  onClick={() => handleTableClick(table)}
                  title={`Mesa ${table.number} - ${table.capacity} pessoas - ${table.status}`}
                >
                  {table.number}
                </div>
              ))}
              
              {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Nenhuma mesa configurada
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NovaComandaModal 
        isOpen={showNovaComandaModal}
        onClose={() => {
          setShowNovaComandaModal(false);
          setSelectedTable(null);
        }}
        selectedTable={selectedTable}
      />

      <ConfigurarLayoutModal 
        isOpen={showConfigurarLayoutModal}
        onClose={() => setShowConfigurarLayoutModal(false)}
      />
    </div>
  );
};

export default MesasView;