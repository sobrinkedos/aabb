import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BarHeader from './components/BarHeader';
import BalcaoView from './components/BalcaoView';
import MesasView from './components/MesasView';
import ComandasView from './components/ComandasView';
import BarNotifications from './components/BarNotifications';

export type BarAttendanceMode = 'balcao' | 'mesas' | 'comandas';

const BarAttendance: React.FC = () => {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<BarAttendanceMode>('balcao');

  const handleModeChange = (mode: BarAttendanceMode) => {
    setActiveMode(mode);
  };

  const renderContent = () => {
    switch (activeMode) {
      case 'balcao':
        return <BalcaoView />;
      case 'mesas':
        return <MesasView />;
      case 'comandas':
        return <ComandasView />;
      default:
        return <BalcaoView />;
    }
  };

  return (
    <div className="bar-attendance-container min-h-screen bg-gray-50 flex flex-col">
      <BarHeader 
        mode={activeMode} 
        onModeChange={handleModeChange}
        user={user}
      />
      
      <main className="bar-content flex-1 p-4 md:p-6 overflow-auto">
        {renderContent()}
      </main>
      
      <BarNotifications />
    </div>
  );
};

export default BarAttendance;