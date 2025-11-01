// Tipos alinhados com a tabela profiles do banco de dados
export interface Profile {
  id: string; // UUID do auth.users
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'employee' | 'manager' | 'waiter';
  updated_at: string;
}

// Tipo estendido com informações de autenticação
export interface User extends Profile {
  email: string;
  empresa_id?: string; // Para multitenancy
}

// Estado de autenticação
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  session: Session | null;
}

// Sessão do Supabase
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
  };
}

// Métricas de atendimento (alinhado com attendance_metrics)
export interface AttendanceMetrics {
  id: string;
  employee_id: string;
  date: string;
  shift_start?: string;
  shift_end?: string;
  orders_count: number;
  comandas_count: number;
  avg_service_time?: string; // INTERVAL do PostgreSQL
  total_sales: number;
  customer_satisfaction?: number; // 0-5
  tips_received: number;
  tables_served: number;
  created_at: string;
  updated_at: string;
}

// Labels de roles
export const RoleLabel: Record<Profile['role'], string> = {
  admin: 'Administrador',
  employee: 'Funcionário',
  manager: 'Gerente',
  waiter: 'Garçom',
};