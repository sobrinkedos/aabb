import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';

import { RootState } from '../store/store';
import { theme } from '../theme';
import { ScreenTransition, Card, Icons, Badge, IconButton } from '../components';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.lg * 3) / 2;

interface QuickActionCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  gradient: string[];
  onPress: () => void;
}

export default function HomeScreenModern() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: mesas } = useSelector((state: RootState) => state.mesas);
  const { items: comandas } = useSelector((state: RootState) => state.comandas);

  const mesasOcupadas = mesas.filter((m) => m.status === 'ocupada').length;
  const comandasAbertas = comandas.filter((c) => c.status === 'aberta').length;

  const quickActions: QuickActionCard[] = [
    {
      id: 'mesas',
      title: 'Mesas',
      icon: <Icons.grid size={32} color="white" />,
      color: theme.colors.primary.main,
      gradient: theme.colors.primary.gradient,
      onPress: () => console.log('Mesas'),
    },
    {
      id: 'comandas',
      title: 'Comandas',
      icon: <Icons.receipt size={32} color="white" />,
      color: theme.colors.secondary.main,
      gradient: [theme.colors.secondary.main, theme.colors.secondary.dark],
      onPress: () => console.log('Comandas'),
    },
    {
      id: 'cardapio',
      title: 'Cardápio',
      icon: <Icons.restaurant size={32} color="white" />,
      color: theme.colors.success.main,
      gradient: [theme.colors.success.main, theme.colors.success.dark],
      onPress: () => console.log('Cardápio'),
    },
    {
      id: 'nova-comanda',
      title: 'Nova Comanda',
      icon: <Icons.addCircle size={32} color="white" />,
      color: theme.colors.info.main,
      gradient: [theme.colors.info.main, theme.colors.info.dark],
      onPress: () => console.log('Nova Comanda'),
    },
  ];

  return (
    <ScreenTransition type="fade">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              <View>
                <Text style={styles.greeting}>Olá,</Text>
                <Text style={styles.userName}>{user?.nome || 'Garçom'}</Text>
              </View>
              <IconButton
                icon={<Icons.settings size={24} color="white" />}
                onPress={() => console.log('Settings')}
                variant="ghost"
              />
            </View>
          </MotiView>
        </LinearGradient>

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

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 400 }}
          >
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          </MotiView>

          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <MotiView
                key={action.id}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  delay: 500 + index * 100,
                  damping: 15,
                }}
                style={styles.quickActionCard}
              >
                <Card onPress={action.onPress} style={styles.actionCardInner}>
                  <LinearGradient
                    colors={action.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionGradient}
                  >
                    <View style={styles.actionIcon}>{action.icon}</View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </LinearGradient>
                </Card>
              </MotiView>
            ))}
          </View>
        </View>

        {/* Atividade Recente */}
        <View style={styles.section}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 900 }}
          >
            <Text style={styles.sectionTitle}>Atividade Recente</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 1000 }}
          >
            <Card variant="elevated" style={styles.activityCard}>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.success.light }]}>
                  <Icons.checkmarkCircle size={20} color={theme.colors.success.dark} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Mesa 5 - Pedido Entregue</Text>
                  <Text style={styles.activityTime}>Há 5 minutos</Text>
                </View>
                <Badge label="Concluído" variant="success" size="sm" />
              </View>

              <View style={styles.divider} />

              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.warning.light }]}>
                  <Icons.time size={20} color={theme.colors.warning.dark} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Mesa 3 - Aguardando</Text>
                  <Text style={styles.activityTime}>Há 12 minutos</Text>
                </View>
                <Badge label="Pendente" variant="warning" size="sm" />
              </View>

              <View style={styles.divider} />

              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.info.light }]}>
                  <Icons.addCircle size={20} color={theme.colors.info.dark} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Nova Comanda #123</Text>
                  <Text style={styles.activityTime}>Há 20 minutos</Text>
                </View>
                <Badge label="Nova" variant="info" size="sm" />
              </View>
            </Card>
          </MotiView>
        </View>
      </ScrollView>
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
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickActionCard: {
    width: CARD_WIDTH,
  },
  actionCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  actionIcon: {
    marginBottom: theme.spacing.md,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: theme.spacing.xl,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.sm,
  },
});
