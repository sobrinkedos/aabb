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

// Configuração de persistência
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'mesas', 'comandas', 'cardapio', 'sincronizacao'], // Estados que serão persistidos
  blacklist: [], // Estados que NÃO serão persistidos
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
        ],
        // Ignorar paths específicos no state
        ignoredPaths: ['sincronizacao.pendingOperations'],
      },
    }),
});

// Criar persistor
export const persistor = persistStore(store);

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;