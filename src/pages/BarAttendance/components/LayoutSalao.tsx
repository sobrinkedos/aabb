import React, { useState, useRef, useCallback } from 'react';
import { BarTable, Comanda, TableStatus } from '../../../types';

interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}
import MesaCard from './MesaCard';

interface LayoutSalaoProps {
  mesas: TableWithComanda[];
  onMesaClick: (mesa: TableWithComanda) => void;
  onMesaPositionChange: (mesaId: string, x: number, y: number) => void;
  onStatusChange: (mesaId: string, status: TableStatus) => void;
  isDragEnabled?: boolean;
}

interface DragState {
  isDragging: boolean;
  draggedMesa: TableWithComanda | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  offset: { x: number; y: number };
}

const LayoutSalao: React.FC<LayoutSalaoProps> = ({
  mesas,
  onMesaClick,
  onMesaPositionChange,
  onStatusChange,
  isDragEnabled = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedMesa: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const handleMouseDown = useCallback((e: React.MouseEvent, mesa: TableWithComanda) => {
    if (!isDragEnabled) return;
    
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    // Calcular offset do mouse em relação ao centro da mesa
    const mesaX = (mesa.position_x / 100) * rect.width;
    const mesaY = (mesa.position_y / 100) * rect.height;
    
    setDragState({
      isDragging: true,
      draggedMesa: mesa,
      startPosition: { x: startX, y: startY },
      currentPosition: { x: startX, y: startY },
      offset: { x: startX - mesaX, y: startY - mesaY }
    });
  }, [isDragEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setDragState(prev => ({
      ...prev,
      currentPosition: { x: currentX, y: currentY }
    }));
  }, [dragState.isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedMesa || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const finalX = dragState.currentPosition.x - dragState.offset.x;
    const finalY = dragState.currentPosition.y - dragState.offset.y;

    // Converter para porcentagem
    const percentX = Math.max(0, Math.min(95, (finalX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(90, (finalY / rect.height) * 100));

    // Salvar nova posição
    onMesaPositionChange(dragState.draggedMesa.id, percentX, percentY);

    setDragState({
      isDragging: false,
      draggedMesa: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
  }, [dragState, onMesaPositionChange]);

  const handleMesaClick = (mesa: TableWithComanda) => {
    // Só chama onClick se não estiver arrastando
    if (!dragState.isDragging) {
      onMesaClick(mesa);
    }
  };

  const getDraggedMesaStyle = (): React.CSSProperties => {
    if (!dragState.isDragging || !containerRef.current) return {};

    const rect = containerRef.current.getBoundingClientRect();
    const x = dragState.currentPosition.x - dragState.offset.x;
    const y = dragState.currentPosition.y - dragState.offset.y;

    return {
      left: `${Math.max(0, Math.min(rect.width - 80, x))}px`,
      top: `${Math.max(0, Math.min(rect.height - 80, y))}px`,
      zIndex: 1000
    };
  };

  return (
    <div className="relative">
      {/* Área do salão */}
      <div
        ref={containerRef}
        className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-96 overflow-hidden cursor-default"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid de referência */}
        <div className="absolute inset-0 opacity-20">
          {/* Linhas verticais */}
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-gray-400"
              style={{ left: `${i * 10}%` }}
            />
          ))}
          {/* Linhas horizontais */}
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-gray-400"
              style={{ top: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Mesas */}
        {mesas.map(mesa => {
          const isDraggedMesa = dragState.draggedMesa?.id === mesa.id;
          
          if (isDraggedMesa && dragState.isDragging) {
            // Mesa sendo arrastada - renderizar na posição do mouse
            return (
              <MesaCard
                key={mesa.id}
                mesa={mesa}
                onClick={handleMesaClick}
                onStatusChange={onStatusChange}
                isDragging={true}
                style={getDraggedMesaStyle()}
              />
            );
          }

          // Mesa na posição normal
          return (
            <div
              key={mesa.id}
              className="absolute"
              style={{
                left: `${mesa.position_x}%`,
                top: `${mesa.position_y}%`,
                cursor: isDragEnabled ? 'grab' : 'pointer'
              }}
              onMouseDown={(e) => handleMouseDown(e, mesa)}
            >
              <MesaCard
                mesa={mesa}
                onClick={handleMesaClick}
                onStatusChange={onStatusChange}
                isDragging={false}
              />
            </div>
          );
        })}

        {/* Mensagem quando não há mesas */}
        {mesas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">Nenhuma mesa configurada</p>
              <p className="text-sm">
                Use o botão "Configurar Layout" para adicionar mesas ao salão
              </p>
            </div>
          </div>
        )}

        {/* Indicador de área de drop */}
        {dragState.isDragging && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-30 border-2 border-blue-300 border-dashed rounded-lg pointer-events-none">
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Arraste para reposicionar a mesa
            </div>
          </div>
        )}
      </div>

      {/* Instruções de uso */}
      {isDragEnabled && mesas.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>
            <strong>Dica:</strong> Clique e arraste as mesas para reposicioná-las no salão. 
            Clique uma vez para ver detalhes da mesa.
          </p>
        </div>
      )}
    </div>
  );
};

export default LayoutSalao;