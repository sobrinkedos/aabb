/**
 * Tela de Comandas
 * 
 * Listagem e gerenciamento de comandas ativas
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectComandas,
  selectComandasLoading,
  selectComandasStats,
} from '../store/selectors';
import {
  fetchComandasAbertas,
  setComandaAtiva,
  cancelarComanda,
} from '../store/slices/comandasSlice';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { ComandaComDetalhes, ComandaStatusLabel } from '../types';
import { formatarMoeda, formatarTempo } from '../types/transformers';
import { UI_CONFIG } from '../utils/constants';

export default function ComandasScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const comandas = useAppSelector(selectComandas) || [];
  const isLoading = useAppSelector(selectComandasLoading);
  const stats = useAppSelector(selectComandasStats) || { abertas: 0, aguardandoPagamento: 0, totalVendas: 0 };

  const [refreshing, setRefreshing] = useState(false);

  // Carregar comandas ao montar
  useEffect(() => {
    dispatch(fetchComandasAbertas());
  }, [dispatch]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchComandasAbertas());
    setRefreshing(false);
  };

  // Abrir comanda
  const handleComandaPress = (comanda: ComandaComDetalhes) => {
    dispatch(setComandaAtiva(comanda));
    navigation?.navigate('ComandaDetalhes', { comandaId: comanda.id });
  };

  // Nova comanda
  const handleNovaComanda = () => {
    navigation?.navigate('NovaComanda');
  };

  // Cancelar comanda
  const handleCancelarComanda = (comanda: ComandaComDetalhes) => {
    Alert.alert(
      'Cancelar Comanda',
      `Tem certeza que deseja cancelar a comanda da mesa ${comanda.table_number}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelarComanda(comanda.id)).unwrap();
              Alert.alert('Sucesso', 'Comanda cancelada');
            } catch (error: any) {
              Alert.alert('Erro', error || 'Erro ao cancelar comanda');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ComandaComDetalhes }) => {
    if (!item || !item.id) return null;
    return (
      <ComandaCard
        comanda={item}
        onPress={() => handleComandaPress(item)}
        onCancel={() => handleCancelarComanda(item)}
      />
    );
  };

  // Garantir que stats tem valores válidos
  const safeStats = {
    abertas: stats?.abertas ?? 0,
    aguardandoPagamento: stats?.aguardandoPagamento ?? 0,
    totalVendas: stats?.totalVendas ?? 0,
  };

  // Mostrar loading enquanto carrega dados iniciais
  if (isLoading && comandas.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Carregando comandas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Comandas</Text>
            <Text style={styles.subtitle}>
              {safeStats.abertas} abertas • R$ {safeStats.totalVendas.toFixed(2)} em vendas
            </Text>
          </View>
        </View>
        <SyncStatusIndicator />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard label="Abertas" value={safeStats.abertas} color="#4CAF50" />
        <StatCard
          label="Aguardando"
          value={safeStats.aguardandoPagamento}
          color="#FF9800"
        />
        <StatCard
          label="Total"
          value={`R$ ${safeStats.totalVendas.toFixed(0)}`}
          color="#2196F3"
        />
      </View>

      {/* Lista de Comandas */}
      <FlatList
        data={comandas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>Nenhuma comanda aberta</Text>
            <Text style={styles.emptyStateSubtext}>
              Toque no botão + para criar uma nova comanda
            </Text>
          </View>
        }
      />

      {/* Botão Nova Comanda */}
      <TouchableOpacity style={styles.fab} onPress={handleNovaComanda}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  // Garantir que value é sempre uma string válida
  const displayValue = value !== null && value !== undefined ? String(value) : '0';
  const displayLabel = label || '';
  
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{displayValue}</Text>
      <Text style={styles.statLabel}>{displayLabel}</Text>
    </View>
  );
}

interface ComandaCardProps {
  comanda: ComandaComDetalhes;
  onPress: () => void;
  onCancel: () => void;
}

function ComandaCard({ comanda, onPress, onCancel }: ComandaCardProps) {
  // Validar dados da comanda
  if (!comanda || !comanda.id) {
    return null;
  }

  // Garantir que todos os valores são strings válidas
  const tempoAberta = String(formatarTempo(comanda.opened_at) || '0min');
  const hasPendingItems = (comanda.pending_items || 0) > 0;
  const mesaTexto = comanda.table_number ? `Mesa ${String(comanda.table_number)}` : 'Balcão';
  const clienteTexto = String(comanda.customer_name || 'Cliente não identificado');
  const statusTexto = String(ComandaStatusLabel[comanda.status] || comanda.status || 'Aberta');
  const peopleCount = Number(comanda.people_count) || 0;
  const itemsCount = Number(comanda.items_count) || 0;
  const pendingItems = Number(comanda.pending_items) || 0;
  const total = Number(comanda.total) || 0;

  return (
    <TouchableOpacity style={styles.comandaCard} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.comandaHeader}>
        <View>
          <Text style={styles.comandaMesa}>
            {mesaTexto}
          </Text>
          <Text style={styles.comandaCliente}>
            {clienteTexto}
          </Text>
        </View>
        <View style={styles.comandaStatus}>
          <Text style={styles.comandaStatusText}>
            {statusTexto}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.comandaInfo}>
        <InfoBadge icon="⏱️" text={tempoAberta} />
        <InfoBadge icon="👥" text={`${peopleCount} pessoas`} />
        {itemsCount > 0 && (
          <InfoBadge icon="📝" text={`${itemsCount} itens`} />
        )}
        {hasPendingItems && (
          <InfoBadge
            icon="⏳"
            text={`${pendingItems} pendentes`}
            color="#FF9800"
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.comandaFooter}>
        <View>
          <Text style={styles.comandaTotalLabel}>Total</Text>
          <Text style={styles.comandaTotalValue}>{formatarMoeda(total)}</Text>
        </View>

        <View style={styles.comandaActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface InfoBadgeProps {
  icon: string;
  text: string;
  color?: string;
}

function InfoBadge({ icon, text, color }: InfoBadgeProps) {
  // Garantir que icon e text são sempre strings válidas
  const displayIcon = icon || '';
  const displayText = text !== null && text !== undefined ? String(text) : '';
  
  return (
    <View style={[styles.infoBadge, color && { backgroundColor: color + '20' }]}>
      <Text style={styles.infoBadgeIcon}>{displayIcon}</Text>
      <Text style={[styles.infoBadgeText, color && { color }]}>{displayText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  headerLeft: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: UI_CONFIG.SPACING.MD,
    gap: UI_CONFIG.SPACING.SM,
  },
  statCard: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  listContainer: {
    padding: UI_CONFIG.SPACING.MD,
    paddingBottom: 80,
  },
  comandaCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  comandaMesa: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  comandaCliente: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  comandaStatus: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '20',
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: 4,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  comandaStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  comandaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONFIG.SPACING.XS,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: 4,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  infoBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  infoBadgeText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  comandaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: UI_CONFIG.SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  comandaTotalLabel: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  comandaTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
    marginTop: 2,
  },
  comandaActions: {
    flexDirection: 'row',
    gap: UI_CONFIG.SPACING.SM,
  },
  cancelButton: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.ERROR,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.ERROR,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.XL * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: UI_CONFIG.SPACING.LG,
    bottom: UI_CONFIG.SPACING.LG,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
