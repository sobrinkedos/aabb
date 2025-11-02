import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { MenuItem } from '../types';
import { formatarMoeda } from '../types/transformers';

const { width } = Dimensions.get('window');

interface ProdutoDetalhesScreenProps {
  navigation: any;
  route: {
    params: {
      item: MenuItem;
      comandaId?: string;
    };
  };
}

export default function ProdutoDetalhesScreen({ navigation, route }: ProdutoDetalhesScreenProps) {
  const { item, comandaId } = route.params;

  const currentStock = item.current_stock ?? null;
  const isDirectItem = item.item_type === 'direct' && item.direct_inventory_item_id;
  const isOutOfStock = isDirectItem && currentStock === 0;
  const isLowStock = isDirectItem && currentStock > 0 && currentStock < 5;

  const handleAddToComanda = () => {
    if (comandaId) {
      navigation.navigate('AdicionarItem', { comandaId, item });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header com imagem */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={80} color={theme.colors.neutral[300]} />
          </View>
        )}
        
        {/* Overlay com gradiente */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />

        {/* Botão voltar */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </View>
        </TouchableOpacity>

        {/* Badge de status */}
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>SEM ESTOQUE</Text>
          </View>
        )}
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="warning" size={16} color={theme.colors.warning.dark} />
            <Text style={styles.lowStockText}>Restam {currentStock} un.</Text>
          </View>
        )}
        {!item.available && !isOutOfStock && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>INDISPONÍVEL</Text>
          </View>
        )}
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nome e Preço */}
        <View style={styles.headerInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.name}</Text>
            {item.category_name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category_name}</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>{formatarMoeda(item.price)}</Text>
        </View>

        {/* Descrição */}
        {item.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary.main} />
              <Text style={styles.sectionTitle}>Descrição</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}

        {/* Informações adicionais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={theme.colors.primary.main} />
            <Text style={styles.sectionTitle}>Informações</Text>
          </View>

          <View style={styles.infoGrid}>
            {/* Disponibilidade */}
            <View style={styles.infoItem}>
              <Ionicons 
                name={item.available ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={item.available ? theme.colors.success.main : theme.colors.error.main} 
              />
              <Text style={styles.infoLabel}>Disponibilidade</Text>
              <Text style={[
                styles.infoValue,
                { color: item.available ? theme.colors.success.main : theme.colors.error.main }
              ]}>
                {item.available ? 'Disponível' : 'Indisponível'}
              </Text>
            </View>

            {/* Estoque (se for item direto) */}
            {isDirectItem && (
              <View style={styles.infoItem}>
                <Ionicons name="cube" size={24} color={theme.colors.info.main} />
                <Text style={styles.infoLabel}>Estoque</Text>
                <Text style={[
                  styles.infoValue,
                  { color: isOutOfStock ? theme.colors.error.main : isLowStock ? theme.colors.warning.main : theme.colors.success.main }
                ]}>
                  {currentStock !== null ? `${currentStock} un.` : 'N/A'}
                </Text>
              </View>
            )}

            {/* Categoria */}
            {item.category_name && (
              <View style={styles.infoItem}>
                <Ionicons name="pricetag" size={24} color={theme.colors.secondary.main} />
                <Text style={styles.infoLabel}>Categoria</Text>
                <Text style={styles.infoValue}>{item.category_name}</Text>
              </View>
            )}

            {/* Preço */}
            <View style={styles.infoItem}>
              <Ionicons name="cash" size={24} color={theme.colors.success.main} />
              <Text style={styles.infoLabel}>Preço</Text>
              <Text style={styles.infoValue}>{formatarMoeda(item.price)}</Text>
            </View>
          </View>
        </View>

        {/* Espaçamento para o botão fixo */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão de adicionar (fixo no bottom) */}
      {comandaId && item.available && !isOutOfStock && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddToComanda}>
            <LinearGradient
              colors={theme.colors.primary.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.addButtonText}>Adicionar à Comanda</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: theme.spacing.md,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 40,
    right: theme.spacing.md,
    backgroundColor: theme.colors.error.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  outOfStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 40,
    right: theme.spacing.md,
    backgroundColor: theme.colors.warning.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  lowStockText: {
    color: theme.colors.warning.dark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 40,
    right: theme.spacing.md,
    backgroundColor: theme.colors.error.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  unavailableText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: -theme.spacing.xl,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.background.primary,
    paddingTop: theme.spacing.lg,
  },
  headerInfo: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary.main + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    ...theme.shadows.lg,
  },
  addButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
