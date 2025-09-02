import React, { useState, useEffect } from 'react';
import { Settings, Plus, RotateCcw, Eye } from 'lucide-react';
import NovaComandaModal from './NovaComandaModal';
import ConfigurarLayoutModal from './ConfigurarLayoutModal';
import MesaDetailsModal from './MesaDetailsModal';
import LayoutSalao from './LayoutSalao';
import MesasLegend from './MesasLegend';
import { useBarTables } from '../../../hooks/useBarTables';
import { useComandas } from '../../../hooks/useComandas';
import { BarTable, Comanda, TableStatus } from '../../../types';

interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

const MesasView: React.FC = () => {
  const { tables, loading, updateTableStatus, updateTablePosition, refetch } = useBarTables();
  const { comandas } = useComandas();
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);
  const [showConfigurarLayoutModal, setShowConfigurarLayoutModal] = useState(false);
  const [showMesaDetailsModal, setShowMesaDetailsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableWithComanda | null>(null);
  const [mesasWithComandas, setMesasWithComandas] = useState<TableWithComanda[]>([]);

  // Combinar dados das mesas com comandas
  useEffect(() => {
    const mesasEnriquecidas: TableWithComanda[] = tables.map(table => {
      const comanda = comandas.find(c => c.table_id === table.id && c.status === 'open');
      
      return {
        ...table,
        currentComanda: comanda,
        occupiedSince: comanda?.opened_at,
        currentTotal: comanda?.total || 0,
        peopleCount: comanda?.people_count || undefined
      };
    });
    
    setMesasWithComandas(mesasEnriquecidas);
  }, [tables, comandas]);

  const handleNewComanda = () => {
    setSelectedTable(null);
    setShowNovaComandaModal(true);
  };

  const handleConfigureLayout = () => {
    setShowConfigurarLayoutModal(true);
  };

  const handleTableClick = (mesa: TableWithComanda) => {
    setSelectedTable(mesa);
    
    if (mesa.status === 'available') {
      // Mesa disponível - abrir modal para nova comanda
      setShowNovaComandaModal(true);
    } else {
      // Mesa ocupada ou com outro status - mostrar detalhes
      setShowMesaDetailsModal(true);
    }
  };

  const handleStatusChange = async (mesaId: string, newStatus: TableStatus) => {
    try {
      await updateTableStatus(mesaId, newStatus);
    } catch (error) {
      console.error('Erro ao atualizar status da mesa:', error);
      // Aqui você pode adicionar uma notificação de erro
    }
  };

  const handlePositionChange = async (mesaId: string, x: number, y: number) => {
    try {
      await updateTablePosition(mesaId, x, y);
    } catch (error) {
      console.error('Erro ao atualizar posição da mesa:', error);
      // Aqui você pode adicionar uma notificação de erro
    }
  };

  const getStatusStats = () => {
    const stats = {
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      maintenance: 0
    };

    mesasWithComandas.forEach(mesa => {
      if (mesa.status in stats) {
        stats[mesa.status as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="mesas-container space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Mesas</h2>
            <p className="text-gray-600 mt-1">
              {mesasWithComandas.length} mesas configuradas
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleNewComanda}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              <span>Nova Comanda</span>
            </button>
            <button 
              onClick={() => refetch()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw size={20} />
              <span>Atualizar</span>
            </button>
            <button 
              onClick={handleConfigureLayout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings size={20} />
              <span>Configurar Layout</span>
            </button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-green-700">Disponíveis</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
            <div className="text-sm text-red-700">Ocupadas</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <div className="text-sm text-yellow-700">Reservadas</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.cleaning}</div>
            <div className="text-sm text-gray-700">Limpeza</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
            <div className="text-sm text-orange-700">Manutenção</div>
          </div>
        </div>
      </div>
        
      {/* Layout do salão */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Layout do Salão</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Eye size={16} />
              <span>Clique nas mesas para ver detalhes ou abrir comandas</span>
            </div>
          </div>
          
          {/* Legenda */}
          <div className="mb-6">
            <MesasLegend stats={stats} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando mesas...</span>
          </div>
        ) : (
          <LayoutSalao
            mesas={mesasWithComandas}
            onMesaClick={handleTableClick}
            onMesaPositionChange={handlePositionChange}
            onStatusChange={handleStatusChange}
            isDragEnabled={true}
          />
        )}
      </div>

      {/* Modais */}
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

      <MesaDetailsModal
        isOpen={showMesaDetailsModal}
        onClose={() => {
          setShowMesaDetailsModal(false);
          setSelectedTable(null);
        }}
        mesa={selectedTable}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default MesasView;