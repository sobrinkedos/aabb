import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, persistor } from './src/store/store';
import { UI_CONFIG } from './src/utils/constants';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
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
  return (
    <>
      <StatusBar style="auto" />
      <AuthGuard fallback={<LoginScreen />}>
        <HomeScreen />
      </AuthGuard>
    </>
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
