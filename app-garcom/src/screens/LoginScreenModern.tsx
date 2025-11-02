import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import { RootState, AppDispatch } from '../store/store';
import { signIn, signInWithBiometrics, clearError } from '../store/slices/authSlice';
import { loginSchema, LoginFormData } from '../utils/validationSchemas';
import { theme } from '../theme';
import { Button, Input, Icons, ScreenTransition, Card } from '../components';

export default function LoginScreenModern() {
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

  useEffect(() => {
    if (error) {
      Alert.alert('Erro de Login', error);
    }
  }, [error]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.primary.dark]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenTransition type="slideUp">
            {/* Logo e Header */}
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <Icons.restaurant size={64} color={theme.colors.text.inverse} />
              </View>
              <Text style={styles.title}>App Garçom</Text>
              <Text style={styles.subtitle}>Sistema de Mesas e Comandas</Text>
            </MotiView>

            {/* Card de Login */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
            >
              <Card style={styles.loginCard}>
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Email"
                        placeholder="Digite seu email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        error={errors.email?.message}
                        leftIcon={<Icons.person size={20} color={theme.colors.text.tertiary} />}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Senha"
                        placeholder="Digite sua senha"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        error={errors.password?.message}
                        leftIcon={
                          <Icons.Icon
                            name="lock-closed"
                            size={20}
                            color={theme.colors.text.tertiary}
                          />
                        }
                      />
                    )}
                  />

                  <Button
                    title="Entrar"
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={isLoading}
                    fullWidth
                    size="lg"
                    icon={<Icons.Icon name="log-in" size={20} color={theme.colors.text.inverse} />}
                  />

                  {biometricsAvailable && hasSavedCredentials && (
                    <MotiView
                      from={{ opacity: 0, translateY: 10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 400, delay: 400 }}
                    >
                      <Button
                        title="Entrar com Biometria"
                        onPress={handleBiometricLogin}
                        disabled={isLoading}
                        variant="outline"
                        fullWidth
                        size="lg"
                        icon={
                          <Icons.Icon
                            name="finger-print"
                            size={20}
                            color={theme.colors.primary.main}
                          />
                        }
                        style={styles.biometricButton}
                      />
                    </MotiView>
                  )}
                </View>
              </Card>
            </MotiView>

            {/* Footer */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 600 }}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                Problemas para acessar?{'\n'}Entre em contato com o supervisor.
              </Text>
            </MotiView>
          </ScreenTransition>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  loginCard: {
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.md,
  },
  biometricButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.text.inverse,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
