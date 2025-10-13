import React from 'react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { isDemoUser } from '../../utils/auth';
import { Zap, Info, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DemoIndicatorProps {
  variant?: 'banner' | 'badge' | 'card';
  showQuickLinks?: boolean;
}

export const DemoIndicator: React.FC<DemoIndicatorProps> = ({ 
  variant = 'banner', 
  showQuickLinks = false 
}) => {
  const { user } = useAuth();

  if (!isDemoUser(user)) {
    return null;
  }

  const quickLinks = [
    { label: 'Bar', path: '/bar', icon: '🍺' },
    { label: 'Cozinha', path: '/kitchen', icon: '👨‍🍳' },
    { label: 'Estoque', path: '/inventory', icon: '📦' },
    { label: 'Caixa', path: '/cash', icon: '💰' },
  ];

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">Modo Demonstração Ativo</span>
            <span className="text-green-100">•</span>
            <span className="text-sm">Explore todas as funcionalidades do sistema!</span>
          </div>
          
          {showQuickLinks && (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-green-100">Acesso rápido:</span>
              {quickLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm transition-colors"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === 'badge') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
      >
        <Zap className="w-4 h-4" />
        <span>Demo</span>
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 shadow-lg"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎯 Bem-vindo ao Modo Demonstração!
            </h3>
            
            <p className="text-gray-600 mb-4">
              Você está usando uma versão completa do ClubManager Pro. 
              Explore todos os módulos e funcionalidades sem limitações.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Dados de exemplo inclusos</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Todas as funcionalidades ativas</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Acesso de administrador</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sem limitações de tempo</span>
              </div>
            </div>

            {showQuickLinks && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  🚀 Navegação Rápida:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((link) => (
                    <a
                      key={link.path}
                      href={link.path}
                      className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {link.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Dica:</strong> Este é um ambiente de demonstração. 
                  Todas as alterações são temporárias e serão resetadas periodicamente.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default DemoIndicator;