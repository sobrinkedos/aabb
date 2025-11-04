import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { checkAuthStatus } from '../store/slices/authSlice';
import { UI_CONFIG } from '../utils/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Verificar status de autenticação ao montar o componente
    try {
      console.log('🔐 AuthGuard: Verificando status de autenticação...');
      dispatch(checkAuthStatus());
    } catch (error) {
      console.error('❌ AuthGuard: Erro ao verificar autenticação:', error);
    }
  }, [dispatch]);

  if (isLoading) {
    console.log('⏳ AuthGuard: Carregando...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI_CONFIG.COLORS.PRIMARY} />
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 AuthGuard: Não autenticado, mostrando tela de login');
    return fallback ? <>{fallback}</> : null;
  }

  console.log('✅ AuthGuard: Autenticado, mostrando conteúdo');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
});