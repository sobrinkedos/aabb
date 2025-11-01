import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ComandasState, Comanda, ComandaComDetalhes, ItemComanda } from '../../types';
import { supabase } from '../../services/SupabaseService';
import {
  transformComandaFromDB,
  transformComandaComDetalhesFromDB,
  transformComandaToDB,
  transformItemComandaFromDB,
  transformItemComandaToDB,
} from '../../types/transformers';

// Estado inicial
const initialState: ComandasState = {
  comandasAbertas: [],
  comandaAtiva: undefined,
  historico: [],
  isLoading: false,
  error: null,
  lastSync: undefined,
};

// Thunks assíncronos
export const fetchComandasAbertas = createAsyncThunk(
  'comandas/fetchAbertas',
  async (_, { rejectWithValue }) => {
    try {
      // Usar função do banco que retorna comandas com detalhes
      const { data, error } = await supabase.rpc('get_open_comandas');

      if (error) throw error;

      return data.map(transformComandaComDetalhesFromDB);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar comandas abertas');
    }
  }
);

export const fetchComandaComItens = createAsyncThunk(
  'comandas/fetchComItens',
  async (comandaId: string, { rejectWithValue }) => {
    try {
      // Buscar comanda
      const { data: comandaData, error: comandaError } = await supabase
        .from('comandas')
        .select(
          `
          *,
          bar_tables(number),
          profiles(name)
        `
        )
        .eq('id', comandaId)
        .single();

      if (comandaError) throw comandaError;

      // Buscar itens da comanda
      const { data: itensData, error: itensError } = await supabase
        .from('comanda_items')
        .select(
          `
          *,
          menu_items(name, category)
        `
        )
        .eq('comanda_id', comandaId)
        .order('added_at', { ascending: false });

      if (itensError) throw itensError;

      const comanda = transformComandaComDetalhesFromDB({
        ...comandaData,
        table_number: comandaData.bar_tables?.number,
        employee_name: comandaData.profiles?.name,
        items: itensData.map((item: any) => ({
          ...item,
          menu_item_name: item.menu_items?.name,
          menu_item_category: item.menu_items?.category,
        })),
        items_count: itensData.length,
        pending_items: itensData.filter((i: any) => ['pending', 'preparing'].includes(i.status))
          .length,
      });

      return comanda;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar comanda');
    }
  }
);

export const criarComanda = createAsyncThunk(
  'comandas/criar',
  async (
    comanda: {
      table_id?: string;
      customer_name?: string;
      employee_id: string;
      people_count: number;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const novaComanda: Partial<Comanda> = {
        ...comanda,
        status: 'open',
        total: 0,
        opened_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('comandas')
        .insert(transformComandaToDB(novaComanda))
        .select()
        .single();

      if (error) throw error;

      return transformComandaFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao criar comanda');
    }
  }
);

export const adicionarItemComanda = createAsyncThunk(
  'comandas/adicionarItem',
  async (
    {
      comandaId,
      menuItemId,
      quantity,
      notes,
    }: {
      comandaId: string;
      menuItemId: string;
      quantity: number;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Buscar preço atual do item
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .select('price')
        .eq('id', menuItemId)
        .single();

      if (menuError) throw menuError;

      const novoItem: Partial<ItemComanda> = {
        comanda_id: comandaId,
        menu_item_id: menuItemId,
        quantity,
        price: menuItem.price,
        status: 'pending',
        notes,
        added_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('comanda_items')
        .insert(transformItemComandaToDB(novoItem))
        .select()
        .single();

      if (error) throw error;

      return { comandaId, item: transformItemComandaFromDB(data) };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao adicionar item');
    }
  }
);

export const atualizarStatusItem = createAsyncThunk(
  'comandas/atualizarStatusItem',
  async (
    { itemId, status }: { itemId: string; status: ItemComanda['status'] },
    { rejectWithValue }
  ) => {
    try {
      const updates: any = { status };

      if (status === 'preparing' && !updates.prepared_at) {
        updates.prepared_at = new Date().toISOString();
      } else if (status === 'ready') {
        updates.prepared_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('comanda_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      return transformItemComandaFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar status do item');
    }
  }
);

export const fecharComanda = createAsyncThunk(
  'comandas/fechar',
  async (
    { comandaId, paymentMethod }: { comandaId: string; paymentMethod: string },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          payment_method: paymentMethod,
        })
        .eq('id', comandaId)
        .select()
        .single();

      if (error) throw error;

      return transformComandaFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao fechar comanda');
    }
  }
);

