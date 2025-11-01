// Tipos alinhados com a tabela menu_items do banco de dados
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  preparation_time?: number; // em minutos
  created_at: string;
}

// Tipo estendido com informações adicionais (para UI)
export interface MenuItemComDetalhes extends MenuItem {
  image_url?: string;
  ingredients?: string[];
  allergens?: string[];
  stock_available?: boolean;
  popularity_score?: number;
}

// Categorias do cardápio
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  active: boolean;
  icon?: string;
  created_at: string;
}

// Tipos para busca e filtros
export interface MenuFilter {
  category?: string;
  available?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Tipos para carrinho de pedidos (antes de adicionar à comanda)
export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  notes?: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

// Labels traduzidos
export const MenuCategoryLabel: Record<string, string> = {
  drinks: 'Bebidas',
  food: 'Comidas',
  snacks: 'Petiscos',
  desserts: 'Sobremesas',
  specials: 'Especiais',
};