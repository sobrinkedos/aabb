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
      cash_sessions: {
        Row: {
          cash_discrepancy: number | null
          closed_at: string | null
          closing_amount: number | null
          closing_notes: string | null
          created_at: string | null
          employee_id: string
          expected_amount: number | null
          id: string
          opened_at: string | null
          opening_amount: number
          opening_notes: string | null
          session_date: string
          status: string | null
          supervisor_approval_id: string | null
          updated_at: string | null
        }
        Insert: {
          cash_discrepancy?: number | null
          closed_at?: string | null
          closing_amount?: number | null
          closing_notes?: string | null
          created_at?: string | null
          employee_id: string
          expected_amount?: number | null
          id?: string
          opened_at?: string | null
          opening_amount?: number
          opening_notes?: string | null
          session_date?: string
          status?: string | null
          supervisor_approval_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cash_discrepancy?: number | null
          closed_at?: string | null
          closing_amount?: number | null
          closing_notes?: string | null
          created_at?: string | null
          employee_id?: string
          expected_amount?: number | null
          id?: string
          opened_at?: string | null
          opening_amount?: number
          opening_notes?: string | null
          session_date?: string
          status?: string | null
          supervisor_approval_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_supervisor_approval_id_fkey"
            columns: ["supervisor_approval_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          cash_session_id: string
          comanda_id: string | null
          created_at: string | null
          customer_name: string | null
          id: string
          notes: string | null
          payment_method: string
          processed_at: string | null
          processed_by: string
          receipt_number: string | null
          reference_number: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          cash_session_id: string
          comanda_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          processed_at?: string | null
          processed_by: string
          receipt_number?: string | null
          reference_number?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          cash_session_id?: string
          comanda_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          processed_at?: string | null
          processed_by?: string
          receipt_number?: string | null
          reference_number?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reconciliation: {
        Row: {
          actual_amount: number
          cash_session_id: string
          created_at: string | null
          discrepancy: number | null
          expected_amount: number
          id: string
          notes: string | null
          payment_method: string
          reconciled_at: string | null
          reconciled_by: string
          transaction_count: number
        }
        Insert: {
          actual_amount?: number
          cash_session_id: string
          created_at?: string | null
          discrepancy?: number | null
          expected_amount?: number
          id?: string
          notes?: string | null
          payment_method: string
          reconciled_at?: string | null
          reconciled_by: string
          transaction_count?: number
        }
        Update: {
          actual_amount?: number
          cash_session_id?: string
          created_at?: string | null
          discrepancy?: number | null
          expected_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          reconciled_at?: string | null
          reconciled_by?: string
          transaction_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_reconciliation_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          empresa_id: string
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
          empresa_id: string
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
          empresa_id?: string
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
          },
          {
            foreignKeyName: "comandas_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "bar_tables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_cash_summary: {
        Row: {
          cash_discrepancy: number | null
          cash_sales: number | null
          closed_at: string | null
          closing_amount: number | null
          credit_sales: number | null
          debit_sales: number | null
          employee_id: string | null
          employee_name: string | null
          expected_amount: number | null
          opened_at: string | null
          opening_amount: number | null
          pix_sales: number | null
          session_date: string | null
          status: string | null
          total_transactions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never