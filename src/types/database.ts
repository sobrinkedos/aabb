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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
          service_charge: boolean | null
          service_charge_amount: number | null
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
          service_charge?: boolean | null
          service_charge_amount?: number | null
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
          service_charge?: boolean | null
          service_charge_amount?: number | null
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
            foreignKeyName: "comandas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
  }
}
