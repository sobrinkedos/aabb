import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { signOut } from '../store/slices/authSlice';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { UI_CONFIG } from '../utils/constants';

export default function HomeScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  // Verificar se navigation existe
  if (!navigation) {
    console.error('Navigation prop is undefined in HomeScreen');
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sair do App',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => dispatch(signOut()),
        },
      ]
    );
  };

  const menuItems = [
    {
      title: '🗺️ Mesas',
      description: 'Visualizar e gerenciar mesas',
      screen: 'Mesas',
      color: '#4CAF50',
    },
    {
      title: '📋 Comandas',
      description: 'Gerenciar comandas ativas',
      screen: 'Comandas',
      color: '#2196F3',
    },
    {
      title: '🍽️ Cardápio',
      description: 'Ver itens do cardápio',
      screen: 'Cardapio',
      color: '#FF9800',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>App Garçom</Text>
          <Text style={styles.subtitle}>
            Olá, {user?.name || 'Garçom'}
          </Text>
        </View>
        <SyncStatusIndicator />
      </View>

      {/* Menu */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Menu Principal</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => navigation?.navigate(item.screen)}
          >
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ Sistema Configurado</Text>
          <Text style={styles.infoText}>
            • Login com email e senha{'\n'}
            • Autenticação biométrica{'\n'}
            • Sincronização offline{'\n'}
            • Proteção de rotas{'\n'}
            • Validação de formulários
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={isLoading}
        >
          <Text style={styles.signOutButtonText}>
            Sair do App
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.LG,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: UI_CONFIG.SPACING.LG,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.LG,
    marginBottom: UI_CONFIG.SPACING.MD,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  menuItemArrow: {
    fontSize: 32,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginLeft: UI_CONFIG.SPACING.MD,
  },
  infoCard: {
    backgroundColor: UI_CONFIG.COLORS.SUCCESS + '10',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.LG,
    marginTop: UI_CONFIG.SPACING.LG,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.SUCCESS + '40',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.SUCCESS,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  infoText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    lineHeight: 22,
  },
  footer: {
    padding: UI_CONFIG.SPACING.LG,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  signOutButton: {
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.ERROR,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: UI_CONFIG.COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
});