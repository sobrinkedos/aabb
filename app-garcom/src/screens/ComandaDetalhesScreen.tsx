/**
 * Tela de Detalhes da Comanda
 * 
 * Visualização e gerenciamento de uma comanda específica
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectComandaAtiva,
  selectItensComandaAtiva,
  selectTotalComandaAtiva,
  selectComandasLoading,
} from '../store/selectors';
import {
  fetchComandaComItens,
  atualizarStatusItem,
  fecharComanda,
} from '../store/slices/comandasSlice';
import { ItemComanda, ItemStatusLabel, PaymentMethodLabel, PAYMENT_METHODS } from '../types';
import { formatarMoeda, formatarDataHora } from '../types/transformers';
import { UI_CONFIG } from '../utils/constants';

export default function ComandaDetalhesScreen({ route, navigation }: any) {
  const { comandaId } = route.params;
  const dispatch = useAppDispatch();
  
  const comanda = useAppSelector(selectComandaAtiva);
  const itens = useAppSelector(selectItensComandaAtiva);
  const total = useAppSelector(selectTotalComandaAtiva);
  const isLoading = useAppSelector(selectComandasLoading);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (comandaId) {
      dispatch(fetchComandaComItens(comandaId));
    }
  }, [comandaId, dispatch]);

  // Recarregar quando a tela receber foco
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      if (comandaId) {
        dispatch(fetchComandaComItens(comandaId));
      }
    });

    return unsubscribe;
  }, [navigation, comandaId, dispatch]);

  const handleEnviarPedido = async () => {
    const itensRascunho = itens.filter(item => item.status === 'draft');
    
    if (itensRascunho.length === 0) {
      Alert.alert('Aviso', 'Não há itens no pedido para enviar');
      return;
    }

    Alert.alert(
      'Enviar Pedido',
      `Enviar ${itensRascunho.length} ${itensRascunho.length === 1 ? 'item' : 'itens'} para os monitores?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              // Atualizar status de todos os itens em rascunho para 'pending'
              // Agora sim aparecem nos monitores
              await Promise.all(
                itensRascunho.map(item =>
                  dispatch(atualizarStatusItem({ itemId: item.id, status: 'pending' })).unwrap()
                )
              );

              // Recarregar comanda
              await dispatch(fetchComandaComItens(comandaId));
              
              Alert.alert('✓ Pedido enviado', 'Os itens agora estão visíveis nos monitores');
            } catch (error: any) {
              Alert.alert('Erro', error || 'Erro ao enviar pedido');
            }
          },
        },
      ]
    );
  };

  const handleFecharComanda = (paymentMethod: string) => {
    Alert.alert(
      'Fechar Comanda',
      `Confirmar pagamento via ${PaymentMethodLabel[paymentMethod as keyof typeof PaymentMethodLabel]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await dispatch(fecharComanda({ comandaId, paymentMethod })).unwrap();
              Alert.alert('Sucesso', 'Comanda enviada ao caixa para pagamento', [
                { text: 'OK', onPress: () => navigation?.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Erro', error || 'Erro ao fechar comanda');
            }
          },
        },
      ]
    );
  };



  if (isLoading && !comanda) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI_CONFIG.COLORS.PRIMARY} />
      </View>
    );
  }

  if (!comanda) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Comanda não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {comanda.table_number ? `Mesa ${comanda.table_number}` : 'Balcão'}
        </Text>
        <Text style={styles.subtitle}>{comanda.customer_name || 'Cliente'}</Text>
      </View>

      {/* Itens */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {itens.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum item na comanda</Text>
          </View>
        ) : (
          <>
            {/* Seção de Itens em Rascunho */}
            {itens.some(item => item.status === 'draft') && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderContent}>
                    <Text style={styles.sectionTitle}>📝 Itens em Rascunho</Text>
                    <Text style={styles.sectionSubtitle}>
                      {itens.filter(i => i.status === 'draft').length} {itens.filter(i => i.status === 'draft').length === 1 ? 'item' : 'itens'} • Não enviado
                    </Text>
                  </View>
                </View>
                
                {itens
                  .filter(item => item.status === 'draft')
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onUpdateStatus={(status) => 
                        dispatch(atualizarStatusItem({ itemId: item.id, status }))
                      }
                    />
                  ))}
              </>
            )}
            
            {/* Seção de Itens Enviados */}
            {itens.some(item => item.status !== 'draft') && (
              <>
                <View style={[styles.sectionHeader, styles.sectionHeaderEnviados]}>
                  <View style={styles.sectionHeaderContent}>
                    <Text style={styles.sectionTitle}>✓ Itens Enviados</Text>
                    <Text style={styles.sectionSubtitle}>
                      {itens.filter(i => i.status !== 'draft').length} {itens.filter(i => i.status !== 'draft').length === 1 ? 'item' : 'itens'} • Em preparo/entregue
                    </Text>
                  </View>
                </View>
                
                {itens
                  .filter(item => item.status !== 'draft')
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onUpdateStatus={(status) => 
                        dispatch(atualizarStatusItem({ itemId: item.id, status }))
                      }
                    />
                  ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer com Total */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatarMoeda(total)}</Text>
        </View>
        
        <View style={styles.actions}>
          {/* Primeira linha: Adicionar Item e Enviar Pedido */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation?.navigate('Cardapio', { comandaId })}
            >
              <Text style={styles.addButtonText}>+ Adicionar Item</Text>
            </TouchableOpacity>
            
            {/* Mostrar botão Enviar Pedido se houver itens em rascunho */}
            {itens.some(item => item.status === 'draft') && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleEnviarPedido}
              >
                <Text style={styles.sendButtonText}>📤 Enviar Pedido</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Segunda linha: Fechar Comanda (largura total) */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Text style={styles.closeButtonText}>Fechar Comanda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Modal */}
      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Forma de Pagamento</Text>
            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={styles.paymentOption}
                onPress={() => {
                  setShowPaymentModal(false);
                  handleFecharComanda(value);
                }}
              >
                <Text style={styles.paymentOptionText}>
                  {PaymentMethodLabel[value as keyof typeof PaymentMethodLabel]}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function ItemCard({ item, onUpdateStatus }: { item: ItemComanda & { menu_item_name?: string }; onUpdateStatus: (status: ItemComanda['status']) => void }) {
  const subtotal = item.quantity * item.price;
  const statusColor = item.status === 'draft' ? '#9E9E9E' :
                      item.status === 'delivered' ? '#4CAF50' : 
                      item.status === 'cancelled' ? '#F44336' : '#FF9800';

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>
          {item.menu_item_name || `Item #${item.menu_item_id.slice(0, 8)}`}
        </Text>
        <Text style={[styles.itemStatus, { color: statusColor }]}>
          {ItemStatusLabel[item.status]}
        </Text>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
        <Text style={styles.itemPrice}>{formatarMoeda(item.price)}</Text>
        <Text style={styles.itemSubtotal}>{formatarMoeda(subtotal)}</Text>
      </View>
      
      {item.notes && <Text style={styles.itemNotes}>Obs: {item.notes}</Text>}
      
      <Text style={styles.itemTime}>{formatarDataHora(item.added_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.ERROR,
  },
  header: {
    padding: UI_CONFIG.SPACING.LG,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  backButton: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  listContainer: {
    padding: UI_CONFIG.SPACING.MD,
  },
  sectionHeader: {
    backgroundColor: '#FFF3E0',
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E',
  },
  sectionHeaderEnviados: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
    marginTop: UI_CONFIG.SPACING.LG,
  },
  sectionHeaderContent: {
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  itemCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  itemQuantity: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  itemPrice: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  itemNotes: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  itemTime: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    padding: UI_CONFIG.SPACING.XL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  footer: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
    padding: UI_CONFIG.SPACING.LG,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  actions: {
    gap: UI_CONFIG.SPACING.SM,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: UI_CONFIG.SPACING.SM,
  },
  addButton: {
    flex: 1,
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.SECONDARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sendButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#FF9800',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: '100%',
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    padding: UI_CONFIG.SPACING.LG,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.LG,
    textAlign: 'center',
  },
  paymentOption: {
    padding: UI_CONFIG.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
  },
  paymentOptionText: {
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
