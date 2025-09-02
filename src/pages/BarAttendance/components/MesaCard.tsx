import React from 'react';
import { BarTable, Comanda, TableStatus } from '../../../types';

interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}

interface MesaCardProps {
  mesa: TableWithComanda;
  onClick: (mesa: TableWithComanda) => void;
  onStatusChange: (mesaId: string, status: TableStatus) => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

const MesaCard: React.FC<MesaCardProps> = ({ 
  mesa, 
  onClick, 
  onStatusChange, 
  isDragging = false,
  style 
}) => {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': 
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'occupied': 
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'reserved': 
        return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
      case 'cleaning': 
        return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
      case 'maintenance': 
        return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      default: 
        return 'bg-gray-400 hover:bg-gray-500 border-gray-500';
    }
  };

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'cleaning': return 'Limpeza';
      case 'maintenance': return 'Manutenção';
      default: return 'Indefinido';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    
    switch (action) {
      case 'ocupar':
        onStatusChange(mesa.id, 'occupied');
        break;
      case 'liberar':
        onStatusChange(mesa.id, 'available');
        break;
      case 'limpar':
        onStatusChange(mesa.id, 'cleaning');
        break;
      case 'reservar':
        onStatusChange(mesa.id, 'reserved');
        break;
    }
  };

  return (
    <div
      className={`
        absolute w-20 h-20 rounded-lg border-2 border-white shadow-lg 
        transition-all duration-200 cursor-pointer select-none
        ${getStatusColor(mesa.status)}
        ${isDragging ? 'scale-110 z-50 shadow-2xl' : 'hover:scale-105'}
      `}
      style={style}
      onClick={() => onClick(mesa)}
      title={`Mesa ${mesa.number} - ${mesa.capacity} pessoas - ${getStatusText(mesa.status)}`}
    >
      {/* Número da mesa */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-white font-bold text-lg">
            {mesa.number}
          </div>
          <div className="text-white text-xs opacity-90">
            {mesa.capacity}p
          </div>
        </div>
      </div>

      {/* Informações da comanda (se ocupada) */}
      {mesa.status === 'occupied' && mesa.currentComanda && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {mesa.peopleCount || 1}
            </span>
          </div>
        </div>
      )}

      {/* Tempo de ocupação */}
      {mesa.status === 'occupied' && mesa.occupiedSince && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded">
            {formatTime(mesa.occupiedSince)}
          </span>
        </div>
      )}

      {/* Valor atual da comanda */}
      {mesa.status === 'occupied' && mesa.currentTotal && mesa.currentTotal > 0 && (
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
            {formatCurrency(mesa.currentTotal)}
          </span>
        </div>
      )}

      {/* Ações rápidas (aparecem no hover) */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-200 opacity-0 hover:opacity-100">
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {mesa.status === 'available' && (
            <>
              <button
                onClick={(e) => handleQuickAction(e, 'ocupar')}
                className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                title="Ocupar mesa"
              >
                Ocupar
              </button>
              <button
                onClick={(e) => handleQuickAction(e, 'reservar')}
                className="bg-yellow-500 text-white text-xs px-2 py-1 rounded hover:bg-yellow-600"
                title="Reservar mesa"
              >
                Reservar
              </button>
            </>
          )}
          
          {mesa.status === 'occupied' && (
            <>
              <button
                onClick={(e) => handleQuickAction(e, 'liberar')}
                className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                title="Liberar mesa"
              >
                Liberar
              </button>
              <button
                onClick={(e) => handleQuickAction(e, 'limpar')}
                className="bg-gray-500 text-white text-xs px-2 py-1 rounded hover:bg-gray-600"
                title="Marcar para limpeza"
              >
                Limpar
              </button>
            </>
          )}
          
          {(mesa.status === 'cleaning' || mesa.status === 'reserved') && (
            <button
              onClick={(e) => handleQuickAction(e, 'liberar')}
              className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
              title="Liberar mesa"
            >
              Liberar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MesaCard;