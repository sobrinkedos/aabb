/**
 * Mapa Visual de Mesas
 * 
 * Visualização 2D das mesas do restaurante com status em tempo real
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { MesaComDetalhes, MesaStatusColor, MesaStatusLabel } from '../types';
import { formatarTempo } from '../types/transformers';
import { UI_CONFIG } from '../utils/constants';

interface MapaMesasProps {
  mesas: MesaComDetalhes[];
  onMesaPress: (mesa: MesaComDetalhes) => void;
  selectedMesaId?: string;
  showOccupationTime?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAP_WIDTH = SCREEN_WIDTH - 32; // Padding
const MAP_HEIGHT = SCREEN_HEIGHT * 0.5; // Reduzido para dar mais espaço vertical

// Função para distribuir mesas automaticamente em grid uniforme
function distribuirMesasEmGrid(mesas: MesaComDetalhes[]): MesaComDetalhes[] {
  if (mesas.length === 0) return mesas;

  // SEMPRE redistribuir em grid uniforme para garantir espaçamento igual
  const totalMesas = mesas.length;
  
  // Definir número ideal de colunas baseado na quantidade de mesas
  // Para 10 mesas: 4 colunas x 3 linhas
  let colunas: number;
  if (totalMesas <= 4) {
    colunas = 2;
  } else if (totalMesas <= 9) {
    colunas = 3;
  } else if (totalMesas <= 16) {
    colunas = 4;
  } else {
    colunas = 5;
  }
  
  const linhas = Math.ceil(totalMesas / colunas);

  // Distribuir mesas em grid uniforme
  return mesas.map((mesa, index) => {
    const col = index % colunas;
    const row = Math.floor(index / colunas);

    // Calcular posição percentual com espaçamento uniforme
    // Usar a mesma margem para X e Y para espaçamento proporcional
    const margin = 10;
    
    // Calcular espaçamento entre mesas
    const spacingX = (100 - 2 * margin) / (colunas - 1 || 1);
    const spacingY = spacingX; // Mesmo espaçamento vertical que horizontal
    
    // Calcular posições
    const position_x = colunas > 1 ? margin + (col * spacingX) : 50;
    const position_y = linhas > 1 ? margin + (row * spacingY) : 50;

    return {
      ...mesa,
      position_x,
      position_y,
    };
  });
}

export default function MapaMesas({
  mesas,
  onMesaPress,
  selectedMesaId,
  showOccupationTime = true,
}: MapaMesasProps) {
  // Distribuir mesas automaticamente se necessário
  const mesasComPosicao = distribuirMesasEmGrid(mesas);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mapContainer, { width: MAP_WIDTH, minHeight: MAP_HEIGHT }]}>
          {mesasComPosicao.map((mesa) => (
            <MesaCard
              key={mesa.id}
              mesa={mesa}
              onPress={() => onMesaPress(mesa)}
              isSelected={mesa.id === selectedMesaId}
              showOccupationTime={showOccupationTime}
              mapWidth={MAP_WIDTH}
              mapHeight={MAP_HEIGHT}
            />
          ))}
        </View>
      </ScrollView>

      {/* Legenda */}
      <View style={styles.legend}>
        <LegendItem status="available" label="Disponível" />
        <LegendItem status="occupied" label="Ocupada" />
        <LegendItem status="reserved" label="Reservada" />
        <LegendItem status="cleaning" label="Limpeza" />
      </View>
    </View>
  );
}

interface MesaCardProps {
  mesa: MesaComDetalhes;
  onPress: () => void;
  isSelected: boolean;
  showOccupationTime: boolean;
  mapWidth: number;
  mapHeight: number;
}

function MesaCard({
  mesa,
  onPress,
  isSelected,
  showOccupationTime,
  mapWidth,
  mapHeight,
}: MesaCardProps) {
  // Animação de pulsação para mesas selecionadas
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      // Animação de pulsação
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isSelected, scaleAnim]);

  // Animação de fade para mudanças de status
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mesa.status, opacityAnim]);

  // Calcular posição no mapa (0-100 para coordenadas)
  const left = (mesa.position_x / 100) * mapWidth;
  const top = (mesa.position_y / 100) * mapHeight;

  // Tamanho baseado na capacidade
  const size = Math.max(60, Math.min(100, 40 + mesa.capacity * 10));

  // Cor baseada no status
  const backgroundColor = MesaStatusColor[mesa.status];

  // Verificar se está ocupada há muito tempo (mais de 2 horas)
  const isLongOccupation =
    mesa.occupied_since &&
    Date.now() - new Date(mesa.occupied_since).getTime() > 2 * 60 * 60 * 1000;

  return (
    <Animated.View
      style={[
        styles.mesaContainer,
        {
          left: left - size / 2,
          top: top - size / 2,
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.mesa,
          {
            backgroundColor,
            borderWidth: isSelected ? 3 : 1,
            borderColor: isSelected ? UI_CONFIG.COLORS.PRIMARY : 'rgba(0,0,0,0.1)',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Número da mesa */}
        <Text style={styles.mesaNumber}>{mesa.number}</Text>

        {/* Capacidade */}
        <Text style={styles.mesaCapacity}>👥 {mesa.capacity}</Text>

        {/* Indicador de tempo de ocupação */}
        {showOccupationTime && mesa.occupied_since && (
          <View
            style={[
              styles.timeIndicator,
              isLongOccupation && styles.timeIndicatorWarning,
            ]}
          >
            <Text style={styles.timeText}>
              ⏱️ {formatarTempo(mesa.occupied_since)}
            </Text>
          </View>
        )}

        {/* Badge de pessoas */}
        {mesa.people_count && mesa.people_count > 0 && (
          <View style={styles.peopleBadge}>
            <Text style={styles.peopleBadgeText}>{mesa.people_count}</Text>
          </View>
        )}

        {/* Indicador de comanda ativa */}
        {mesa.current_comanda_id && (
          <View style={styles.comandaIndicator}>
            <Text style={styles.comandaIndicatorText}>📋</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Tooltip com informações */}
      {isSelected && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTitle}>{mesa.number}</Text>
          <Text style={styles.tooltipText}>{MesaStatusLabel[mesa.status]}</Text>
          {mesa.current_total && mesa.current_total > 0 && (
            <Text style={styles.tooltipText}>
              Total: R$ {mesa.current_total.toFixed(2)}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

interface LegendItemProps {
  status: keyof typeof MesaStatusColor;
  label: string;
}

function LegendItem({ status, label }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendColor,
          { backgroundColor: MesaStatusColor[status] },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapContainer: {
    position: 'relative',
    backgroundColor: '#f5f5f5',
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    margin: UI_CONFIG.SPACING.MD,
  },
  mesaContainer: {
    position: 'absolute',
  },
  mesa: {
    width: '100%',
    height: '100%',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mesaNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mesaCapacity: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeIndicator: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeIndicatorWarning: {
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
  },
  timeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  peopleBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  peopleBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  comandaIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
  },
  comandaIndicatorText: {
    fontSize: 12,
  },
  tooltip: {
    position: 'absolute',
    top: -60,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    minWidth: 120,
    alignItems: 'center',
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 12,
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
});
