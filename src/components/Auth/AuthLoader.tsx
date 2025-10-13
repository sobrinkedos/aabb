import React from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2 } from 'lucide-react';

interface AuthLoaderProps {
  message?: string;
  showLogo?: boolean;
}

export const AuthLoader: React.FC<AuthLoaderProps> = ({ 
  message = 'Carregando sessão...', 
  showLogo = true 
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        {showLogo && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">ClubManager Pro</h1>
            <p className="text-blue-200">Sistema de Gestão de Clubes</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Animated Loader */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 w-8 h-8 border-2 border-purple-500/30 border-b-purple-500 rounded-full"
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-white font-medium text-lg"
          >
            {message}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex space-x-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-blue-400 rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="mt-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto max-w-xs"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-blue-200 text-sm mt-4 max-w-md"
        >
          Verificando credenciais e carregando configurações...
        </motion.p>
      </motion.div>
    </div>
  );
};

// Componente simplificado para uso em contextos menores
export const SimpleAuthLoader: React.FC<{ message?: string }> = ({ 
  message = 'Carregando...' 
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Componente para loading inline
export const InlineAuthLoader: React.FC = () => {
  return (
    <div className="inline-flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      <span className="text-sm text-gray-600">Verificando...</span>
    </div>
  );
};

export default AuthLoader;