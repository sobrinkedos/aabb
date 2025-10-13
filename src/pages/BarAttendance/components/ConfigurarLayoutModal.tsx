import React, { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, Move } from 'lucide-react';
import { useBarTables } from '../../../hooks/useBarTables';
import { BarTable } from '../../../types';

interface ConfigurarLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DragState {
  isDragging: boolean;
  tableId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const ConfigurarLayoutModal: React.FC<ConfigurarLayoutModalProps> = ({ isOpen, onClose }) => {
  const { tables, updateTablePosition } = useBarTables();
  const [localTables, setLocalTables] = useState<BarTable[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tableId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar com as mesas do hook
  useEffect(() => {
    setLocalTables([...tables]);
  }, [tables]);

  const handleMouseDown = (e: React.MouseEvent, table: BarTable) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tableElement = e.currentTarget as HTMLElement;
    const tableRect = tableElement.getBoundingClientRect();
    
    setDragState({
      isDragging: true,
      tableId: table.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - tableRect.left,
      offsetY: e.clientY - tableRect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.tableId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left - dragState.offsetX) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragState.offsetY) / rect.height) * 100;

    // Limitar as posições dentro do container
    const clampedX = Math.max(0, Math.min(95, newX));
    const clampedY = Math.max(0, Math.min(95, newY));

    setLocalTables(prev => prev.map(table =>
      table.id === dragState.tableId
        ? { ...table, position_x: clampedX, position_y: clampedY }
        : table
    ));
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      tableId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Atualizar apenas as mesas que mudaram de posição
      const promises = localTables.map(localTable => {
        const originalTable = tables.find(t => t.id === localTable.id);
        if (originalTable && 
            (originalTable.position_x !== localTable.position_x || 
             originalTable.position_y !== localTable.position_y)) {
          return updateTablePosition(localTable.id, localTable.position_x, localTable.position_y);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      onClose();
      alert('Layout salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar layout:', err);
      alert('Erro ao salvar layout. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLocalTables([...tables]);
  };

  const getTableColor = (status: BarTable['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'cleaning': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Move className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configurar Layout do Salão</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Instruções:</strong> Arraste as mesas para reposicioná-las no salão. 
              As posições são salvas em porcentagem para se adaptar a diferentes tamanhos de tela.
            </p>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Disponível</span>
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

          {/* Layout do salão */}
          <div 
            ref={containerRef}
            className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-96 overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {localTables.map(table => (
              <div
                key={table.id}
                className={`absolute w-12 h-12 rounded-lg border-2 border-white shadow-lg cursor-move flex items-center justify-center text-white font-bold text-xs transition-transform hover:scale-110 ${
                  getTableColor(table.status)
                } ${dragState.tableId === table.id ? 'scale-110 shadow-xl' : ''}`}
                style={{
                  left: `${table.position_x}%`,
                  top: `${table.position_y}%`,
                  zIndex: dragState.tableId === table.id ? 10 : 1
                }}
                onMouseDown={(e) => handleMouseDown(e, table)}
                title={`Mesa ${table.number} - ${table.capacity} pessoas - ${table.status}`}
              >
                {table.number}
              </div>
            ))}

            {/* Indicador de área */}
            <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
              Salão Principal
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetar</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Layout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurarLayoutModal;