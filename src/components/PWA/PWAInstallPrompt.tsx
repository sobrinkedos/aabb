import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se já foi instalado antes
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    const hasDeclined = localStorage.getItem('pwa-install-declined');
    
    if (hasDeclined) {
      return;
    }

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt após 30 segundos se não viu antes
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwa-install-prompt-seen', 'true');
        }, 30000);
      }
    };

    // Detectar quando foi instalado
    const handleAppInstalled = () => {
      console.log('✅ PWA instalado com sucesso!');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalar o PWA');
      } else {
        console.log('❌ Usuário recusou instalar o PWA');
        localStorage.setItem('pwa-install-declined', 'true');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-declined', 'true');
  };

  // Não mostrar se já está instalado ou não tem prompt
  if (isInstalled || !deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
      >
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Instalar ClubManager</h3>
                <p className="text-blue-100 text-sm">Acesso rápido e offline</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-blue-50 mb-4">
            Instale o ClubManager na sua tela inicial para acesso rápido e funcionalidade offline.
          </p>

          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm flex items-center justify-center space-x-2"
            >
              <Download size={18} />
              <span>Instalar App</span>
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors font-medium text-sm"
            >
              Agora Não
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-white border-opacity-20">
            <ul className="text-xs text-blue-100 space-y-1">
              <li>✓ Acesso instantâneo da tela inicial</li>
              <li>✓ Funciona offline</li>
              <li>✓ Atualizações automáticas</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
