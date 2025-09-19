// Tipos para o sistema de autenticação

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'member';
  avatar?: string;
  department?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  loginAsDemo: () => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  isLoading: boolean;
}

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'employee' | 'member';
  updated_at: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}