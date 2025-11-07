import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, AppDispatch } from './src/store/store';
import { RootState } from './src/store/store';
import { signOut } from './src/store/slices/authSlice';
import LoginScreen from './src/screens/LoginScreen';
import { theme } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';

function SimpleHome() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Deseja sair do app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => dispatch(signOut())
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>✅ App Garçom</Text>
        <Text style={styles.subtitle}>Bem-vindo!</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Usuário</Text>
          <Text style={styles.cardText}>Nome: {user?.name || 'Garçom'}</Text>
          <Text style={styles.cardText}>Email: {user?.email || 'N/A'}</Text>
          <Text style={styles.cardText}>ID: {user?.id?.substring(0, 8)}...</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ Informações</Text>
          <Text style={styles.cardText}>
            Esta é uma versão simplificada do app para teste.
          </Text>
          <Text style={styles.cardText}>
            O login está funcionando corretamente!
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sair do App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <SimpleHome />;
}

export default function App() {
  console.log('🚀 App Simple iniciando...');
  
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl + 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.error.main,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
