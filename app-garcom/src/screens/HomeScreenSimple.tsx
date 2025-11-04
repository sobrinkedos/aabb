import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState, AppDispatch } from '../store/store';
import { signOut } from '../store/slices/authSlice';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreenSimple({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

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
    { title: 'Mesas', icon: 'grid', screen: 'Mesas', color: theme.colors.success.main },
    { title: 'Comandas', icon: 'receipt', screen: 'Comandas', color: theme.colors.info.main },
    { title: 'Cardápio', icon: 'restaurant', screen: 'Cardapio', color: theme.colors.warning.main },
    { title: 'Fechamento', icon: 'calculator', screen: 'FechamentoDia', color: theme.colors.info.dark },
    { title: 'Componentes', icon: 'color-palette', screen: 'ComponentShowcase', color: theme.colors.secondary.main },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary.main} translucent={false} />
      {/* Header moderno e limpo com gradiente que cobre a StatusBar */}
      <LinearGradient
        colors={theme.colors.primary.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Garçom'}</Text>
          </View>
          <View style={styles.headerRight}>
            <SyncStatusIndicator />
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Menu Principal</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => navigation?.navigate(item.screen)}
          >
            <LinearGradient
              colors={[item.color, item.color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuGradient}
            >
              <Ionicons name={item.icon as any} size={32} color="white" />
              <Text style={styles.menuTitle}>{item.title}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>✅ Sistema Configurado</Text>
          <Text style={styles.statusText}>
            • Login com email e senha{'\n'}
            • Autenticação biométrica{'\n'}
            • Sincronização offline{'\n'}
            • Proteção de rotas
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.text.inverse,
    opacity: 0.85,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.inverse,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderLeftWidth: 4,
    ...theme.shadows.md,
  },
  menuGradient: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  statusCard: {
    backgroundColor: theme.colors.success.light + '15',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success.main,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success.dark,
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
});
