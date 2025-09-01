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
      inventory_items: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          current_stock: number
          id: string
          last_updated: string | null
          min_stock: number
          name: string
          supplier: string | null
          unit: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          last_updated?: string | null
          min_stock?: number
          name: string
          supplier?: string | null
          unit: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          last_updated?: string | null
          min_stock?: number
          name?: string
          supplier?: string | null
          unit?: string
        }
        Relationships: []
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
      menu_items: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          preparation_time: number | null
          price: number
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          preparation_time?: number | null
          price: number
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          preparation_time?: number | null
          price?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          menu_item_id: string
          notes: string | null
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          id?: string
          menu_item_id: string
          notes?: string | null
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          id?: string
          menu_item_id?: string
          notes?: string | null
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
          created_at: string
          employee_id: string | null
          id: string
          notes: string | null
          status: string
          table_number: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          table_number?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          table_number?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
