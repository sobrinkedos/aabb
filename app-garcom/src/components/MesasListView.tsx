/**
 * Visualização em Lista de Mesas
 * 
 * Alternativa ao mapa para visualização de mesas
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MesaComDetalhes, MesaStatusColor, MesaStatusLabel } from '../types';
import { formatarTempo } from '../types/transformers';
import { UI_CONFIG } from '../utils/constants';

interface MesasListViewProps {
  mesas: MesaComDetalhes[];
  onMesaPress: (mesa: MesaComDetalhes) => void;
  selectedMesaId?: string;
}

export default function MesasListView({
  mesas,
  onMesaPress,
  selectedMesaId,
}: MesasListViewProps) {
  const renderItem = ({ item }: { item: MesaComDetalhes }) => (
    <MesaListItem
      mesa={item}
      onPress={() => onMesaPress(item)}
      isSelected={item.id === selectedMesaId}
    />
  );

  return (
    <FlatList
      data={mesas}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

interface MesaListItemProps {
  mesa: MesaComDetalhes;
  onPress: () => void;
  isSelected: boolean;
}

function MesaListItem({ mesa, onPress, isSelected }: MesaListItemProps) {
  const statusColor = MesaStatusColor[mesa.status];

  return (
    <TouchableOpacity
      style={[
        styles.item,
        isSelected && styles.itemSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Indicador de status */}
      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mesaNumber}>Mesa {mesa.number}</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {MesaStatusLabel[mesa.status]}
          </Text>
        </View>

        {/* Informações */}
        <View style={styles.info}>
          <InfoItem icon="👥" text={`${mesa.capacity} lugares`} />
          {mesa.people_count && mesa.people_count > 0 && (
            <InfoItem icon="🪑" text={`${mesa.people_count} ocupados`} />
          )}
          {mesa.occupied_since && (
            <InfoItem icon="⏱️" text={formatarTempo(mesa.occupied_since)} />
          )}
        </View>

        {/* Total da comanda */}
        {mesa.current_total && mesa.current_total > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>R$ {mesa.current_total.toFixed(2)}</Text>
          </View>
        )}

        {/* Badges */}
        <View style={styles.badges}>
          {mesa.current_comanda_id && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>📋 Comanda Ativa</Text>
            </View>
          )}
        </View>
      </View>

      {/* Seta */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

interface InfoItemProps {
  icon: string;
  text: string;
}

function InfoItem({ icon, text }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: UI_CONFIG.SPACING.MD,
  },
  separator: {
    height: UI_CONFIG.SPACING.SM,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
  },
  statusIndicator: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: UI_CONFIG.SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  mesaNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONFIG.SPACING.SM,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: 4,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
    padding: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  totalLabel: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONFIG.SPACING.XS,
  },
  badge: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '20',
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: 4,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  badgeText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  arrow: {
    justifyContent: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
  },
  arrowText: {
    fontSize: 24,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
});
