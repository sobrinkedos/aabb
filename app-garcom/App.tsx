import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { store, persistor } from './src/store/store';
import { theme } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreenSimple';
import MesasScreen from './src/screens/MesasScreen';
import ComandasScreen from './src/screens/ComandasScreen';
import NovaComandaScreen from './src/screens/NovaComandaScreen';
import ComandaDetalhesScreen from './src/screens/ComandaDetalhesScreen';
import CardapioScreen from './src/screens/CardapioScreen';
import AdicionarItemScreen from './src/screens/AdicionarItemScreen';
import ComponentShowcaseScreen from './src/screens/ComponentShowcaseScreen';
import ProdutoDetalhesScreen from './src/screens/ProdutoDetalhesScreen';
import AuthGuard from './src/components/AuthGuard';
import { ScreenTransition } from './src/components';

// Criar instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenParams, setScreenParams] = useState<any>({});
  const [previousScreen, setPreviousScreen] = useState('Home');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['Home']);

  const navigation = {
    navigate: (screen: string, params?: any) => {
      setPreviousScreen(currentScreen);
      setCurrentScreen(screen);
      setScreenParams(params || {});
      setNavigationHistory(prev => [...prev, screen]);
    },
    goBack: () => {
      const history = [...navigationHistory];
      history.pop(); // Remove tela atual
      const previousScreen = history[history.length - 1] || 'Home';
      setPreviousScreen(currentScreen);
      setCurrentScreen(previousScreen);
      setScreenParams({});
      setNavigationHistory(history);
    },
  };

  const renderScreen = () => {
    const props = { navigation, route: { params: screenParams } };
    
    // Determinar direção da animação
    const isGoingBack = navigationHistory.length > 0 && 
      navigationHistory[navigationHistory.length - 1] !== currentScreen;
    const direction = isGoingBack ? 'left' : 'right';
    
    const screenContent = (() => {
      switch (currentScreen) {
        case 'Mesas':
          return <MesasScreen {...props} />;
        case 'Comandas':
          return <ComandasScreen {...props} />;
        case 'Cardapio':
          return <CardapioScreen {...props} />;
        case 'NovaComanda':
          return <NovaComandaScreen {...props} />;
        case 'ComandaDetalhes':
          return <ComandaDetalhesScreen {...props} />;
        case 'AdicionarItem':
          return <AdicionarItemScreen {...props} />;
        case 'ComponentShowcase':
          return <ComponentShowcaseScreen {...props} />;
        case 'ProdutoDetalhes':
          return <ProdutoDetalhesScreen {...props} />;
        default:
          return <HomeScreen navigation={navigation} />;
      }
    })();

    return (
      <ScreenTransition 
        key={currentScreen + screenParams?.comandaId + screenParams?.itemId} 
        screenKey={currentScreen}
        direction={direction}
      >
        {screenContent}
      </ScreenTransition>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={theme.colors.primary.main} />
      <AuthGuard fallback={<LoginScreen />}>
        <View style={styles.container}>
          {/* Conteúdo da tela */}
          <View style={styles.content}>
            {renderScreen()}
          </View>

          {/* Bottom Tab Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Home' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons 
                name={currentScreen === 'Home' ? 'home' : 'home-outline'} 
                size={24} 
                color={currentScreen === 'Home' ? theme.colors.primary.main : theme.colors.text.secondary}
              />
              <Text style={[styles.tabLabel, currentScreen === 'Home' && styles.tabLabelActive]}>
                Início
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Mesas' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Mesas')}
            >
              <Ionicons 
                name={currentScreen === 'Mesas' ? 'grid' : 'grid-outline'} 
                size={24} 
                color={currentScreen === 'Mesas' ? theme.colors.primary.main : theme.colors.text.secondary}
              />
              <Text style={[styles.tabLabel, currentScreen === 'Mesas' && styles.tabLabelActive]}>
                Mesas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Comandas' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Comandas')}
            >
              <Ionicons 
                name={currentScreen === 'Comandas' ? 'receipt' : 'receipt-outline'} 
                size={24} 
                color={currentScreen === 'Comandas' ? theme.colors.primary.main : theme.colors.text.secondary}
              />
              <Text style={[styles.tabLabel, currentScreen === 'Comandas' && styles.tabLabelActive]}>
                Comandas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Cardapio' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Cardapio')}
            >
              <Ionicons 
                name={currentScreen === 'Cardapio' ? 'restaurant' : 'restaurant-outline'} 
                size={24} 
                color={currentScreen === 'Cardapio' ? theme.colors.primary.main : theme.colors.text.secondary}
              />
              <Text style={[styles.tabLabel, currentScreen === 'Cardapio' && styles.tabLabelActive]}>
                Cardápio
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthGuard>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary.main} />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingBottom: 8,
    paddingTop: 12,
    ...theme.shadows.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary.main + '10',
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
