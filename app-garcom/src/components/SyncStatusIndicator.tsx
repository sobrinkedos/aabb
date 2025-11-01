/**
 * Indicador Visual de Status de Sincronização
 * 
 * Mostra o status de conectividade e sincronização offline
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppSelector } from '../store/hooks';
import {
  selectIsOnline,
  selectIsSyncing,
  selectPendingOperationsCount,
  selectLastSyncTime,
} from '../store/selectors';
import { sincronizacaoService } from '../services/SincronizacaoService';
import { UI_CONFIG } from '../utils/constants';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  onPress?: () => void;
}

export default function SyncStatusIndicator({
  showDetails = false,
  onPress,
}: SyncStatusIndicatorProps) {
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const pendingCount = useAppSelector(selectPendingOperationsCount);
  const lastSyncTime = useAppSelector(selectLastSyncTime);

  const [timeAgo, setTimeAgo] = useState<string>('');

  // Atualizar "tempo atrás" a cada minuto
  useEffect(() => {
    const updateTimeAgo = () => {
      if (lastSyncTime) {
        const diff = Date.now() - new Date(lastSyncTime).getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) {
          setTimeAgo('agora');
        } else if (minutes === 1) {
          setTimeAgo('1 min atrás');
        } else if (minutes < 60) {
          setTimeAgo(`${minutes} min atrás`);
        } else {
          const hours = Math.floor(minutes / 60);
          setTimeAgo(`${hours}h atrás`);
        }
      } else {
        setTimeAgo('nunca');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Determinar status e cor
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        status: 'Offline',
        color: UI_CONFIG.COLORS.ERROR,
        icon: '📡',
        description: 'Sem conexão',
      };
    }

    if (isSyncing) {
      return {
        status: 'Sincronizando',
        color: UI_CONFIG.COLORS.WARNING,
        icon: '🔄',
        description: `${pendingCount} operações`,
      };
    }

    if (pendingCount > 0) {
      return {
        status: 'Pendente',
        color: UI_CONFIG.COLORS.WARNING,
        icon: '⏳',
        description: `${pendingCount} operações`,
      };
    }

    return {
      status: 'Sincronizado',
      color: UI_CONFIG.COLORS.SUCCESS,
      icon: '✓',
      description: timeAgo,
    };
  };

  const statusInfo = getStatusInfo();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isOnline && pendingCount > 0) {
      // Tentar sincronizar manualmente
      sincronizacaoService.sincronizarAgora();
    }
  };

  if (!showDetails) {
    // Versão compacta (apenas ícone)
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: statusInfo.color }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={UI_CONFIG.COLORS.SURFACE} />
        ) : (
          <Text style={styles.compactIcon}>{statusInfo.icon}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Versão detalhada
  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: statusInfo.color }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={statusInfo.color} />
        ) : (
          <Text style={[styles.icon, { color: statusInfo.color }]}>{statusInfo.icon}</Text>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.status}>{statusInfo.status}</Text>
        <Text style={styles.description}>{statusInfo.description}</Text>
      </View>

      {pendingCount > 0 && !isSyncing && (
        <View style={[styles.badge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Versão compacta
  compactContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compactIcon: {
    fontSize: 16,
  },

  // Versão detalhada
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderLeftWidth: 4,
    padding: UI_CONFIG.SPACING.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.SM,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: UI_CONFIG.SPACING.SM,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.SURFACE,
  },
});
