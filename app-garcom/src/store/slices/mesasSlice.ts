import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MesasState, MesaComDetalhes, Mesa } from '../../types';
import { supabase } from '../../services/SupabaseService';
import { transformMesaComDetalhesFromDB, transformMesaToDB } from '../../types/transformers';

// Estado inicial
const initialState: MesasState = {
  mesas: [],
  mesaSelecionada: undefined,
  filtroStatus: undefined,
  isLoading: false,
  error: null,
  lastSync: undefined,
};

// Thunks assíncronos
export const fetchMesas = createAsyncThunk(
  'mesas/fetchMesas',
  async (_, { rejectWithValue }) => {
    try {
      // Obter empresa_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar empresa_id do usuário
      const { data: usuarioEmpresa, error: userError } = await supabase
        .from('usuarios_empresa')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (userError) {
        throw new Error(`Erro ao buscar empresa do usuário: ${userError.message}`);
      }

      if (!usuarioEmpresa) {
        throw new Error('Usuário não vinculado a nenhuma empresa');
      }

      // Buscar mesas da empresa
      const { data, error } = await supabase
        .from('bar_tables')
        .select('*')
        .eq('empresa_id', usuarioEmpresa.empresa_id)
        .order('number', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar mesas: ${error.message}`);
      }

      // Transformar dados para o formato esperado
      return (data || []).map(transformMesaComDetalhesFromDB);
    } catch (error: any) {
      console.error('[fetchMesas] Erro:', error);
      return rejectWithValue(error.message || 'Erro ao buscar mesas');
    }
  }
);

export const atualizarStatusMesa = createAsyncThunk(
  'mesas/atualizarStatus',
  async (
    { mesaId, status, notes }: { mesaId: string; status: Mesa['status']; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('bar_tables')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mesaId)
        .select()
        .single();

      if (error) throw error;

      return transformMesaComDetalhesFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar status da mesa');
    }
  }
);

export const criarMesa = createAsyncThunk(
  'mesas/criar',
  async (mesa: Partial<Mesa>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('bar_tables')
        .insert(transformMesaToDB(mesa))
        .select()
        .single();

      if (error) throw error;

      return transformMesaComDetalhesFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao criar mesa');
    }
  }
);

// Slice
const mesasSlice = createSlice({
  name: 'mesas',
  initialState,
  reducers: {
    selecionarMesa: (state, action: PayloadAction<MesaComDetalhes | undefined>) => {
      state.mesaSelecionada = action.payload;
    },
    setFiltroStatus: (state, action: PayloadAction<Mesa['status'] | undefined>) => {
      state.filtroStatus = action.payload;
    },
    limparErro: (state) => {
      state.error = null;
    },
    atualizarMesaLocal: (state, action: PayloadAction<MesaComDetalhes>) => {
      const index = state.mesas.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.mesas[index] = action.payload;
      }
    },
    resetMesas: (state) => {
      state.mesas = [];
      state.mesaSelecionada = undefined;
      state.filtroStatus = undefined;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch mesas
    builder
      .addCase(fetchMesas.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMesas.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mesas = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchMesas.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Atualizar status
    builder
      .addCase(atualizarStatusMesa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(atualizarStatusMesa.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.mesas.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.mesas[index] = action.payload;
        }
        if (state.mesaSelecionada?.id === action.payload.id) {
          state.mesaSelecionada = action.payload;
        }
      })
      .addCase(atualizarStatusMesa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Criar mesa
    builder
      .addCase(criarMesa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(criarMesa.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mesas.push(action.payload);
      })
      .addCase(criarMesa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selecionarMesa, setFiltroStatus, limparErro, atualizarMesaLocal, resetMesas } =
  mesasSlice.actions;

export default mesasSlice.reducer;
