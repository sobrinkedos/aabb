import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface OptimizedLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse';
}

const OptimizedLoader: React.FC<OptimizedLoaderProps> = memo(({ 
  message = 'Carregando...', 
  size = 'medium',
  variant = 'spinner'
}) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const containerClasses = {
    small: 'p-4',
    medium: 'p-8',
    large: 'p-12'
  };

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
        {message && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-600 text-center"
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-blue-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        {message && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-600 text-center"
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
        <motion.div
          className={`bg-blue-600 rounded-full ${sizeClasses[size]}`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {message && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-600 text-center"
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  return null;
});

OptimizedLoader.displayName = 'OptimizedLoader';

export default OptimizedLoader;