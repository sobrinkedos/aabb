import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useComandas } from '../../hooks/useComandas';
import BarHeader from './components/BarHeader';
import BalcaoView from './components/BalcaoView';
import MesasView from './components/MesasView';
import ComandasView from './components/ComandasView';
import OrderQueue from './components/OrderQueue';
import BarNotifications from './components/BarNotifications';

export type BarAttendanceMode = 'balcao' | 'mesas' | 'comandas' | 'fila';

const BarAttendance: React.FC = () => {
  const { user } = useAuth();
  const { updateItemStatus } = useComandas();
  const [activeMode, setActiveMode] = useState<BarAttendanceMode>('balcao');

  const handleModeChange = (mode: BarAttendanceMode) => {
    setActiveMode(mode);
  };

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      await updateItemStatus(itemId, status as any);
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error);
      throw error;
    }
  };

  const renderContent = () => {
    switch (activeMode) {
      case 'balcao':
        return <BalcaoView />;
      case 'mesas':
        return <MesasView />;
      case 'comandas':
        return <ComandasView />;
      case 'fila':
        return <OrderQueue onUpdateItemStatus={handleUpdateItemStatus} />;
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