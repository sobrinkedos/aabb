import React from 'react';
import { motion } from 'framer-motion';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5 md:p-6',
    lg: 'p-5 sm:p-6 md:p-8'
  };

  const baseClasses = `bg-white rounded-lg shadow-sm border border-gray-200 ${paddingClasses[padding]} ${className}`;
  const interactiveClasses = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : '';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow' : '';

  if (onClick) {
    return (
      <motion.div
        whileHover={hover ? { scale: 1.02 } : {}}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses} ${hoverClasses}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${hoverClasses}`}>
      {children}
    </div>
  );
};
