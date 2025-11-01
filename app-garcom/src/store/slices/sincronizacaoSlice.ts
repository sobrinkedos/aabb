import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SincronizacaoState, OperacaoPendente, SyncError } from '../../types';
import NetInfo from '@react-native-community/netinfo';

// Estado inicial
const initialState: SincronizacaoState = {
  isOnline: true,
  isSyncing: false,
  pendingOperations: [],
  lastSyncTime: undefined,
  syncErrors: [],
};

// Thunks assíncronos
export const checkConnectivity = createAsyncThunk(
  'sincronizacao/checkConnectivity',
  async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }
);

export const processarFilaOffline = createAsyncThunk(
  'sincronizacao/processarFila',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { pendingOperations } = state.sincronizacao;

      if (pendingOperations.length === 0) {
        return { processadas: 0, erros: [] };
      }

      const resultados = {
        processadas: 0,
        erros: [] as SyncError[],
      };

      // Processar cada operação pendente
      for (const operacao of pendingOperations) {
        try {
          // Aqui você implementaria a lógica específica para cada tipo de operação
          // Por enquanto, vamos simular o processamento
          await processarOperacao(operacao);
          resultados.processadas++;
        } catch (error: any) {
          resultados.erros.push({
            id: crypto.randomUUID(),
            operacao,
            erro: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return resultados;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao processar fila offline');
    }
  }
);

// Função auxiliar para processar operação (será implementada com os serviços)
async function processarOperacao(operacao: OperacaoPendente): Promise<void> {
  // Esta função será implementada quando criarmos os serviços
  // Por enquanto, apenas simula o processamento
  return new Promise((resolve) => setTimeout(resolve, 100));
}

// Slice
const sincronizacaoSlice = createSlice({
  name: 'sincronizacao',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    adicionarOperacaoPendente: (state, action: PayloadAction<OperacaoPendente>) => {
      state.pendingOperations.push(action.payload);
    },
    removerOperacaoPendente: (state, action: PayloadAction<string>) => {
      state.pendingOperations = state.pendingOperations.filter((op) => op.id !== action.payload);
    },
    incrementarTentativas: (state, action: PayloadAction<string>) => {
      const operacao = state.pendingOperations.find((op) => op.id === action.payload);
      if (operacao) {
        operacao.tentativas++;
      }
    },
    limparErros: (state) => {
      state.syncErrors = [];
    },
    limparOperacoesPendentes: (state) => {
      state.pendingOperations = [];
    },
    atualizarUltimaSync: (state) => {
      state.lastSyncTime = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Check connectivity
    builder
      .addCase(checkConnectivity.fulfilled, (state, action) => {
        state.isOnline = action.payload;
      })
      .addCase(checkConnectivity.rejected, (state) => {
        state.isOnline = false;
      });

    // Processar fila offline
    builder
      .addCase(processarFilaOffline.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(processarFilaOffline.fulfilled, (state, action) => {
        state.isSyncing = false;
        
        // Remover operações processadas com sucesso
        if (action.payload.processadas > 0) {
          state.pendingOperations = state.pendingOperations.slice(action.payload.processadas);
        }
        
        // Adicionar erros
        if (action.payload.erros.length > 0) {
          state.syncErrors.push(...action.payload.erros);
        }
        
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(processarFilaOffline.rejected, (state) => {
        state.isSyncing = false;
      });
  },
});

export const {
  setOnlineStatus,
  adicionarOperacaoPendente,
  removerOperacaoPendente,
  incrementarTentativas,
  limparErros,
  limparOperacoesPendentes,
  atualizarUltimaSync,
} = sincronizacaoSlice.actions;

export default sincronizacaoSlice.reducer;
