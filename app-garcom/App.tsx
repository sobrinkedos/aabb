import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, persistor } from './src/store/store';
import { UI_CONFIG } from './src/utils/constants';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MesasScreen from './src/screens/MesasScreen';
import ComandasScreen from './src/screens/ComandasScreen';
import NovaComandaScreen from './src/screens/NovaComandaScreen';
import ComandaDetalhesScreen from './src/screens/ComandaDetalhesScreen';
import CardapioScreen from './src/screens/CardapioScreen';
import AdicionarItemScreen from './src/screens/AdicionarItemScreen';
import AuthGuard from './src/components/AuthGuard';

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

  const navigation = {
    navigate: (screen: string, params?: any) => {
      setCurrentScreen(screen);
      setScreenParams(params || {});
    },
    goBack: () => {
      setCurrentScreen('Home');
      setScreenParams({});
    },
  };

  const renderScreen = () => {
    const props = { navigation, route: { params: screenParams } };
    
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
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
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
              <Text style={[styles.tabIcon, currentScreen === 'Home' && styles.tabIconActive]}>
                🏠
              </Text>
              <Text style={[styles.tabLabel, currentScreen === 'Home' && styles.tabLabelActive]}>
                Início
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Mesas' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Mesas')}
            >
              <Text style={[styles.tabIcon, currentScreen === 'Mesas' && styles.tabIconActive]}>
                🗺️
              </Text>
              <Text style={[styles.tabLabel, currentScreen === 'Mesas' && styles.tabLabelActive]}>
                Mesas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Comandas' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Comandas')}
            >
              <Text style={[styles.tabIcon, currentScreen === 'Comandas' && styles.tabIconActive]}>
                📋
              </Text>
              <Text style={[styles.tabLabel, currentScreen === 'Comandas' && styles.tabLabelActive]}>
                Comandas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, currentScreen === 'Cardapio' && styles.tabButtonActive]}
              onPress={() => navigation.navigate('Cardapio')}
            >
              <Text style={[styles.tabIcon, currentScreen === 'Cardapio' && styles.tabIconActive]}>
                🍽️
              </Text>
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
      <ActivityIndicator size="large" color={UI_CONFIG.COLORS.PRIMARY} />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.TEXT_SECONDARY + '20',
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: UI_CONFIG.SPACING.MD,
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
});
