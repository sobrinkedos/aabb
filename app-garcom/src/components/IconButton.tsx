import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'ghost';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  color = theme.colors.primary.main,
  disabled = false,
  style,
}) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const buttonSize = sizeMap[size];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const variantStyles = {
      filled: {
        backgroundColor: color,
        ...theme.shadows.md,
      },
      outlined: {
        borderWidth: 2,
        borderColor: color,
        backgroundColor: 'transparent',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return { ...baseStyle, ...variantStyles[variant] };
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: disabled ? 0.9 : 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={[getButtonStyle(), disabled && styles.disabled, style]}
      >
        {icon}
      </MotiView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
