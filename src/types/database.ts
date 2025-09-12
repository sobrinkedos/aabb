export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bar_tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          notes: string | null
          number: string
          position_x: number | null
          position_y: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          id?: string
          notes?: string | null
          number: string
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          number?: string
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comanda_items: {
        Row: {
          added_at: string | null
          comanda_id: string
          created_at: string | null
          delivered_at: string | null
          id: string
          menu_item_id: string
          notes: string | null
          prepared_at: string | null
          price: number
          quantity: number
          status: string | null
        }
        Insert: {
          added_at?: string | null
          comanda_id: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          menu_item_id: string
          notes?: string | null
          prepared_at?: string | null
          price: number
          quantity: number
          status?: string | null
        }
        Update: {
          added_at?: string | null
          comanda_id?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          menu_item_id?: string
          notes?: string | null
          prepared_at?: string | null
          price?: number
          quantity?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comanda_items_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          closed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          employee_id: string
          id: string
          notes: string | null
          opened_at: string | null
          payment_method: string | null
          people_count: number | null
          status: string | null
          table_id: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          opened_at?: string | null
          payment_method?: string | null
          people_count?: number | null
          status?: string | null
          table_id?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          opened_at?: string | null
          payment_method?: string | null
          people_count?: number | null
          status?: string | null
          table_id?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comandas_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "bar_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bar_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_items: {
        Row: {
          available: boolean | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          preparation_time: number | null
          price: number
        }
        Insert: {
          available?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          preparation_time?: number | null
          price: number
        }
        Update: {
          available?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          preparation_time?: number | null
          price?: number
        }
        Relationships: []
      }
      bar_customers: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          dietary_restrictions: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          favorite_items: Json | null
          gender: string | null
          id: string
          is_vip: boolean | null
          last_visit: string | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string
          preferred_table: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          dietary_restrictions?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          favorite_items?: Json | null
          gender?: string | null
          id?: string
          is_vip?: boolean | null
          last_visit?: string | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone: string
          preferred_table?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          dietary_restrictions?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          favorite_items?: Json | null
          gender?: string | null
          id?: string
          is_vip?: boolean | null
          last_visit?: string | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string
          preferred_table?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_metrics: {
        Row: {
          avg_service_time: string | null
          comandas_count: number | null
          created_at: string | null
          customer_satisfaction: number | null
          date: string | null
          employee_id: string
          id: string
          orders_count: number | null
          shift_end: string | null
          shift_start: string | null
          tables_served: number | null
          tips_received: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          avg_service_time?: string | null
          comandas_count?: number | null
          created_at?: string | null
          customer_satisfaction?: number | null
          date?: string | null
          employee_id: string
          id?: string
          orders_count?: number | null
          shift_end?: string | null
          shift_start?: string | null
          tables_served?: number | null
          tips_received?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_service_time?: string | null
          comandas_count?: number | null
          created_at?: string | null
          customer_satisfaction?: number | null
          date?: string | null
          employee_id?: string
          id?: string
          orders_count?: number | null
          shift_end?: string | null
          shift_start?: string | null
          tables_served?: number | null
          tips_received?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_metrics_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bill_splits: {
        Row: {
          comanda_id: string
          created_at: string | null
          created_by: string
          discount_amount: number | null
          id: string
          person_count: number
          service_charge: number | null
          split_type: string
          splits: Json
          total_amount: number
        }
        Insert: {
          comanda_id: string
          created_at?: string | null
          created_by: string
          discount_amount?: number | null
          id?: string
          person_count: number
          service_charge?: number | null
          split_type: string
          splits: Json
          total_amount: number
        }
        Update: {
          comanda_id?: string
          created_at?: string | null
          created_by?: string
          discount_amount?: number | null
          id?: string
          person_count?: number
          service_charge?: number | null
          split_type?: string
          splits?: Json
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_splits_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_splits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']