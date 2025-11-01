/**
 * Tela de Adicionar Item à Comanda
 * 
 * Formulário para adicionar item com quantidade e observações
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAppDispatch } from '../store/hooks';
import { adicionarItemComanda } from '../store/slices/comandasSlice';
import { MenuItem } from '../types';
import { formatarMoeda } from '../types/transformers';
import { UI_CONFIG } from '../utils/constants';

export default function AdicionarItemScreen({ route, navigation }: any) {
  const { comandaId, item } = route.params as { comandaId: string; item: MenuItem };
  const dispatch = useAppDispatch();

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = quantity * item.price;

  const handleSubmit = async () => {
    if (!item.available) {
      Alert.alert('Erro', 'Este item não está disponível no momento');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(
        adicionarItemComanda({
          comandaId,
          menuItemId: item.id,
          quantity,
          notes: notes.trim() || undefined,
        })
      ).unwrap();

      Alert.alert('Sucesso', 'Item adicionado à comanda', [
        {
          text: 'OK',
          onPress: () => navigation?.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error || 'Erro ao adicionar item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Adicionar Item</Text>
      </View>

      {/* Item Info */}
      <View style={styles.itemCard}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        )}
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
          
          <Text style={styles.itemPrice}>{formatarMoeda(item.price)}</Text>
          
          {item.preparation_time && (
            <Text style={styles.prepTime}>⏱️ {item.preparation_time} min</Text>
          )}
        </View>
      </View>

      {/* Quantidade */}
      <View style={styles.section}>
        <Text style={styles.label}>Quantidade</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isSubmitting}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.quantityValue}>{quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
            disabled={isSubmitting}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Observações */}
      <View style={styles.section}>
        <Text style={styles.label}>Observações (Opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Ex: Sem cebola, bem passado, etc."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
      </View>

      {/* Subtotal */}
      <View style={styles.subtotalContainer}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>
        <Text style={styles.subtotalValue}>{formatarMoeda(subtotal)}</Text>
      </View>

      {/* Botão Adicionar */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting || !item.available}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {item.available ? 'Adicionar à Comanda' : 'Item Indisponível'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  content: {
    padding: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.XL * 2,
  },
  header: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  backButton: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  itemCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    overflow: 'hidden',
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    padding: UI_CONFIG.SPACING.MD,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
    marginBottom: 8,
  },
  prepTime: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
  },
  quantityButton: {
    width: 50,
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginHorizontal: UI_CONFIG.SPACING.XL * 2,
    minWidth: 60,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '40',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    fontSize: 16,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
    padding: UI_CONFIG.SPACING.LG,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  subtotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  subtotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  submitButton: {
    height: 56,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
