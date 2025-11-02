/**
 * Tela de Cardápio
 * 
 * Visualização do cardápio com busca e filtros
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCardapioFiltrado,
  selectCardapioCategorias,
  selectCategoriaSelected,
  selectSearchQuery,
  selectCardapioLoading,
} from '../store/selectors';
import {
  fetchCardapio,
  fetchCategorias,
  setSelectedCategory,
  setSearchQuery,
} from '../store/slices/cardapioSlice';
import { MenuItem } from '../types';
import { formatarMoeda } from '../types/transformers';
import { UI_CONFIG } from '../utils/constants';

export default function CardapioScreen({ navigation, route }: any) {
  const { comandaId } = route.params || {};
  const dispatch = useAppDispatch();
  
  const items = useAppSelector(selectCardapioFiltrado);
  const categorias = useAppSelector(selectCardapioCategorias);
  const categoriaSelected = useAppSelector(selectCategoriaSelected);
  const searchQuery = useAppSelector(selectSearchQuery);
  const isLoading = useAppSelector(selectCardapioLoading);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchCardapio());
    dispatch(fetchCategorias());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCardapio());
    await dispatch(fetchCategorias());
    setRefreshing(false);
  };

  const handleItemPress = (item: MenuItem) => {
    console.log('[CardapioScreen] Item clicado:', item);
    console.log('[CardapioScreen] ComandaId:', comandaId);
    
    if (!item || !item.id) {
      console.error('[CardapioScreen] Item inválido!');
      return;
    }
    
    if (comandaId) {
      console.log('[CardapioScreen] Navegando para AdicionarItem com:', { comandaId, item });
      navigation?.navigate('AdicionarItem', { comandaId, item });
    } else {
      console.warn('[CardapioScreen] Sem comandaId, não pode adicionar item');
    }
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <ItemCard item={item} onPress={() => handleItemPress(item)} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cardápio</Text>
        {comandaId && (
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.backButton}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar item..."
          value={searchQuery}
          onChangeText={(text) => dispatch(setSearchQuery(text))}
        />
      </View>

      {/* Categorias */}
      <FlatList
        horizontal
        data={categorias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              categoriaSelected === item.id && styles.categoryChipActive,
            ]}
            onPress={() =>
              dispatch(setSelectedCategory(categoriaSelected === item.id ? undefined : item.id))
            }
          >
            <Text
              style={[
                styles.categoryChipText,
                categoriaSelected === item.id && styles.categoryChipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoriesContainer}
        showsHorizontalScrollIndicator={false}
      />

      {/* Lista de Itens */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum item encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

function ItemCard({ item, onPress }: { item: any; onPress: () => void }) {
  const currentStock = item.current_stock ?? null;
  const isDirectItem = item.item_type === 'direct' && item.direct_inventory_item_id;
  const isOutOfStock = isDirectItem && currentStock === 0;
  const isLowStock = isDirectItem && currentStock > 0 && currentStock < 5;
  
  return (
    <TouchableOpacity 
      style={[styles.itemCard, isOutOfStock && styles.itemCardDisabled]} 
      onPress={isOutOfStock ? undefined : onPress} 
      activeOpacity={isOutOfStock ? 1 : 0.7}
      disabled={isOutOfStock}
    >
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      )}
      
      {isOutOfStock && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>SEM ESTOQUE</Text>
        </View>
      )}
      
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>⚠️ Restam {currentStock} un.</Text>
          </View>
        )}
        
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{formatarMoeda(item.price)}</Text>
          
          {!item.available && !isOutOfStock && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Indisponível</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
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
    padding: UI_CONFIG.SPACING.LG,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  backButton: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  searchContainer: {
    padding: UI_CONFIG.SPACING.MD,
  },
  searchInput: {
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.MD,
    gap: UI_CONFIG.SPACING.SM,
  },
  categoryChip: {
    height: 40,
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    paddingVertical: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: 20,
    marginRight: UI_CONFIG.SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '30',
  },
  categoryChipActive: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
    elevation: 2,
    shadowColor: UI_CONFIG.COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  categoryChipText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: UI_CONFIG.SPACING.SM,
  },
  itemCard: {
    flex: 1,
    margin: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  lowStockBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  lowStockText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  itemContent: {
    padding: UI_CONFIG.SPACING.SM,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  unavailableBadge: {
    backgroundColor: UI_CONFIG.COLORS.ERROR + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableText: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.ERROR,
    fontWeight: '600',
  },
  emptyState: {
    padding: UI_CONFIG.SPACING.XL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
});
