import React from 'react';
import { Bell, Search, Database } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useEnvironmentContext } from '../../contexts/EnvironmentContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const { notifications, clearNotifications } = useApp();
  const { environment, isConnected, config } = useEnvironmentContext();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showEnvironmentInfo, setShowEnvironmentInfo] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Indicador de Ambiente */}
          <div className="relative">
            <button
              onClick={() => setShowEnvironmentInfo(!showEnvironmentInfo)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                environment === 'production' 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <Database size={12} />
              <span>{environment === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </button>

            <AnimatePresence>
              {showEnvironmentInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Informações do Ambiente</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ambiente:</span>
                        <span className="font-medium">{environment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                          {isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                      {config && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Banco:</span>
                          <span className="font-mono text-xs">{config.databaseName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Notificações</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Limpar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">Nenhuma notificação</p>
                    ) : (
                      notifications.map((notification, index) => (
                        <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
                          <p className="text-sm text-gray-700">{notification}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
