import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <MotiView
        animate={{
          borderColor: error
            ? theme.colors.error.main
            : isFocused
            ? theme.colors.primary.main
            : theme.colors.border.main,
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ type: 'timing', duration: 200 }}
        style={[styles.inputContainer, error && styles.inputError]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          {...textInputProps}
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, rightIcon && styles.inputWithRightIcon]}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </MotiView>
      
      {error && (
        <MotiView
          from={{ opacity: 0, translateY: -5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <Text style={styles.errorText}>{error}</Text>
        </MotiView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.main,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: theme.colors.error.main,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
  },
  inputWithLeftIcon: {
    marginLeft: theme.spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: theme.spacing.sm,
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error.main,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
});