export const cancelarComanda = createAsyncThunk(
  'comandas/cancelar',
  async (comandaId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .update({
          status: 'cancelled',
          closed_at: new Date().toISOString(),
        })
        .eq('id', comandaId)
        .select()
        .single();

      if (error) throw error;

      return transformComandaFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao cancelar comanda');
    }
  }
);

// Slice
const comandasSlice = createSlice({
  name: 'comandas',
  initialState,
  reducers: {
    setComandaAtiva: (state, action: PayloadAction<ComandaComDetalhes | undefined>) => {
      state.comandaAtiva = action.payload;
    },
    limparErro: (state) => {
      state.error = null;
    },
    atualizarComandaLocal: (state, action: PayloadAction<ComandaComDetalhes>) => {
      const index = state.comandasAbertas.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.comandasAbertas[index] = action.payload;
      }
      if (state.comandaAtiva?.id === action.payload.id) {
        state.comandaAtiva = action.payload;
      }
    },
    resetComandas: (state) => {
      state.comandasAbertas = [];
      state.comandaAtiva = undefined;
      state.historico = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch comandas abertas
    builder
      .addCase(fetchComandasAbertas.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComandasAbertas.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comandasAbertas = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchComandasAbertas.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch comanda com itens
    builder
      .addCase(fetchComandaComItens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComandaComItens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comandaAtiva = action.payload;
      })
      .addCase(fetchComandaComItens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Criar comanda
    builder
      .addCase(criarComanda.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(criarComanda.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comandasAbertas.push(action.payload as any);
        state.comandaAtiva = action.payload as any;
      })
      .addCase(criarComanda.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Adicionar item
    builder
      .addCase(adicionarItemComanda.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adicionarItemComanda.fulfilled, (state, action) => {
        state.isLoading = false;
        // Atualizar comanda ativa se for a mesma
        if (state.comandaAtiva?.id === action.payload.comandaId) {
          if (!state.comandaAtiva.items) {
            state.comandaAtiva.items = [];
          }
          state.comandaAtiva.items.push(action.payload.item);
        }
      })
      .addCase(adicionarItemComanda.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Atualizar status item
    builder
      .addCase(atualizarStatusItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(atualizarStatusItem.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.comandaAtiva?.items) {
          const index = state.comandaAtiva.items.findIndex((i) => i.id === action.payload.id);
          if (index !== -1) {
            state.comandaAtiva.items[index] = action.payload;
          }
        }
      })
      .addCase(atualizarStatusItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fechar comanda
    builder
      .addCase(fecharComanda.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fecharComanda.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remover das comandas abertas
        state.comandasAbertas = state.comandasAbertas.filter((c) => c.id !== action.payload.id);
        // Adicionar ao histórico
        state.historico.unshift(action.payload as any);
        // Limpar comanda ativa se for a mesma
        if (state.comandaAtiva?.id === action.payload.id) {
          state.comandaAtiva = undefined;
        }
      })
      .addCase(fecharComanda.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancelar comanda
    builder
      .addCase(cancelarComanda.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelarComanda.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remover das comandas abertas
        state.comandasAbertas = state.comandasAbertas.filter((c) => c.id !== action.payload.id);
        // Limpar comanda ativa se for a mesma
        if (state.comandaAtiva?.id === action.payload.id) {
          state.comandaAtiva = undefined;
        }
      })
      .addCase(cancelarComanda.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setComandaAtiva, limparErro, atualizarComandaLocal, resetComandas } =
  comandasSlice.actions;

export default comandasSlice.reducer;
