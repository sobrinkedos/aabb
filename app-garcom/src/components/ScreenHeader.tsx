/**
 * Header de Tela com Botão de Voltar
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UI_CONFIG } from '../utils/constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightComponent,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {rightComponent && <View style={styles.rightSection}>{rightComponent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 32,
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: 8,
  },
});
