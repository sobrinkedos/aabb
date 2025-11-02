import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
    { title: 'Componentes', icon: 'color-palette', screen: 'ComponentShowcase', color: theme.colors.secondary.main },
  ];

  return (
    <View style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={theme.colors.primary.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.name || user?.email || 'Garçom'}</Text>
          </View>
          <View style={styles.headerRight}>
            <SyncStatusIndicator />
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <Ionicons name="log-out" size={24} color="white" />
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
    paddingTop: theme.spacing.xl + 20,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xxl,
    borderBottomRightRadius: theme.borderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.xs,
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
