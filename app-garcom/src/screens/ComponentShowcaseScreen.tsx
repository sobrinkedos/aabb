import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';

import { theme } from '../theme';

/**
 * Tela de demonstração de todos os componentes modernos
 * Versão simplificada sem animações (Moti removido temporariamente)
 */
export default function ComponentShowcaseScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleButtonPress = (buttonName: string) => {
    Alert.alert('Botão Pressionado', `Você pressionou: ${buttonName}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Showcase de Componentes</Text>
        <Text style={styles.subtitle}>Componentes modernos disponíveis</Text>
      </View>

      {/* Seção: Informação */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎨 Redesign Moderno</Text>
          <Text style={styles.cardText}>
            O redesign foi implementado com sucesso! Os componentes estão prontos para uso.
          </Text>
          <Text style={styles.cardText} style={{ marginTop: 12 }}>
            Para usar os componentes com animações completas, instale:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>npm install moti react-native-reanimated</Text>
          </View>
        </View>
      </View>

      {/* Seção: Sistema de Tema */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sistema de Tema</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cores Disponíveis</Text>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.primary.main }]} />
            <Text style={styles.colorLabel}>Primary</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.secondary.main }]} />
            <Text style={styles.colorLabel}>Secondary</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.success.main }]} />
            <Text style={styles.colorLabel}>Success</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.warning.main }]} />
            <Text style={styles.colorLabel}>Warning</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.error.main }]} />
            <Text style={styles.colorLabel}>Error</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: theme.colors.info.main }]} />
            <Text style={styles.colorLabel}>Info</Text>
          </View>
        </View>
      </View>

      {/* Seção: Espaçamento */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Espaçamento</Text>
          <Text style={styles.cardText}>
            xs: {theme.spacing.xs}px • sm: {theme.spacing.sm}px • md: {theme.spacing.md}px
          </Text>
          <Text style={styles.cardText}>
            lg: {theme.spacing.lg}px • xl: {theme.spacing.xl}px • xxl: {theme.spacing.xxl}px
          </Text>
        </View>
      </View>

      {/* Seção: Border Radius */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Border Radius</Text>
          
          <View style={styles.radiusRow}>
            <View style={[styles.radiusBox, { borderRadius: theme.borderRadius.sm }]} />
            <Text style={styles.radiusLabel}>sm ({theme.borderRadius.sm}px)</Text>
          </View>
          
          <View style={styles.radiusRow}>
            <View style={[styles.radiusBox, { borderRadius: theme.borderRadius.md }]} />
            <Text style={styles.radiusLabel}>md ({theme.borderRadius.md}px)</Text>
          </View>
          
          <View style={styles.radiusRow}>
            <View style={[styles.radiusBox, { borderRadius: theme.borderRadius.lg }]} />
            <Text style={styles.radiusLabel}>lg ({theme.borderRadius.lg}px)</Text>
          </View>
          
          <View style={styles.radiusRow}>
            <View style={[styles.radiusBox, { borderRadius: theme.borderRadius.xl }]} />
            <Text style={styles.radiusLabel}>xl ({theme.borderRadius.xl}px)</Text>
          </View>
        </View>
      </View>

      {/* Seção: Documentação */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Documentação Completa</Text>
          <Text style={styles.cardText}>
            Consulte os seguintes arquivos na raiz do projeto:
          </Text>
          <Text style={styles.bulletText}>• README_REDESIGN.md - Visão geral</Text>
          <Text style={styles.bulletText}>• REDESIGN_GUIDE.md - Guia completo</Text>
          <Text style={styles.bulletText}>• QUICK_REFERENCE.md - Referência rápida</Text>
          <Text style={styles.bulletText}>• EXEMPLOS_MIGRACAO.md - Como migrar</Text>
          <Text style={styles.bulletText}>• INICIO_RAPIDO.md - Guia de 5 minutos</Text>
        </View>
      </View>

      {/* Seção: Próximos Passos */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.colors.primary.main + '15' }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary.main }]}>
            🚀 Próximos Passos
          </Text>
          <Text style={styles.cardText}>
            1. Leia a documentação em REDESIGN_GUIDE.md
          </Text>
          <Text style={styles.cardText}>
            2. Instale as bibliotecas de animação (opcional)
          </Text>
          <Text style={styles.cardText}>
            3. Comece a usar os componentes nas suas telas
          </Text>
          <Text style={styles.cardText}>
            4. Siga os exemplos em EXEMPLOS_MIGRACAO.md
          </Text>
        </View>
      </View>

      {/* Espaçamento final */}
      <View style={{ height: theme.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary.main,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  bulletText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginLeft: theme.spacing.sm,
  },
  codeBlock: {
    backgroundColor: theme.colors.neutral[900],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  codeText: {
    fontSize: 12,
    color: theme.colors.success.light,
    fontFamily: 'monospace',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  colorLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  radiusBox: {
    width: 50,
    height: 50,
    backgroundColor: theme.colors.primary.main,
    marginRight: theme.spacing.md,
  },
  radiusLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
});
