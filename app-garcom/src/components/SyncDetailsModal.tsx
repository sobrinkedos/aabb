/**
 * Modal com Detalhes da Sincronização
 * 
 * Mostra informações detalhadas sobre operações pendentes e erros
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppSelector } from '../store/hooks';
import {
  selectPendingOperations,
  selectSyncErrors,
  selectIsOnline,
  selectLastSyncTime,
} from '../store/selectors';
import { sincronizacaoService } from '../services/SincronizacaoService';
import { UI_CONFIG } from '../utils/constants';
import { formatarDataHora } from '../types/transformers';

interface SyncDetailsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SyncDetailsModal({ visible, onClose }: SyncDetailsModalProps) {
  const pendingOperations = useAppSelector(selectPendingOperations);
  const syncErrors = useAppSelector(selectSyncErrors);
  const isOnline = useAppSelector(selectIsOnline);
  const lastSyncTime = useAppSelector(selectLastSyncTime);

  const handleSyncNow = async () => {
    try {
      await sincronizacaoService.sincronizarAgora();
      Alert.alert('Sucesso', 'Sincronização concluída');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao sincronizar');
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Limpar Fila',
      'Tem certeza que deseja limpar todas as operações pendentes? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            sincronizacaoService.limparFila();
            Alert.alert('Sucesso', 'Fila limpa');
          },
        },
      ]
    );
  };

  const getOperationLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      criar_comanda: 'Criar Comanda',
      adicionar_item: 'Adicionar Item',
      atualizar_item: 'Atualizar Item',
      fechar_comanda: 'Fechar Comanda',
      atualizar_mesa: 'Atualizar Mesa',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Detalhes de Sincronização</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.label}>Conectividade:</Text>
                <Text
                  style={[
                    styles.value,
                    { color: isOnline ? UI_CONFIG.COLORS.SUCCESS : UI_CONFIG.COLORS.ERROR },
                  ]}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.label}>Última Sincronização:</Text>
                <Text style={styles.value}>
                  {lastSyncTime ? formatarDataHora(lastSyncTime) : 'Nunca'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.label}>Operações Pendentes:</Text>
                <Text style={styles.value}>{pendingOperations.length}</Text>
              </View>
            </View>

            {/* Operações Pendentes */}
            {pendingOperations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Operações Pendentes</Text>
                {pendingOperations.map((op) => (
                  <View key={op.id} style={styles.operationCard}>
                    <View style={styles.operationHeader}>
                      <Text style={styles.operationType}>{getOperationLabel(op.tipo)}</Text>
                      <Text style={styles.operationAttempts}>
                        {op.tentativas}/{op.maxTentativas} tentativas
                      </Text>
                    </View>
                    <Text style={styles.operationTime}>{formatarDataHora(op.timestamp)}</Text>
                    {op.erro && <Text style={styles.operationError}>Erro: {op.erro}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Erros */}
            {syncErrors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Erros Recentes</Text>
                {syncErrors.map((error) => (
                  <View key={error.id} style={styles.errorCard}>
                    <Text style={styles.errorType}>
                      {getOperationLabel(error.operacao.tipo)}
                    </Text>
                    <Text style={styles.errorMessage}>{error.erro}</Text>
                    <Text style={styles.errorTime}>{formatarDataHora(error.timestamp)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Mensagem quando não há operações */}
            {pendingOperations.length === 0 && syncErrors.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>✓</Text>
                <Text style={styles.emptyStateText}>Tudo sincronizado!</Text>
                <Text style={styles.emptyStateSubtext}>Não há operações pendentes</Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {isOnline && pendingOperations.length > 0 && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleSyncNow}>
                <Text style={styles.primaryButtonText}>Sincronizar Agora</Text>
              </TouchableOpacity>
            )}

            {pendingOperations.length > 0 && (
              <TouchableOpacity style={styles.dangerButton} onPress={handleClearQueue}>
                <Text style={styles.dangerButtonText}>Limpar Fila</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    borderTopLeftRadius: UI_CONFIG.BORDER_RADIUS.LG,
    borderTopRightRadius: UI_CONFIG.BORDER_RADIUS.LG,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
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
  content: {
    padding: UI_CONFIG.SPACING.LG,
  },
  section: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  label: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  operationCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  operationType: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  operationAttempts: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  operationTime: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  operationError: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.ERROR,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  errorCard: {
    backgroundColor: UI_CONFIG.COLORS.ERROR + '10',
    borderLeftWidth: 3,
    borderLeftColor: UI_CONFIG.COLORS.ERROR,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  errorType: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.ERROR,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  errorMessage: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  errorTime: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.XL * 2,
  },
  emptyStateIcon: {
    fontSize: 48,
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
  },
  actions: {
    padding: UI_CONFIG.SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  primaryButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  primaryButtonText: {
    color: UI_CONFIG.COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: UI_CONFIG.COLORS.ERROR,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  dangerButtonText: {
    color: UI_CONFIG.COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.TEXT_SECONDARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
});
