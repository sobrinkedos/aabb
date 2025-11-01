import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAUpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado');
    },
    onRegisterError(error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    },
  });

  useEffect(() => {
    if (offlineReady || needRefresh) {
      setShowPrompt(true);
    }
  }, [offlineReady, needRefresh]);

  const close = () => {
    setShowPrompt(false);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const update = () => {
    updateServiceWorker(true);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {needRefresh ? 'Atualização Disponível' : 'App Pronto para Offline'}
                </h3>
              </div>
            </div>
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {needRefresh
              ? 'Uma nova versão do ClubManager está disponível. Atualize para obter as últimas funcionalidades.'
              : 'O ClubManager está pronto para funcionar offline!'}
          </p>

          <div className="flex space-x-2">
            {needRefresh && (
              <button
                onClick={update}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Atualizar Agora
              </button>
            )}
            <button
              onClick={close}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              {needRefresh ? 'Mais Tarde' : 'Entendi'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
