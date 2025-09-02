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
    comandas: 'Comandas'
  };

  const modeIcons = {
    balcao: '🍺',
    mesas: '🪑',
    comandas: '📋'
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
          {/* Título e informações do usuário */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Sistema de Atendimento - Bar
            </h1>
            {user && (
              <span className="text-sm text-gray-500 mt-1 sm:mt-0">
                Atendente: {user.full_name || user.email}
              </span>
            )}
          </div>

          {/* Navegação entre modos */}
          <nav className="flex space-x-1 overflow-x-auto">
            {(Object.keys(modeLabels) as BarAttendanceMode[]).map((modeKey) => (
              <button
                key={modeKey}
                onClick={() => onModeChange(modeKey)}
                className={`
                  flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap
                  ${mode === modeKey
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-lg">{modeIcons[modeKey]}</span>
                <span className="text-sm sm:text-base">{modeLabels[modeKey]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default BarHeader;