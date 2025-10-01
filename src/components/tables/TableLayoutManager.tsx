import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { BarTable, TableStatus } from '../../types/bar-attendance';
import { useBarTables } from '../../hooks/useBarTables';
import TableModal from './TableModal';
import TableContextMenu from './TableContextMenu';
import { calculateAutoPosition, DEFAULT_LAYOUT_CONFIG } from '../../utils/table-layout';

interface TableLayoutManagerProps {
  readonly?: boolean;
  onTableSelect?: (table: BarTable) => void;
  selectedTableId?: string;
}

interface DraggedTable extends BarTable {
  isDragging: boolean;
}

const TableLayoutManager: React.FC<TableLayoutManagerProps> = ({
  readonly = false,
  onTableSelect,
  selectedTableId
}) => {
  const { tables, loading, updateTablePosition, organizeTablesAutomatically: organizeTablesHook } = useBarTables();
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<BarTable | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    table: BarTable;
    x: number;
    y: number;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(!readonly);
  const [draggedTables, setDraggedTables] = useState<Set<string>>(new Set());
  const layoutRef = useRef<HTMLDivElement>(null);

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 border-green-600';
      case 'occupied':
        return 'bg-red-500 border-red-600';
      case 'reserved':
        return 'bg-yellow-500 border-yellow-600';
      case 'cleaning':
        return 'bg-blue-500 border-blue-600';
      case 'maintenance':
        return 'bg-gray-500 border-gray-600';
      default:
        return 'bg-gray-300 border-gray-400';
    }
  };

  const getTableStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'cleaning':
        return 'Limpeza';
      case 'maintenance':
        return 'Manutenção';
      default:
        return 'Indefinido';
    }
  };

  const handleTableDrag = useCallback(
    (tableId: string, info: PanInfo) => {
      if (readonly || !isEditMode) return;

      const layoutRect = layoutRef.current?.getBoundingClientRect();
      if (!layoutRect) return;

      const newX = Math.max(0, Math.min(info.point.x - layoutRect.left - 40, layoutRect.width - 80));
      const newY = Math.max(0, Math.min(info.point.y - layoutRect.top - 40, layoutRect.height - 80));

      updateTablePosition(tableId, newX, newY);
    },
    [readonly, isEditMode, updateTablePosition]
  );

  const handleTableClick = (table: BarTable) => {
    if (onTableSelect) {
      onTableSelect(table);
    }
  };

  const handleTableRightClick = (e: React.MouseEvent, table: BarTable) => {
    if (readonly) return;
    
    e.preventDefault();
    setContextMenu({
      table,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleEditTable = (table: BarTable) => {
    setEditingTable(table);
    setShowModal(true);
    setContextMenu(null);
  };

  const handleCreateTable = () => {
    setEditingTable(null);
    setShowModal(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };



  // Função para organizar mesas automaticamente
  const organizeTablesAutomatically = async () => {
    if (!layoutRef.current) return;
    
    const layoutRect = layoutRef.current.getBoundingClientRect();
    const layoutWidth = layoutRect.width;
    const layoutHeight = layoutRect.height;

    try {
      await organizeTablesHook(layoutWidth, layoutHeight);
    } catch (error) {
      console.error('Erro ao organizar mesas:', error);
      alert('Erro ao organizar mesas. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Layout das Mesas</h2>
          <span className="text-sm text-gray-500">
            {tables.length} mesa{tables.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {!readonly && (
            <>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEditMode
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditMode ? (
                  <>
                    <EyeSlashIcon className="h-4 w-4 inline mr-1" />
                    Sair do Modo Edição
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 inline mr-1" />
                    Modo Edição
                  </>
                )}
              </button>

              <button
                onClick={organizeTablesAutomatically}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Organizar mesas automaticamente"
              >
                <ArrowsPointingOutIcon className="h-4 w-4 inline mr-1" />
                Organizar
              </button>

              <button
                onClick={handleCreateTable}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <PlusIcon className="h-4 w-4 inline mr-1" />
                Nova Mesa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-100 border-b p-2 text-sm">
        <strong>Debug Layout:</strong> {tables.length} mesas, Modo Edição: {isEditMode ? 'ON' : 'OFF'}
      </div>

      {/* Layout Area */}
      <div className="flex-1 relative min-h-[600px] overflow-visible" ref={layoutRef}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 min-h-[600px]">
          {/* Grid Pattern */}
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

          {/* Tables */}
          {tables.map((table, index) => {
            // Usar as posições do banco de dados ou posição padrão
            const x = table.position_x ?? 50 + (index % 5) * 120;
            const y = table.position_y ?? 50 + Math.floor(index / 5) * 120;
            
            console.log('Mesa:', table.number, 'Posição:', { x, y, dbX: table.position_x, dbY: table.position_y });
            return (
            <motion.div
              key={table.id}
              drag={isEditMode && !readonly}
              dragMomentum={false}
              dragElastic={0}
              onDragStart={() => setDraggedTables(prev => new Set(prev).add(table.id))}
              onDragEnd={(_, info) => {
                handleTableDrag(table.id, info);
                setDraggedTables(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(table.id);
                  return newSet;
                });
              }}
              initial={{ 
                x: x, 
                y: y 
              }}
              animate={{ 
                x: x, 
                y: y 
              }}
              whileHover={!draggedTables.has(table.id) ? { scale: 1.05 } : {}}
              whileDrag={{ scale: 1.1, zIndex: 1000 }}
              className={`absolute cursor-pointer select-none ${
                isEditMode && !readonly ? 'cursor-move' : 'cursor-pointer'
              }`}
              onClick={() => handleTableClick(table)}
              onContextMenu={(e) => handleTableRightClick(e, table)}
            >
              <div
                className={`
                  w-20 h-20 rounded-lg border-2 shadow-lg transition-all duration-200
                  ${getTableStatusColor(table.status || 'available')}
                  ${selectedTableId === table.id ? 'ring-4 ring-blue-300 ring-offset-2' : ''}
                  ${draggedTables.has(table.id) ? 'shadow-2xl' : ''}
                `}
              >
                <div className="h-full flex flex-col items-center justify-center text-white">
                  <div className="text-lg font-bold">{table.number}</div>
                  <div className="text-xs opacity-90">{table.capacity}p</div>
                </div>
              </div>

              {/* Status Label */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm border">
                  {getTableStatusText(table.status || 'available')}
                </div>
              </div>
            </motion.div>
          );
          })}

          {/* Empty State */}
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <ArrowsPointingOutIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma mesa configurada
                </h3>
                <p className="text-gray-500 mb-4">
                  Crie sua primeira mesa para começar a organizar o layout
                </p>
                {!readonly && (
                  <button
                    onClick={handleCreateTable}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 inline mr-1" />
                    Criar Mesa
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-500 border border-green-600"></div>
            <span>Disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-500 border border-red-600"></div>
            <span>Ocupada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-600"></div>
            <span>Reservada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-blue-500 border border-blue-600"></div>
            <span>Limpeza</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-gray-500 border border-gray-600"></div>
            <span>Manutenção</span>
          </div>
        </div>
      </div>

      {/* Table Modal */}
      <TableModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTable(null);
        }}
        table={editingTable}
      />

      {/* Context Menu */}
      {contextMenu && (
        <TableContextMenu
          table={contextMenu.table}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onEdit={() => handleEditTable(contextMenu.table)}
        />
      )}
    </div>
  );
};

export default TableLayoutManager;