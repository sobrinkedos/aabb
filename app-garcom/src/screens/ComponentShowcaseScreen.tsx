import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { MotiView } from 'moti';

import { theme } from '../theme';
import {
  ScreenTransition,
  Card,
  Button,
  IconButton,
  Input,
  Icons,
  Badge,
  Loading,
} from '../components';

/**
 * Tela de demonstração de todos os componentes modernos
 * Use esta tela como referência para implementar os componentes
 */
export default function ComponentShowcaseScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleButtonPress = (buttonName: string) => {
    Alert.alert('Botão Pressionado', `Você pressionou: ${buttonName}`);
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <ScreenTransition type="slideUp">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Showcase de Componentes</Text>
          <Text style={styles.subtitle}>Exemplos de uso dos componentes modernos</Text>
        </View>

        {/* Seção: Botões */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Botões</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Variações de Botões</Text>
            
            <Button
              title="Botão Primário"
              onPress={() => handleButtonPress('Primário')}
              variant="primary"
              style={styles.button}
            />
            
            <Button
              title="Botão Secundário"
              onPress={() => handleButtonPress('Secundário')}
              variant="secondary"
              style={styles.button}
            />
            
            <Button
              title="Botão Outline"
              onPress={() => handleButtonPress('Outline')}
              variant="outline"
              style={styles.button}
            />
            
            <Button
              title="Botão Ghost"
              onPress={() => handleButtonPress('Ghost')}
              variant="ghost"
              style={styles.button}
            />
            
            <Button
              title="Com Ícone"
              onPress={() => handleButtonPress('Com Ícone')}
              icon={<Icons.checkmark size={20} color="white" />}
              style={styles.button}
            />
            
            <Button
              title="Loading"
              onPress={simulateLoading}
              loading={loading}
              style={styles.button}
            />
          </Card>
        </View>

        {/* Seção: Tamanhos de Botões */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.cardTitle}>Tamanhos</Text>
            
            <Button
              title="Pequeno"
              onPress={() => handleButtonPress('Pequeno')}
              size="sm"
              style={styles.button}
            />
            
            <Button
              title="Médio"
              onPress={() => handleButtonPress('Médio')}
              size="md"
              style={styles.button}
            />
            
            <Button
              title="Grande"
              onPress={() => handleButtonPress('Grande')}
              size="lg"
              style={styles.button}
            />
          </Card>
        </View>

        {/* Seção: Icon Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Botões de Ícone</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Icon Buttons</Text>
            
            <View style={styles.iconButtonRow}>
              <IconButton
                icon={<Icons.add size={24} color="white" />}
                onPress={() => handleButtonPress('Add')}
                variant="filled"
                color={theme.colors.primary.main}
              />
              
              <IconButton
                icon={<Icons.edit size={24} color={theme.colors.secondary.main} />}
                onPress={() => handleButtonPress('Edit')}
                variant="outlined"
                color={theme.colors.secondary.main}
              />
              
              <IconButton
                icon={<Icons.delete size={24} color={theme.colors.error.main} />}
                onPress={() => handleButtonPress('Delete')}
                variant="ghost"
                color={theme.colors.error.main}
              />
              
              <IconButton
                icon={<Icons.settings size={24} color="white" />}
                onPress={() => handleButtonPress('Settings')}
                variant="filled"
                color={theme.colors.success.main}
                size="lg"
              />
            </View>
          </Card>
        </View>

        {/* Seção: Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inputs</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Campos de Entrada</Text>
            
            <Input
              label="Email"
              placeholder="Digite seu email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon={<Icons.person size={20} color={theme.colors.text.tertiary} />}
            />
            
            <Input
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={
                <Icons.Icon name="lock-closed" size={20} color={theme.colors.text.tertiary} />
              }
            />
            
            <Input
              label="Com Erro"
              placeholder="Campo com erro"
              error="Este campo é obrigatório"
              leftIcon={<Icons.alert size={20} color={theme.colors.error.main} />}
            />
          </Card>
        </View>

        {/* Seção: Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Status Badges</Text>
            
            <View style={styles.badgeRow}>
              <Badge label="Sucesso" variant="success" />
              <Badge label="Aviso" variant="warning" />
              <Badge label="Erro" variant="error" />
              <Badge label="Info" variant="info" />
              <Badge label="Neutro" variant="neutral" />
            </View>
            
            <Text style={[styles.cardTitle, { marginTop: theme.spacing.lg }]}>Tamanhos</Text>
            
            <View style={styles.badgeRow}>
              <Badge label="Pequeno" variant="success" size="sm" />
              <Badge label="Médio" variant="success" size="md" />
              <Badge label="Grande" variant="success" size="lg" />
            </View>
          </Card>
        </View>

        {/* Seção: Ícones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ícones</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Ícones Disponíveis</Text>
            
            <View style={styles.iconGrid}>
              <View style={styles.iconItem}>
                <Icons.home size={32} color={theme.colors.primary.main} />
                <Text style={styles.iconLabel}>home</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.restaurant size={32} color={theme.colors.primary.main} />
                <Text style={styles.iconLabel}>restaurant</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.grid size={32} color={theme.colors.primary.main} />
                <Text style={styles.iconLabel}>grid</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.receipt size={32} color={theme.colors.primary.main} />
                <Text style={styles.iconLabel}>receipt</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.person size={32} color={theme.colors.primary.main} />
                <Text style={styles.iconLabel}>person</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.settings size={32} color={theme.colors.primary.main} />
                <Text style={styles.iconLabel}>settings</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.checkmark size={32} color={theme.colors.success.main} />
                <Text style={styles.iconLabel}>checkmark</Text>
              </View>
              
              <View style={styles.iconItem}>
                <Icons.alert size={32} color={theme.colors.error.main} />
                <Text style={styles.iconLabel}>alert</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Seção: Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>
          
          <Card variant="elevated">
            <Text style={styles.cardTitle}>Card Elevado</Text>
            <Text style={styles.cardText}>
              Este é um card com sombra elevada, ideal para destacar conteúdo importante.
            </Text>
          </Card>
          
          <Card variant="outlined" style={{ marginTop: theme.spacing.md }}>
            <Text style={styles.cardTitle}>Card com Borda</Text>
            <Text style={styles.cardText}>
              Este card tem apenas uma borda, sem sombra.
            </Text>
          </Card>
          
          <Card variant="filled" style={{ marginTop: theme.spacing.md }}>
            <Text style={styles.cardTitle}>Card Preenchido</Text>
            <Text style={styles.cardText}>
              Este card tem um fundo colorido diferente.
            </Text>
          </Card>
          
          <Card
            variant="elevated"
            onPress={() => Alert.alert('Card Clicável', 'Você clicou no card!')}
            style={{ marginTop: theme.spacing.md }}
          >
            <Text style={styles.cardTitle}>Card Clicável</Text>
            <Text style={styles.cardText}>
              Toque neste card para ver a ação!
            </Text>
          </Card>
        </View>

        {/* Seção: Loading */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loading</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Indicador de Carregamento</Text>
            <Loading message="Carregando dados..." />
          </Card>
        </View>

        {/* Seção: Animações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animações</Text>
          
          <Card>
            <Text style={styles.cardTitle}>Exemplos de Animação</Text>
            
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 1000, loop: true }}
              style={styles.animationBox}
            >
              <Text style={styles.animationText}>Fade In + Slide Up</Text>
            </MotiView>
            
            <MotiView
              from={{ scale: 0.8 }}
              animate={{ scale: 1.2 }}
              transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
              }}
              style={[styles.animationBox, { marginTop: theme.spacing.md }]}
            >
              <Text style={styles.animationText}>Scale Animation</Text>
            </MotiView>
          </Card>
        </View>

        {/* Espaçamento final */}
        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </ScreenTransition>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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
  },
  button: {
    marginBottom: theme.spacing.sm,
  },
  iconButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  animationBox: {
    backgroundColor: theme.colors.primary.light,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  animationText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
});
