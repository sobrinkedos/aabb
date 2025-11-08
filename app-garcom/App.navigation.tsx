import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { store, AppDispatch } from './src/store/store';
import { RootState } from './src/store/store';
import { signOut } from './src/store/slices/authSlice';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreenSimple from './src/screens/HomeScreenSimple';
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
          return <HomeScreenSimple navigation={{ navigate: setCurrentScreen }} />;
        case 'Profile':
          return (
            <View style={styles.screenContainer}>
              <Text style={styles.screenTitle}>Perfil</Text>
              <View style={styles.card}>
                <Text style={styles.cardText}>Nome: {user?.name}</Text>
                <Text style={styles.cardText}>Email: {user?.email}</Text>
              </View>
              <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sair do App</Text>
              </TouchableOpacity>
            </View>
          );
        default:
          return <HomeScreenSimple navigation={{ navigate: setCurrentScreen }} />;
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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
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
