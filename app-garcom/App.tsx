import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { store, AppDispatch } from './src/store/store';
import { RootState } from './src/store/store';
import { signOut } from './src/store/slices/authSlice';
import LoginScreen from './src/screens/LoginScreen';
import { theme } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';

function AppWithNavigation() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentScreen, setCurrentScreen] = useState('Home');

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const renderScreen = () => {
    try {
      switch (currentScreen) {
        case 'Home':
          return (
            <ScrollView style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>🏠 Início</Text>
                <Text style={styles.headerSubtitle}>Bem-vindo, {user?.name || 'Garçom'}!</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>📱 Menu</Text>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => setCurrentScreen('Profile')}
                >
                  <Ionicons name="person-outline" size={24} color={theme.colors.primary.main} />
                  <Text style={styles.menuButtonText}>Ver Perfil</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>ℹ️ Status</Text>
                <Text style={styles.cardText}>✅ App funcionando</Text>
                <Text style={styles.cardText}>✅ Login OK</Text>
                <Text style={styles.cardText}>✅ Navegação OK</Text>
              </View>
            </ScrollView>
          );
        case 'Profile':
          return (
            <View style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>👤 Perfil</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Informações</Text>
                <Text style={styles.cardText}>Nome: {user?.name}</Text>
                <Text style={styles.cardText}>Email: {user?.email}</Text>
                <Text style={styles.cardText}>ID: {user?.id?.substring(0, 8)}...</Text>
              </View>
              <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sair do App</Text>
              </TouchableOpacity>
            </View>
          );
        default:
          return (
            <View style={styles.screenContainer}>
              <Text style={styles.screenTitle}>Tela não encontrada</Text>
            </View>
          );
      }
    } catch (error) {
      console.error('❌ Erro ao renderizar tela:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar tela</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setCurrentScreen('Home')}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Conteúdo */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation - SIMPLES */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('Home')}
        >
          <Ionicons 
            name={currentScreen === 'Home' ? 'home' : 'home-outline'} 
            size={24} 
            color={currentScreen === 'Home' ? theme.colors.primary.main : theme.colors.text.secondary}
          />
          <Text style={[
            styles.navLabel,
            currentScreen === 'Home' && styles.navLabelActive
          ]}>
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('Profile')}
        >
          <Ionicons 
            name={currentScreen === 'Profile' ? 'person' : 'person-outline'} 
            size={24} 
            color={currentScreen === 'Profile' ? theme.colors.primary.main : theme.colors.text.secondary}
          />
          <Text style={[
            styles.navLabel,
            currentScreen === 'Profile' && styles.navLabelActive
          ]}>
            Perfil
          </Text>
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

  return <AppWithNavigation />;
}

export default function App() {
  console.log('🚀 App com navegação iniciando...');
  
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
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 40,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  menuButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingBottom: 8,
    paddingTop: 12,
    ...theme.shadows.lg,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  navLabelActive: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  dangerButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error.main,
    marginBottom: theme.spacing.lg,
  },
});
