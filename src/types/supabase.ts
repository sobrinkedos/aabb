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
      bar_customer_visits: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          items_ordered: Json | null
          notes: string | null
          payment_method: string | null
          table_number: string | null
          total_spent: number | null
          visit_date: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          items_ordered?: Json | null
          notes?: string | null
          payment_method?: string | null
          table_number?: string | null
          total_spent?: number | null
          visit_date?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          items_ordered?: Json | null
          notes?: string | null
          payment_method?: string | null
          table_number?: string | null
          total_spent?: number | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_customer_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bar_customers"
            referencedColumns: ["id"]
          },
        ]
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
      bar_employees: {
        Row: {
          bar_role: string
          commission_rate: number | null
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          shift_preference: string | null
          specialties: string[] | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          bar_role: string
          commission_rate?: number | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          shift_preference?: string | null
          specialties?: string[] | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_role?: string
          commission_rate?: number | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          shift_preference?: string | null
          specialties?: string[] | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_type: string
          city: string
          complement: string | null
          country: string | null
          created_at: string
          customer_id: string
          id: string
          is_primary: boolean | null
          neighborhood: string
          number: string | null
          state: string
          street: string
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address_type?: string
          city: string
          complement?: string | null
          country?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_primary?: boolean | null
          neighborhood: string
          number?: string | null
          state: string
          street: string
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address_type?: string
          city?: string
          complement?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_primary?: boolean | null
          neighborhood?: string
          number?: string | null
          state?: string
          street?: string
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_dependents: {
        Row: {
          birth_date: string | null
          can_make_purchases: boolean | null
          cpf: string | null
          created_at: string
          credit_limit: number | null
          customer_id: string
          gender: string | null
          id: string
          name: string
          notes: string | null
          relationship: string
          rg: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          can_make_purchases?: boolean | null
          cpf?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_id: string
          gender?: string | null
          id?: string
          name: string
          notes?: string | null
          relationship: string
          rg?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          can_make_purchases?: boolean | null
          cpf?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_id?: string
          gender?: string | null
          id?: string
          name?: string
          notes?: string | null
          relationship?: string
          rg?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_dependents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_membership_history: {
        Row: {
          action: string
          created_at: string
          customer_id: string
          id: string
          new_membership_type: string | null
          new_status: string | null
          previous_membership_type: string | null
          previous_status: string | null
          processed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          customer_id: string
          id?: string
          new_membership_type?: string | null
          new_status?: string | null
          previous_membership_type?: string | null
          previous_status?: string | null
          processed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          customer_id?: string
          id?: string
          new_membership_type?: string | null
          new_status?: string | null
          previous_membership_type?: string | null
          previous_status?: string | null
          processed_by?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_membership_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_membership_history_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          customer_type: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          join_date: string | null
          marketing_consent: boolean | null
          membership_number: string | null
          membership_status: string | null
          membership_type: string | null
          name: string
          notes: string | null
          phone: string | null
          preferred_payment_method: string | null
          rg: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          customer_type?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          marketing_consent?: boolean | null
          membership_number?: string | null
          membership_status?: string | null
          membership_type?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_payment_method?: string | null
          rg?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          customer_type?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          marketing_consent?: boolean | null
          membership_number?: string | null
          membership_status?: string | null
          membership_type?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_payment_method?: string | null
          rg?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_position_history: {
        Row: {
          created_at: string | null
          employee_id: string
          end_date: string | null
          id: string
          position_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          position_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          position_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_position_history_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_position_history_position"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          created_at: string | null
          employee_id: string
          end_date: string | null
          id: string
          shift_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          shift_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          shift_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_schedules_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_schedules_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "employee_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shifts: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          admission_date: string
          core_area: string
          created_at: string | null
          department_id: string | null
          employee_number: string
          id: string
          is_active: boolean | null
          notes: string | null
          position_id: string | null
          profile_id: string
          salary: number | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          admission_date: string
          core_area: string
          created_at?: string | null
          department_id?: string | null
          employee_number: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          position_id?: string | null
          profile_id: string
          salary?: number | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          admission_date?: string
          core_area?: string
          created_at?: string | null
          department_id?: string | null
          employee_number?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          position_id?: string | null
          profile_id?: string
          salary?: number | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employees_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_position"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_profile"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          available_for_sale: boolean | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          current_stock: number
          id: string
          last_updated: string | null
          min_stock: number
          name: string
          supplier: string | null
          unit: string
        }
        Insert: {
          available_for_sale?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          min_stock?: number
          name: string
          supplier?: string | null
          unit: string
        }
        Update: {
          available_for_sale?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          min_stock?: number
          name?: string
          supplier?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          join_date: string
          membership_type: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          join_date?: string
          membership_type: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          join_date?: string
          membership_type?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      menu_combos: {
        Row: {
          combo_price: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          combo_price: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          combo_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      nutritional_info: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          created_at: string | null
          fats: number | null
          fiber: number | null
          id: string
          menu_item_id: string
          proteins: number | null
          sodium: number | null
          sugars: number | null
          updated_at: string | null
        }
        Insert: {
          calories?: number | null
          carbohydrates?: number | null
          created_at?: string | null
          fats?: number | null
          fiber?: number | null
          id?: string
          menu_item_id: string
          proteins?: number | null
          sodium?: number | null
          sugars?: number | null
          updated_at?: string | null
        }
        Update: {
          calories?: number | null
          carbohydrates?: number | null
          created_at?: string | null
          fats?: number | null
          fiber?: number | null
          id?: string
          menu_item_id?: string
          proteins?: number | null
          sodium?: number | null
          sugars?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutritional_info_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: true
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          status: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          status?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          status?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_salary: number | null
          min_salary: number | null
          name: string
          requirements: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_salary?: number | null
          min_salary?: number | null
          name: string
          requirements?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_salary?: number | null
          min_salary?: number | null
          name?: string
          requirements?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_positions_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          menu_item_id: string
          new_price: number
          old_price: number | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          menu_item_id: string
          new_price: number
          old_price?: number | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          menu_item_id?: string
          new_price?: number
          old_price?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          quantity?: number
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          menu_item_id: string
          name: string
          preparation_time: number | null
          servings: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          menu_item_id: string
          name: string
          preparation_time?: number | null
          servings?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          menu_item_id?: string
          name?: string
          preparation_time?: number | null
          servings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          manager_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_departments_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          id: string
          name: string
          department_id: string
          description: string | null
          requires_system_access: boolean
          base_salary: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          department_id: string
          description?: string | null
          requires_system_access?: boolean
          base_salary?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          department_id?: string
          description?: string | null
          requires_system_access?: boolean
          base_salary?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          id: string
          employee_code: string
          name: string
          cpf: string | null
          email: string | null
          phone: string | null
          address: Json | null
          birth_date: string | null
          hire_date: string
          termination_date: string | null
          position_id: string
          department_id: string
          profile_id: string | null
          salary: number | null
          status: string
          emergency_contact: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_code: string
          name: string
          cpf?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          birth_date?: string | null
          hire_date?: string
          termination_date?: string | null
          position_id: string
          department_id: string
          profile_id?: string | null
          salary?: number | null
          status?: string
          emergency_contact?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_code?: string
          name?: string
          cpf?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          birth_date?: string | null
          hire_date?: string
          termination_date?: string | null
          position_id?: string
          department_id?: string
          profile_id?: string | null
          salary?: number | null
          status?: string
          emergency_contact?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shifts: {
        Row: {
          id: string
          name: string
          start_time: string
          end_time: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_time: string
          end_time: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_time?: string
          end_time?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      employee_schedules: {
        Row: {
          id: string
          employee_id: string
          shift_id: string
          work_date: string
          status: string
          check_in_time: string | null
          check_out_time: string | null
          break_duration: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          shift_id: string
          work_date: string
          status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          break_duration?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          shift_id?: string
          work_date?: string
          status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          break_duration?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedules_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "employee_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_position_history: {
        Row: {
          id: string
          employee_id: string
          position_id: string
          department_id: string
          start_date: string
          end_date: string | null
          salary: number | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          position_id: string
          department_id: string
          start_date: string
          end_date?: string | null
          salary?: number | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          position_id?: string
          department_id?: string
          start_date?: string
          end_date?: string | null
          salary?: number | null
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_position_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_position_history_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_position_history_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_employee_with_profile: {
        Args: {
          p_name: string
          p_email: string
          p_position_id: string
          p_employee_code?: string
        }
        Returns: string
      }
      get_employees_by_department: {
        Args: {
          dept_name: string
        }
        Returns: {
          employee_id: string
          employee_name: string
          position_name: string
          status: string
          has_system_access: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
