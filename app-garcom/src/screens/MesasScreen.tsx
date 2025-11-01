/**
 * Tela de Mesas
 * 
 * Visualização e gerenciamento de mesas do restaurante
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectMesas,
  selectMesaSelecionada,
  selectMesasLoading,
  selectMesasStats,
  selectFiltroStatusMesa,
} from '../store/selectors';
import {
  fetchMesas,
  selecionarMesa,
  setFiltroStatus,
  atualizarStatusMesa,
} from '../store/slices/mesasSlice';
import MapaMesas from '../components/MapaMesas';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { MesaComDetalhes, Mesa, MesaStatusLabel } from '../types';
import { UI_CONFIG } from '../utils/constants';

interface MesasScreenProps {
  navigation?: any;
}

export default function MesasScreen({ navigation }: MesasScreenProps) {
  const dispatch = useAppDispatch();
  const mesas = useAppSelector(selectMesas);
  const mesaSelecionada = useAppSelector(selectMesaSelecionada);
  const isLoading = useAppSelector(selectMesasLoading);
  const stats = useAppSelector(selectMesasStats);
  const filtroStatus = useAppSelector(selectFiltroStatusMesa);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar mesas ao montar
  useEffect(() => {
    dispatch(fetchMesas());
  }, [dispatch]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMesas());
    setRefreshing(false);
  };

  // Selecionar mesa
  const handleMesaPress = (mesa: MesaComDetalhes) => {
    dispatch(selecionarMesa(mesa));
  };

  // Fechar detalhes
  const handleCloseDetails = () => {
    dispatch(selecionarMesa(undefined));
  };

  // Alterar status da mesa
  const handleChangeStatus = async (novoStatus: Mesa['status']) => {
    if (!mesaSelecionada) return;

    try {
      await dispatch(
        atualizarStatusMesa({
          mesaId: mesaSelecionada.id,
          status: novoStatus,
        })
      ).unwrap();

      Alert.alert('Sucesso', 'Status da mesa atualizado');
      setShowStatusModal(false);
    } catch (error: any) {
      Alert.alert('Erro', error || 'Erro ao atualizar status');
    }
  };

  // Filtrar mesas
  const mesasFiltradas = filtroStatus
    ? mesas.filter((m) => m.status === filtroStatus)
    : mesas;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Mesas</Text>
            <Text style={styles.subtitle}>
              {stats.disponiveis} disponíveis • {stats.ocupadas} ocupadas
            </Text>
          </View>
        </View>
        <SyncStatusIndicator />
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        <FilterButton
          label="Todas"
          count={stats.total}
          active={!filtroStatus}
          onPress={() => dispatch(setFiltroStatus(undefined))}
        />
        <FilterButton
          label="Disponíveis"
          count={stats.disponiveis}
          active={filtroStatus === 'available'}
          onPress={() => dispatch(setFiltroStatus('available'))}
          color="#4CAF50"
        />
        <FilterButton
          label="Ocupadas"
          count={stats.ocupadas}
          active={filtroStatus === 'occupied'}
          onPress={() => dispatch(setFiltroStatus('occupied'))}
          color="#F44336"
        />
      </View>

      {/* Mapa */}
      <MapaMesas
        mesas={mesasFiltradas}
        onMesaPress={handleMesaPress}
        selectedMesaId={mesaSelecionada?.id}
        showOccupationTime
      />

      {/* Detalhes da Mesa Selecionada */}
      {mesaSelecionada && (
        <MesaDetailsPanel
          mesa={mesaSelecionada}
          onClose={handleCloseDetails}
          onChangeStatus={() => setShowStatusModal(true)}
        />
      )}

      {/* Modal de Mudança de Status */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Status</Text>

            {(['available', 'occupied', 'reserved', 'cleaning', 'maintenance'] as Mesa['status'][]).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusOption}
                  onPress={() => handleChangeStatus(status)}
                >
                  <Text style={styles.statusOptionText}>{MesaStatusLabel[status]}</Text>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  color?: string;
}

function FilterButton({ label, count, active, onPress, color }: FilterButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        active && styles.filterButtonActive,
        active && color && { backgroundColor: color },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
      <Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text>
    </TouchableOpacity>
  );
}

interface MesaDetailsPanelProps {
  mesa: MesaComDetalhes;
  onClose: () => void;
  onChangeStatus: () => void;
}

function MesaDetailsPanel({ mesa, onClose, onChangeStatus }: MesaDetailsPanelProps) {
  return (
    <View style={styles.detailsPanel}>
      <View style={styles.detailsHeader}>
        <View>
          <Text style={styles.detailsTitle}>Mesa {mesa.number}</Text>
          <Text style={styles.detailsStatus}>{MesaStatusLabel[mesa.status]}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContent}>
        <DetailRow label="Capacidade" value={`${mesa.capacity} pessoas`} />
        {mesa.people_count && mesa.people_count > 0 && (
          <DetailRow label="Ocupação Atual" value={`${mesa.people_count} pessoas`} />
        )}
        {mesa.current_total && mesa.current_total > 0 && (
          <DetailRow label="Total da Comanda" value={`R$ ${mesa.current_total.toFixed(2)}`} />
        )}
        {mesa.occupied_since && (
          <DetailRow
            label="Tempo de Ocupação"
            value={formatarTempo(mesa.occupied_since)}
          />
        )}
        {mesa.notes && <DetailRow label="Observações" value={mesa.notes} />}
      </View>

      <View style={styles.detailsActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onChangeStatus}>
          <Text style={styles.actionButtonText}>Alterar Status</Text>
        </TouchableOpacity>

        {mesa.current_comanda_id && (
          <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Ver Comanda
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatarTempo(inicio: string): string {
  const diff = Date.now() - new Date(inicio).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
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
  filters: {
    flexDirection: 'row',
    padding: UI_CONFIG.SPACING.MD,
    gap: UI_CONFIG.SPACING.SM,
  },
  filterButton: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.SM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  filterButtonActive: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
  },
  filterLabel: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginTop: 4,
  },
  filterCountActive: {
    color: '#fff',
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopLeftRadius: UI_CONFIG.BORDER_RADIUS.LG,
    borderTopRightRadius: UI_CONFIG.BORDER_RADIUS.LG,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  detailsStatus: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  detailsContent: {
    padding: UI_CONFIG.SPACING.LG,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  detailLabel: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  detailsActions: {
    flexDirection: 'row',
    padding: UI_CONFIG.SPACING.LG,
    gap: UI_CONFIG.SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  primaryActionButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
  },
  primaryActionButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    padding: UI_CONFIG.SPACING.LG,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.LG,
    textAlign: 'center',
  },
  statusOption: {
    padding: UI_CONFIG.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  statusOptionText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: UI_CONFIG.SPACING.MD,
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.ERROR,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
