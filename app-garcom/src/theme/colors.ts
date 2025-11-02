export const colors = {
  // Primary colors - Gradiente moderno
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  
  // Secondary colors
  secondary: {
    main: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
  },
  
  // Success
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  
  // Warning
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
  },
  
  // Error
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  
  // Info
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  
  // Neutral colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
  },
  
  // Text
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Border
  border: {
    light: '#E5E7EB',
    main: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Status colors
  status: {
    open: '#10B981',
    occupied: '#F59E0B',
    closed: '#EF4444',
    pending: '#3B82F6',
  },
};

export type ColorScheme = typeof colors;
