import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store/store';
import { theme } from '../theme';
import { BackButton } from '../components/BackButton';
import {
  calcularFechamentoDia,
  gerarResumoAtendimentos,
  formatarHora,
  formatarMoeda,
  FechamentoDia,
  ResumoAtendimento,
} from '../services/fechamentoService';
import { ComandaStatusLabel, PaymentMethodLabel } from '../types/Comanda';

export default function FechamentoDiaScreen({ navigation }: any) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [fechamento, setFechamento] = useState<FechamentoDia | null>(null);
  const [resumos, setResumos] = useState<ResumoAtendimento[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    carregarFechamento();
  }, [dataSelecionada]);

  const carregarFechamento = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const dados = await calcularFechamentoDia(user.id, dataSelecionada);
      setFechamento(dados);
      setResumos(gerarResumoAtendimentos(dados.comandas));
    } catch (error) {
      console.error('Erro ao carregar fechamento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do fechamento');
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = () => {
    if (!fechamento) return;

    const texto = `
FECHAMENTO DO DIA
================

Garçom: ${fechamento.garcom_nome}
Data: ${new Date(fechamento.data).toLocaleDateString('pt-BR')}

RESUMO
------
Total de Comandas: ${fechamento.total_comandas}
Total de Vendas: ${formatarMoeda(fechamento.total_vendas)}
Total 10% Serviço: ${formatarMoeda(fechamento.total_servico)}
${fechamento.taxa_comissao > 0 ? `Comissão (${fechamento.taxa_comissao}%): ${formatarMoeda(fechamento.total_comissao)}` : ''}

ATENDIMENTOS
------------
${resumos
  .filter(r => r.status === 'closed')
  .map(
    (r, i) => `
${i + 1}. ${r.mesa} - ${r.cliente}
   Abertura: ${formatarHora(r.horario_abertura)}
   Fechamento: ${r.horario_fechamento ? formatarHora(r.horario_fechamento) : '-'}
   Total: ${formatarMoeda(r.total)}
   Serviço: ${formatarMoeda(r.servico)}
   Pagamento: ${r.forma_pagamento ? PaymentMethodLabel[r.forma_pagamento as keyof typeof PaymentMethodLabel] : '-'}
`
  )
  .join('\n')}
    `.trim();

    Alert.alert('Relatório', texto, [
      { text: 'Fechar', style: 'cancel' },
      {
        text: 'Compartilhar',
        onPress: () => {
          // TODO: Implementar compartilhamento
          Alert.alert('Em breve', 'Funcionalidade de compartilhamento em desenvolvimento');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Carregando fechamento...</Text>
      </View>
    );
  }

  if (!fechamento) {
    return (
      <View style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.neutral[400]} />
          <Text style={styles.emptyText}>Nenhum dado encontrado</Text>
        </View>
      </View>
    );
  }

  const comandasFechadas = resumos.filter(r => r.status === 'closed');
  const comandasAbertas = resumos.filter(r => r.status === 'open');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />
          <View>
            <Text style={styles.headerTitle}>Fechamento do Dia</Text>
            <Text style={styles.headerSubtitle}>
              {new Date(fechamento.data).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Cards de Resumo */}
        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.cardPrimary]}>
            <Ionicons name="receipt-outline" size={24} color="white" />
            <Text style={styles.cardValue}>{fechamento.total_comandas}</Text>
            <Text style={styles.cardLabel}>Comandas Fechadas</Text>
          </View>

          <View style={[styles.card, styles.cardSuccess]}>
            <Ionicons name="cash-outline" size={24} color="white" />
            <Text style={styles.cardValue}>{formatarMoeda(fechamento.total_vendas)}</Text>
            <Text style={styles.cardLabel}>Total Vendas</Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.cardInfo]}>
            <Ionicons name="wallet-outline" size={24} color="white" />
            <Text style={styles.cardValue}>{formatarMoeda(fechamento.total_servico)}</Text>
            <Text style={styles.cardLabel}>10% Serviço</Text>
          </View>

          {fechamento.taxa_comissao > 0 && (
            <View style={[styles.card, styles.cardWarning]}>
              <Ionicons name="trending-up-outline" size={24} color="white" />
              <Text style={styles.cardValue}>{formatarMoeda(fechamento.total_comissao)}</Text>
              <Text style={styles.cardLabel}>Comissão ({fechamento.taxa_comissao}%)</Text>
            </View>
          )}
        </View>

        {/* Comandas Abertas */}
        {comandasAbertas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comandas Abertas ({comandasAbertas.length})
            </Text>
            {comandasAbertas.map((resumo) => (
              <View key={resumo.comanda_id} style={[styles.comandaCard, styles.comandaAberta]}>
                <View style={styles.comandaHeader}>
                  <Text style={styles.comandaMesa}>{resumo.mesa}</Text>
                  <Text style={styles.comandaStatus}>
                    {ComandaStatusLabel[resumo.status as keyof typeof ComandaStatusLabel]}
                  </Text>
                </View>
                <Text style={styles.comandaCliente}>{resumo.cliente}</Text>
                <Text style={styles.comandaHora}>
                  Aberta às {formatarHora(resumo.horario_abertura)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Comandas Fechadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Atendimentos Realizados ({comandasFechadas.length})
          </Text>
          {comandasFechadas.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Nenhuma comanda fechada hoje</Text>
            </View>
          ) : (
            comandasFechadas.map((resumo) => (
              <View key={resumo.comanda_id} style={styles.comandaCard}>
                <View style={styles.comandaHeader}>
                  <Text style={styles.comandaMesa}>{resumo.mesa}</Text>
                  <Text style={styles.comandaTotal}>{formatarMoeda(resumo.total)}</Text>
                </View>
                <Text style={styles.comandaCliente}>{resumo.cliente}</Text>
                <View style={styles.comandaFooter}>
                  <Text style={styles.comandaHora}>
                    {formatarHora(resumo.horario_abertura)} -{' '}
                    {resumo.horario_fechamento ? formatarHora(resumo.horario_fechamento) : '-'}
                  </Text>
                  {resumo.servico > 0 && (
                    <Text style={styles.comandaServico}>
                      +{formatarMoeda(resumo.servico)} (10%)
                    </Text>
                  )}
                </View>
                {resumo.forma_pagamento && (
                  <Text style={styles.comandaPagamento}>
                    {PaymentMethodLabel[resumo.forma_pagamento as keyof typeof PaymentMethodLabel]}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Botão Gerar Relatório */}
        {comandasFechadas.length > 0 && (
          <TouchableOpacity style={styles.relatorioButton} onPress={gerarRelatorio}>
            <LinearGradient
              colors={theme.colors.primary.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.relatorioGradient}
            >
              <Ionicons name="document-text-outline" size={24} color="white" />
              <Text style={styles.relatorioButtonText}>Gerar Relatório</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  header: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    marginRight: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  card: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  cardPrimary: {
    backgroundColor: theme.colors.primary.main,
  },
  cardSuccess: {
    backgroundColor: theme.colors.success.main,
  },
  cardInfo: {
    backgroundColor: theme.colors.info.main,
  },
  cardWarning: {
    backgroundColor: theme.colors.warning.main,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptySection: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  comandaCard: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success.main,
    ...theme.shadows.sm,
  },
  comandaAberta: {
    borderLeftColor: theme.colors.warning.main,
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  comandaMesa: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  comandaTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success.main,
  },
  comandaStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.warning.main,
    backgroundColor: theme.colors.warning.light + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  comandaCliente: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  comandaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  comandaHora: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  comandaServico: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.info.main,
  },
  comandaPagamento: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  relatorioButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  relatorioGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  relatorioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});
