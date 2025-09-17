export interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo: 'garcom' | 'supervisor' | 'gerente';
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}