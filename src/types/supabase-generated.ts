// Este arquivo foi gerado automaticamente pelo Supabase MCP
// Não edite manualmente - será sobrescrito na próxima geração

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      inventory_movements: {
        Row: {
          balcao_order_id: string | null
          comanda_id: string | null
          created_at: string | null
          created_by: string
          empresa_id: string
          id: string
          inventory_item_id: string
          menu_item_id: string | null
          movement_type: string
          notes: string | null
          quantity: number
          reference_document: string | null
          stock_after: number
          stock_before: number
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          balcao_order_id?: string | null
          comanda_id?: string | null
          created_at?: string | null
          created_by: string
          empresa_id: string
          id?: string
          inventory_item_id: string
          menu_item_id?: string | null
          movement_type: string
          notes?: string | null
          quantity: number
          reference_document?: string | null
          stock_after: number
          stock_before: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          balcao_order_id?: string | null
          comanda_id?: string | null
          created_at?: string | null
          created_by?: string
          empresa_id?: string
          id?: string
          inventory_item_id?: string
          menu_item_id?: string | null
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_document?: string | null
          stock_after?: number
          stock_before?: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          available_for_sale: boolean | null
          category_id: string | null
          cost: number | null
          created_at: string
          current_stock: number
          empresa_id: string
          id: string
          image_url: string | null
          last_updated: string | null
          margin_percentage: number | null
          min_stock: number
          name: string
          pricing_method: string | null
          sale_price: number | null
          supplier: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          available_for_sale?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string
          current_stock?: number
          empresa_id: string
          id?: string
          image_url?: string | null
          last_updated?: string | null
          margin_percentage?: number | null
          min_stock?: number
          name: string
          pricing_method?: string | null
          sale_price?: number | null
          supplier?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          available_for_sale?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string
          current_stock?: number
          empresa_id?: string
          id?: string
          image_url?: string | null
          last_updated?: string | null
          margin_percentage?: number | null
          min_stock?: number
          name?: string
          pricing_method?: string | null
          sale_price?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      inventory_movements_detailed: {
        Row: {
          balcao_order_id: string | null
          balcao_order_number: number | null
          category_name: string | null
          comanda_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          empresa_id: string | null
          id: string | null
          inventory_item_id: string | null
          item_name: string | null
          item_unit: string | null
          menu_item_id: string | null
          menu_item_name: string | null
          movement_direction: string | null
          movement_type: string | null
          movement_type_label: string | null
          notes: string | null
          quantity: number | null
          reference_document: string | null
          stock_after: number | null
          stock_before: number | null
          total_cost: number | null
          unit_cost: number | null
        }
        Relationships: []
      }
      inventory_movements_summary: {
        Row: {
          current_stock: number | null
          inventory_item_id: string | null
          item_name: string | null
          last_movement_at: string | null
          total_cost_in: number | null
          total_entries: number | null
          total_exits: number | null
          total_movements: number | null
          total_quantity_in: number | null
          total_quantity_out: number | null
          unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      register_inventory_movement: {
        Args: {
          p_balcao_order_id?: string
          p_comanda_id?: string
          p_created_by?: string
          p_inventory_item_id: string
          p_menu_item_id?: string
          p_movement_type: string
          p_notes?: string
          p_quantity: number
          p_reference_document?: string
          p_unit_cost?: number
        }
        Returns: string
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
