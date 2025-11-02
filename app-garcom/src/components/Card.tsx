import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  style?: ViewStyle;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  style,
  animated = true,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background.primary,
    };

    const variantStyles = {
      elevated: theme.shadows.lg,
      outlined: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
      },
      filled: {
        backgroundColor: theme.colors.background.secondary,
      },
    };

    return { ...baseStyle, ...variantStyles[variant] };
  };

  const content = (
    <MotiView
      from={animated ? { opacity: 0, scale: 0.9 } : undefined}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[getCardStyle(), style]}
    >
      {children}
    </MotiView>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 },
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};
