import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { RootState, AppDispatch } from '../store/store';
import { signOut } from '../store/slices/authSlice';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { theme } from '../theme';
import { Card, IconButton, Icons, Badge, ScreenTransition } from '../components';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.lg * 3) / 2;

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  screen: string;
  color: string;
  gradient: string[];
}

export default function HomeScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: mesas = [] } = useSelector((state: RootState) => state.mesas);
  const { items: comandas = [] } = useSelector((state: RootState) => state.comandas);

  const mesasOcupadas = mesas.filter((m) => m.status === 'ocupada').length;
  const comandasAbertas = comandas.filter((c) => c.status === 'aberta').length;

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

  const menuItems: MenuItem[] = [
    {
      id: 'mesas',
      title: 'Mesas',
      description: 'Gerenciar mesas',
      icon: <Icons.grid size={32} color="white" />,
      screen: 'Mesas',
      color: theme.colors.success.main,
      gradient: [theme.colors.success.main, theme.colors.success.dark],
    },
    {
      id: 'comandas',
      title: 'Comandas',
      description: 'Comandas ativas',
      icon: <Icons.receipt size={32} color="white" />,
      screen: 'Comandas',
      color: theme.colors.info.main,
      gradient: [theme.colors.info.main, theme.colors.info.dark],
    },
    {
      id: 'cardapio',
      title: 'Cardápio',
      description: 'Ver cardápio',
      icon: <Icons.restaurant size={32} color="white" />,
      screen: 'Cardapio',
      color: theme.colors.warning.main,
      gradient: [theme.colors.warning.main, theme.colors.warning.dark],
    },
    {
      id: 'showcase',
      title: 'Componentes',
      description: 'Ver redesign',
      icon: <Icons.Icon name="color-palette" size={32} color="white" />,
      screen: 'ComponentShowcase',
      color: theme.colors.secondary.main,
      gradient: [theme.colors.secondary.main, theme.colors.secondary.dark],
    },
  ];

  return (
    <ScreenTransition type="fade">
      <View style={styles.container}>
        {/* Header com gradiente */}
        <LinearGradient
          colors={theme.colors.primary.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>Olá,</Text>
                <Text style={styles.userName}>{user?.name || user?.email || 'Garçom'}</Text>
              </View>
              <View style={styles.headerRight}>
                <SyncStatusIndicator />
                <IconButton
                  icon={<Icons.Icon name="log-out" size={24} color="white" />}
                  onPress={handleSignOut}
                  variant="ghost"
                />
              </View>
            </View>
          </MotiView>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cards de Estatísticas */}
          <View style={styles.statsContainer}>
            <MotiView
              from={{ opacity: 0, translateX: -50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 200 }}
              style={styles.statCard}
            >
              <Card variant="elevated">
                <View style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: theme.colors.warning.light }]}>
                    <Icons.grid size={24} color={theme.colors.warning.dark} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{mesasOcupadas}</Text>
                    <Text style={styles.statLabel}>Mesas Ocupadas</Text>
                  </View>
                </View>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: 50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 300 }}
              style={styles.statCard}
            >
              <Card variant="elevated">
                <View style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: theme.colors.success.light }]}>
                    <Icons.receipt size={24} color={theme.colors.success.dark} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{comandasAbertas}</Text>
                    <Text style={styles.statLabel}>Comandas Abertas</Text>
                  </View>
                </View>
              </Card>
            </MotiView>
          </View>

          {/* Menu de Ações */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 400 }}
          >
            <Text style={styles.sectionTitle}>Menu Principal</Text>
          </MotiView>

          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  delay: 500 + index * 100,
                  damping: 15,
                }}
                style={styles.menuCard}
              >
                <Card
                  onPress={() => navigation?.navigate(item.screen)}
                  style={styles.menuCardInner}
                >
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.menuGradient}
                  >
                    <View style={styles.menuIcon}>{item.icon}</View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  </LinearGradient>
                </Card>
              </MotiView>
            ))}
          </View>

          {/* Card de Status do Sistema */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 900 }}
          >
            <Card variant="elevated" style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Icons.checkmarkCircle size={24} color={theme.colors.success.main} />
                <Text style={styles.statusTitle}>Sistema Configurado</Text>
              </View>
              <View style={styles.statusList}>
                <View style={styles.statusItem}>
                  <Icons.checkmark size={16} color={theme.colors.success.main} />
                  <Text style={styles.statusText}>Login com email e senha</Text>
                </View>
                <View style={styles.statusItem}>
                  <Icons.checkmark size={16} color={theme.colors.success.main} />
                  <Text style={styles.statusText}>Autenticação biométrica</Text>
                </View>
                <View style={styles.statusItem}>
                  <Icons.checkmark size={16} color={theme.colors.success.main} />
                  <Text style={styles.statusText}>Sincronização offline</Text>
                </View>
                <View style={styles.statusItem}>
                  <Icons.checkmark size={16} color={theme.colors.success.main} />
                  <Text style={styles.statusText}>Proteção de rotas</Text>
                </View>
              </View>
            </Card>
          </MotiView>

          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>
      </View>
    </ScreenTransition>
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  menuCard: {
    width: CARD_WIDTH,
  },
  menuCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  menuGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  menuIcon: {
    marginBottom: theme.spacing.md,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  menuDescription: {
    fontSize: 12,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  statusCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.success.light + '15',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success.main,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success.dark,
    marginLeft: theme.spacing.sm,
  },
  statusList: {
    gap: theme.spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
});
