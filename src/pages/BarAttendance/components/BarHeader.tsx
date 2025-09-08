import React from 'react';
import { User } from '../../../types';
import { BarAttendanceMode } from '../index';

interface BarHeaderProps {
  mode: BarAttendanceMode;
  onModeChange: (mode: BarAttendanceMode) => void;
  user: User | null;
}

const BarHeader: React.FC<BarHeaderProps> = ({ mode, onModeChange, user }) => {
  const modeLabels = {
    balcao: 'Balcão',
    mesas: 'Mesas',
    comandas: 'Comandas',
    fila: 'Fila',
    pedidos: 'Pedidos'
  };

  const modeLabelsLong = {
    balcao: 'Balcão',
    mesas: 'Mesas',
    comandas: 'Comandas',
    fila: 'Fila de Pedidos',
    pedidos: 'Pedidos Bar'
  };

  const modeIcons = {
    balcao: '🍺',
    mesas: '🪑',
    comandas: '📋',
    fila: '⏱️',
    pedidos: '🥃'
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-3 space-y-3 lg:space-y-0 min-h-16">
          {/* Título e informações do usuário */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 min-w-0 flex-1">
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
              <span className="hidden sm:inline">Sistema de Atendimento - </span>Bar
            </h1>
            {user && (
              <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0 truncate">
                <span className="hidden sm:inline">Atendente: </span>{user.full_name || user.email}
              </span>
            )}
          </div>

          {/* Navegação entre modos */}
          <nav className="flex flex-wrap gap-1 sm:gap-2">
            {(Object.keys(modeLabels) as BarAttendanceMode[]).map((modeKey) => (
              <button
                key={modeKey}
                onClick={() => onModeChange(modeKey)}
                className={`
                  flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm
                  ${mode === modeKey
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-sm sm:text-lg">{modeIcons[modeKey]}</span>
                <span className="hidden sm:inline">{modeLabelsLong[modeKey]}</span>
                <span className="sm:hidden">{modeLabels[modeKey]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default BarHeader;