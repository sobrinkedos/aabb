import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '../../types/Usuario';
import { SupabaseService } from '../../services/SupabaseService';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// Async thunks para operações de autenticação
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error: signInError } = await SupabaseService.signIn(email, password);
      
      if (signInError) {
        return rejectWithValue(signInError.message);
      }

      if (data.user) {
        // Buscar dados completos do usuário
        const userData = await SupabaseService.getUserProfile(data.user.id);
        
        // Salvar credenciais para autenticação biométrica
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userPassword', password);
        
        return userData;
      }
      
      return rejectWithValue('Usuário não encontrado');
    } catch {
      return rejectWithValue('Erro ao fazer login');
    }
  }
);

export const signInWithBiometrics = createAsyncThunk(
  'auth/signInWithBiometrics',
  async (_, { rejectWithValue }) => {
    try {
      // Verificar se biometria está disponível
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return rejectWithValue('Autenticação biométrica não disponível');
      }

      // Solicitar autenticação biométrica
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o app',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
      });

      if (!result.success) {
        return rejectWithValue('Autenticação biométrica falhou');
      }

      // Recuperar credenciais salvas
      const email = await SecureStore.getItemAsync('userEmail');
      const password = await SecureStore.getItemAsync('userPassword');

      if (!email || !password) {
        return rejectWithValue('Credenciais não encontradas');
      }

      // Fazer login com credenciais salvas
      const { data, error: signInError } = await SupabaseService.signIn(email, password);
      
      if (signInError) {
        return rejectWithValue(signInError.message);
      }

      if (data.user) {
        const userData = await SupabaseService.getUserProfile(data.user.id);
        return userData;
      }
      
      return rejectWithValue('Usuário não encontrado');
    } catch {
      return rejectWithValue('Erro na autenticação biométrica');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error: signOutError } = await SupabaseService.signOut();
      
      if (signOutError) {
        return rejectWithValue(signOutError.message);
      }

      // Limpar credenciais salvas
      await SecureStore.deleteItemAsync('userEmail');
      await SecureStore.deleteItemAsync('userPassword');
      
      return null;
    } catch {
      return rejectWithValue('Erro ao fazer logout');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const user = await SupabaseService.getCurrentUser();
      
      if (user) {
        const userData = await SupabaseService.getUserProfile(user.id);
        return userData;
      }
      
      return null;
    } catch {
      return rejectWithValue('Erro ao verificar status de autenticação');
    }
  }
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Sign In with Biometrics
      .addCase(signInWithBiometrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithBiometrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signInWithBiometrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;