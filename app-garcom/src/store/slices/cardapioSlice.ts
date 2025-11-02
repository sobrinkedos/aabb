import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CardapioState, MenuItem, MenuCategory } from '../../types';
import { supabase } from '../../services/SupabaseService';
import { transformMenuItemFromDB } from '../../types/transformers';

// Estado inicial
const initialState: CardapioState = {
  items: [],
  categories: [],
  filteredItems: [],
  selectedCategory: undefined,
  searchQuery: '',
  isLoading: false,
  error: null,
  lastSync: undefined,
};

// Thunks assíncronos
export const fetchCardapio = createAsyncThunk(
  'cardapio/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          inventory_items!menu_items_direct_inventory_item_id_fkey(current_stock)
        `)
        .eq('available', true)
        .order('name');

      if (error) throw error;

      return data.map((item: any) => ({
        ...transformMenuItemFromDB(item),
        current_stock: item.inventory_items?.current_stock,
        item_type: item.item_type,
        direct_inventory_item_id: item.direct_inventory_item_id
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar cardápio');
    }
  }
);

export const fetchCategorias = createAsyncThunk(
  'cardapio/fetchCategorias',
  async (_, { rejectWithValue }) => {
    try {
      // Buscar categorias únicas dos itens do menu
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .eq('available', true);

      if (error) throw error;

      // Extrair categorias únicas
      const uniqueCategories = [...new Set(data.map((item: any) => item.category))];

      // Criar objetos de categoria
      const categories: MenuCategory[] = uniqueCategories.map((cat, index) => ({
        id: cat,
        name: cat,
        display_order: index,
        active: true,
        created_at: new Date().toISOString(),
      }));

      return categories;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar categorias');
    }
  }
);

export const buscarItem = createAsyncThunk(
  'cardapio/buscarItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      return transformMenuItemFromDB(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar item');
    }
  }
);

// Slice
const cardapioSlice = createSlice({
  name: 'cardapio',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string | undefined>) => {
      state.selectedCategory = action.payload;
      state.filteredItems = filterItems(state.items, action.payload, state.searchQuery);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredItems = filterItems(state.items, state.selectedCategory, action.payload);
    },
    limparFiltros: (state) => {
      state.selectedCategory = undefined;
      state.searchQuery = '';
      state.filteredItems = state.items;
    },
    limparErro: (state) => {
      state.error = null;
    },
    atualizarItemLocal: (state, action: PayloadAction<MenuItem>) => {
      const index = state.items.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.filteredItems = filterItems(state.items, state.selectedCategory, state.searchQuery);
      }
    },
    resetCardapio: (state) => {
      state.items = [];
      state.categories = [];
      state.filteredItems = [];
      state.selectedCategory = undefined;
      state.searchQuery = '';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cardápio
    builder
      .addCase(fetchCardapio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCardapio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.filteredItems = filterItems(action.payload, state.selectedCategory, state.searchQuery);
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchCardapio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch categorias
    builder
      .addCase(fetchCategorias.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategorias.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategorias.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Buscar item
    builder
      .addCase(buscarItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(buscarItem.fulfilled, (state, action) => {
        state.isLoading = false;
        // Atualizar item se já existir, senão adicionar
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        state.filteredItems = filterItems(state.items, state.selectedCategory, state.searchQuery);
      })
      .addCase(buscarItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Função auxiliar para filtrar itens
function filterItems(
  items: MenuItem[],
  category: string | undefined,
  searchQuery: string
): MenuItem[] {
  let filtered = items;

  // Filtrar por categoria
  if (category) {
    filtered = filtered.filter((item) => item.category === category);
  }

  // Filtrar por busca
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }

  return filtered;
}

export const {
  setSelectedCategory,
  setSearchQuery,
  limparFiltros,
  limparErro,
  atualizarItemLocal,
  resetCardapio,
} = cardapioSlice.actions;

export default cardapioSlice.reducer;
