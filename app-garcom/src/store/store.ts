import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';

// Importar os slices
import authSlice from './slices/authSlice';
import mesasSlice from './slices/mesasSlice';
import comandasSlice from './slices/comandasSlice';
import cardapioSlice from './slices/cardapioSlice';
import sincronizacaoSlice from './slices/sincronizacaoSlice';

// Combinar reducers SEM PERSIST
const rootReducer = combineReducers({
  auth: authSlice,
  mesas: mesasSlice,
  comandas: comandasSlice,
  cardapio: cardapioSlice,
  sincronizacao: sincronizacaoSlice,
});

// Configurar store SEM PERSIST
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Desabilitar para evitar warnings
      immutableCheck: false, // Desabilitar para melhor performance
    }),
});

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;