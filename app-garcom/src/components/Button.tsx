import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
    };

    const sizeStyles = {
      sm: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
      md: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
      lg: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
    };

    return { ...baseStyle, ...sizeStyles[size] };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    const sizeStyles = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    const variantStyles = {
      primary: { color: theme.colors.text.inverse },
      secondary: { color: theme.colors.text.inverse },
      outline: { color: theme.colors.primary.main },
      ghost: { color: theme.colors.primary.main },
    };

    return { ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] };
  };

  const renderContent = () => (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: isDisabled ? 0.95 : 1 }}
      transition={{ type: 'timing', duration: 200 }}
      style={[
        getButtonStyle(),
        fullWidth && { width: '100%' },
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.text.inverse : theme.colors.primary.main} />
      ) : (
        <>
          {icon && <MotiView style={{ marginRight: theme.spacing.sm }}>{icon}</MotiView>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </MotiView>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
        <LinearGradient
          colors={theme.colors.primary.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            getButtonStyle(),
            fullWidth && { width: '100%' },
            isDisabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              {icon && <MotiView style={{ marginRight: theme.spacing.sm }}>{icon}</MotiView>}
              <Text style={getTextStyle()}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: isDisabled ? 0.95 : 1 }}
          style={[
            getButtonStyle(),
            { backgroundColor: theme.colors.secondary.main },
            fullWidth && { width: '100%' },
            isDisabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              {icon && <MotiView style={{ marginRight: theme.spacing.sm }}>{icon}</MotiView>}
              <Text style={getTextStyle()}>{title}</Text>
            </>
          )}
        </MotiView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});
