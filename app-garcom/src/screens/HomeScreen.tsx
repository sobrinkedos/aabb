import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { signOut } from '../store/slices/authSlice';
import { UI_CONFIG } from '../utils/constants';

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  const handleSignOut = () => {
    Alert.alert(
      'Sair do App',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => dispatch(signOut()),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>
          Olá, {user?.nome || 'Garçom'}
        </Text>
        <Text style={styles.userInfo}>
          Tipo: {user?.tipo || 'N/A'} | Email: {user?.email || 'N/A'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          Sistema de autenticação configurado com sucesso! 🎉
        </Text>
        
        <Text style={styles.features}>
          ✅ Login com email e senha{'\n'}
          ✅ Autenticação biométrica{'\n'}
          ✅ Persistência de sessão{'\n'}
          ✅ Proteção de rotas{'\n'}
          ✅ Validação de formulários
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={isLoading}
        >
          <Text style={styles.signOutButtonText}>
            Sair do App
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    paddingHorizontal: UI_CONFIG.SPACING.LG,
  },
  header: {
    paddingTop: UI_CONFIG.SPACING.XL * 2,
    paddingBottom: UI_CONFIG.SPACING.XL,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  subtitle: {
    fontSize: 18,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  userInfo: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    color: UI_CONFIG.COLORS.SUCCESS,
    textAlign: 'center',
    marginBottom: UI_CONFIG.SPACING.XL,
    fontWeight: '600',
  },
  features: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    textAlign: 'left',
    lineHeight: 24,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    padding: UI_CONFIG.SPACING.LG,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.SUCCESS,
  },
  footer: {
    paddingBottom: UI_CONFIG.SPACING.XL,
  },
  signOutButton: {
    height: 50,
    backgroundColor: UI_CONFIG.COLORS.ERROR,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: UI_CONFIG.COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
});