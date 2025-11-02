import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success.light;
      case 'warning':
        return theme.colors.warning.light;
      case 'error':
        return theme.colors.error.light;
      case 'info':
        return theme.colors.info.light;
      default:
        return theme.colors.neutral[200];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success.dark;
      case 'warning':
        return theme.colors.warning.dark;
      case 'error':
        return theme.colors.error.dark;
      case 'info':
        return theme.colors.info.dark;
      default:
        return theme.colors.neutral[700];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing.xs / 2,
          paddingHorizontal: theme.spacing.sm,
          fontSize: 10,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          fontSize: 14,
        };
      default:
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <MotiView
      from={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
