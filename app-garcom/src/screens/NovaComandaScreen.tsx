/**
 * Tela de Nova Comanda
 * 
 * Formulário para criar uma nova comanda
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser } from '../store/selectors';
import { selectMesasDisponiveis } from '../store/selectors';
import { criarComanda } from '../store/slices/comandasSlice';
import { fetchMesas, atualizarStatusMesa } from '../store/slices/mesasSlice';
import { abrirComandaFormSchema, AbrirComandaFormData } from '../types/validators';
import { UI_CONFIG } from '../utils/constants';

export default function NovaComandaScreen({ navigation, route }: any) {
  const { mesaId, mesaNumber } = route.params || {};
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const mesasDisponiveis = useAppSelector(selectMesasDisponiveis);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMesaId, setSelectedMesaId] = useState<string | undefined>(mesaId);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AbrirComandaFormData>({
    resolver: zodResolver(abrirComandaFormSchema),
    defaultValues: {
      people_count: 1,
    },
  });

  // Carregar mesas disponíveis
  useEffect(() => {
    dispatch(fetchMesas());
  }, [dispatch]);

  // Pré-selecionar mesa se veio dos parâmetros
  useEffect(() => {
    if (mesaId) {
      setSelectedMesaId(mesaId);
      setValue('table_id', mesaId);
    }
  }, [mesaId, setValue]);

  // Selecionar mesa
  const handleSelectMesa = (mesaId: string) => {
    setSelectedMesaId(mesaId);
    setValue('table_id', mesaId);
  };

  // Submeter formulário
  const onSubmit = async (data: AbrirComandaFormData) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setIsSubmitting(true);

    try {
      const comanda = await dispatch(
        criarComanda({
          table_id: data.table_id,
          customer_name: data.customer_name,
          employee_id: user.id,
          people_count: data.people_count,
          notes: data.notes,
        })
      ).unwrap();

      // Se tem mesa selecionada, atualizar status para ocupada
      if (data.table_id) {
        await dispatch(
          atualizarStatusMesa({
            mesaId: data.table_id,
            status: 'occupied',
          })
        ).unwrap();
      }

      // Navegar para a tela de detalhes da comanda
      navigation?.navigate('ComandaDetalhes', { comandaId: comanda.id });
    } catch (error: any) {
      Alert.alert('Erro', error || 'Erro ao criar comanda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova Comanda</Text>
      </View>

      {/* Seleção de Mesa */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Mesa {mesaNumber ? `(${mesaNumber} selecionada)` : '(Opcional)'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {mesaNumber 
            ? 'Você pode alterar a mesa ou deixar em branco para pedido no balcão'
            : 'Selecione uma mesa ou deixe em branco para pedido no balcão'}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mesasContainer}
        >
          {mesasDisponiveis.map((mesa) => (
            <TouchableOpacity
              key={mesa.id}
              style={[
                styles.mesaOption,
                selectedMesaId === mesa.id && styles.mesaOptionSelected,
              ]}
              onPress={() => handleSelectMesa(mesa.id)}
            >
              <Text
                style={[
                  styles.mesaOptionNumber,
                  selectedMesaId === mesa.id && styles.mesaOptionNumberSelected,
                ]}
              >
                {mesa.number}
              </Text>
              <Text
                style={[
                  styles.mesaOptionCapacity,
                  selectedMesaId === mesa.id && styles.mesaOptionCapacitySelected,
                ]}
              >
                👥 {mesa.capacity}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {mesasDisponiveis.length === 0 && (
          <Text style={styles.noMesasText}>Nenhuma mesa disponível no momento</Text>
        )}
      </View>

      {/* Nome do Cliente */}
      <View style={styles.section}>
        <Text style={styles.label}>Nome do Cliente (Opcional)</Text>
        <Controller
          control={control}
          name="customer_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.customer_name && styles.inputError]}
              placeholder="Digite o nome do cliente"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!isSubmitting}
            />
          )}
        />
        {errors.customer_name && (
          <Text style={styles.errorText}>{errors.customer_name.message}</Text>
        )}
      </View>

      {/* Número de Pessoas */}
      <View style={styles.section}>
        <Text style={styles.label}>Número de Pessoas *</Text>
        <Controller
          control={control}
          name="people_count"
          render={({ field: { onChange, value } }) => (
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => onChange(Math.max(1, value - 1))}
                disabled={isSubmitting}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.counterValue}>{value}</Text>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => onChange(value + 1)}
                disabled={isSubmitting}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {errors.people_count && (
          <Text style={styles.errorText}>{errors.people_count.message}</Text>
        )}
      </View>

      {/* Observações */}
      <View style={styles.section}>
        <Text style={styles.label}>Observações (Opcional)</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
              placeholder="Observações sobre a comanda"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          )}
        />
        {errors.notes && <Text style={styles.errorText}>{errors.notes.message}</Text>}
      </View>

      {/* Botão Criar */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Criar Comanda</Text>
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
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  backButton: {
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  backButtonText: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  section: {
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  mesasContainer: {
    flexDirection: 'row',
    gap: UI_CONFIG.SPACING.SM,
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  mesaOption: {
    width: 80,
    height: 80,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mesaOptionSelected: {
    borderColor: UI_CONFIG.COLORS.PRIMARY,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
  },
  mesaOptionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  mesaOptionNumberSelected: {
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  mesaOptionCapacity: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  mesaOptionCapacitySelected: {
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  noMesasText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingVertical: UI_CONFIG.SPACING.LG,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '40',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    fontSize: 16,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  textArea: {
    height: 100,
    paddingTop: UI_CONFIG.SPACING.MD,
  },
  inputError: {
    borderColor: UI_CONFIG.COLORS.ERROR,
  },
  errorText: {
    color: UI_CONFIG.COLORS.ERROR,
    fontSize: 14,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.SM,
  },
  counterButton: {
    width: 50,
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginHorizontal: UI_CONFIG.SPACING.XL,
    minWidth: 60,
    textAlign: 'center',
  },
  submitButton: {
    height: 56,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: UI_CONFIG.SPACING.LG,
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
