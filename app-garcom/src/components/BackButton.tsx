import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface BackButtonProps {
  onPress: () => void;
  style?: any;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.backButton, style]} onPress={onPress}>
      <View style={styles.backButtonCircle}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
});
