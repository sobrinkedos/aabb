import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Importar os slices
import authSlice from './slices/authSlice';
import mesasSlice from './slices/mesasSlice';
import comandasSlice from './slices/comandasSlice';
import cardapioSlice from './slices/cardapioSlice';
import sincronizacaoSlice from './slices/sincronizacaoSlice';

// Configuração de persistência - APENAS AUTH
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Persistir APENAS auth para evitar problemas
  blacklist: ['mesas', 'comandas', 'cardapio', 'sincronizacao'],
  timeout: 10000, // Timeout de 10 segundos
};

// Combinar reducers
const rootReducer = combineReducers({
  auth: authSlice,
  mesas: mesasSlice,
  comandas: comandasSlice,
  cardapio: cardapioSlice,
  sincronizacao: sincronizacaoSlice,
});

// Aplicar persistência
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configurar store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar actions do redux-persist
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
        // Ignorar paths específicos no state
        ignoredPaths: ['sincronizacao.pendingOperations', 'register'],
      },
      immutableCheck: false, // Desabilitar para melhor performance
    }),
});

// Criar persistor com callback de erro
export const persistor = persistStore(store, null, () => {
  console.log('✅ Redux Persist: Rehydration completa');
});

// Função para limpar storage em caso de erro
export const clearPersistedState = async () => {
  try {
    console.log('🗑️ Limpando storage persistido...');
    await AsyncStorage.removeItem('persist:root');
    await persistor.purge();
    console.log('✅ Storage limpo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar storage:', error);
  }
};

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;