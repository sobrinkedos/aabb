import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { RootState, AppDispatch } from '../store/store';
import { signIn, signInWithBiometrics, clearError } from '../store/slices/authSlice';
import { loginSchema, LoginFormData } from '../utils/validationSchemas';
import { UI_CONFIG } from '../utils/constants';

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    checkBiometricsAvailability();
    checkSavedCredentials();
    
    // Limpar erros ao montar o componente
    dispatch(clearError());
  }, [dispatch]);

  const checkBiometricsAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
    }
  };

  const checkSavedCredentials = async () => {
    try {
      const email = await SecureStore.getItemAsync('userEmail');
      setHasSavedCredentials(!!email);
    } catch (error) {
      console.error('Erro ao verificar credenciais salvas:', error);
    }
  };

  const onSubmit = (data: LoginFormData) => {
    dispatch(signIn(data));
  };

  const handleBiometricLogin = () => {
    if (!biometricsAvailable) {
      Alert.alert(
        'Biometria Indisponível',
        'Autenticação biométrica não está disponível neste dispositivo.'
      );
      return;
    }

    if (!hasSavedCredentials) {
      Alert.alert(
        'Credenciais Não Encontradas',
        'Faça login com email e senha primeiro para habilitar a autenticação biométrica.'
      );
      return;
    }

    dispatch(signInWithBiometrics());
  };

  const showError = (message: string) => {
    Alert.alert('Erro de Login', message);
  };

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>App Garçom</Text>
          <Text style={styles.subtitle}>Sistema de Mesas e Comandas</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Digite seu email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Digite sua senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={UI_CONFIG.COLORS.SURFACE} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          {biometricsAvailable && hasSavedCredentials && (
            <TouchableOpacity
              style={[styles.button, styles.biometricButton]}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <Text style={styles.biometricButtonText}>
                🔒 Entrar com Biometria
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Problemas para acessar? Entre em contato com o supervisor.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.XL * 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  form: {
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  inputContainer: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.TEXT_SECONDARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    fontSize: 16,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  inputError: {
    borderColor: UI_CONFIG.COLORS.ERROR,
  },
  errorText: {
    color: UI_CONFIG.COLORS.ERROR,
    fontSize: 14,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  button: {
    height: 50,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  primaryButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
  },
  biometricButton: {
    backgroundColor: UI_CONFIG.COLORS.SECONDARY,
  },
  buttonText: {
    color: UI_CONFIG.COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButtonText: {
    color: UI_CONFIG.COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});