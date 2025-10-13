/**
 * Sistema de Autenticação Mock
 * Simula autenticação quando as configurações reais do Supabase não estão disponíveis
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
}

export interface MockAuthResponse {
  user: MockUser | null;
  session: any;
  error: any;
}

// Usuários mock para demonstração
const MOCK_USERS: Record<string, { password: string; user: MockUser }> = {
  'admin@aabb.com': {
    password: 'admin123',
    user: {
      id: 'mock-admin-id',
      email: 'admin@aabb.com',
      name: 'Administrador',
      role: 'admin',
      department: 'Administração',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Admin'
    }
  },
  'gerente@aabb.com': {
    password: 'gerente123',
    user: {
      id: 'mock-manager-id',
      email: 'gerente@aabb.com',
      name: 'Gerente',
      role: 'manager',
      department: 'Operações',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Gerente'
    }
  },
  'funcionario@aabb.com': {
    password: 'func123',
    user: {
      id: 'mock-employee-id',
      email: 'funcionario@aabb.com',
      name: 'Funcionário',
      role: 'employee',
      department: 'Bar',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Funcionario'
    }
  },
  'demo@clubmanager.com': {
    password: 'demo123',
    user: {
      id: 'mock-demo-id',
      email: 'demo@clubmanager.com',
      name: 'Usuário Demo',
      role: 'admin',
      department: 'Demo',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Demo'
    }
  }
};

export class MockAuthService {
  private static instance: MockAuthService;
  private currentUser: MockUser | null = null;
  private sessionKey = 'mock-auth-session';

  private constructor() {
    // Restaura sessão do localStorage
    this.restoreSession();
  }

  public static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }

  /**
   * Simula login com email e senha
   */
  public async signInWithPassword(email: string, password: string): Promise<MockAuthResponse> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData = MOCK_USERS[email.toLowerCase()];
    
    if (!mockData || mockData.password !== password) {
      return {
        user: null,
        session: null,
        error: { message: 'Credenciais inválidas' }
      };
    }

    this.currentUser = mockData.user;
    this.saveSession();

    console.log('🎭 Login mock realizado com sucesso:', mockData.user.name);

    return {
      user: mockData.user,
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockData.user
      },
      error: null
    };
  }

  /**
   * Simula logout
   */
  public async signOut(): Promise<{ error: any }> {
    this.currentUser = null;
    this.clearSession();
    
    console.log('🎭 Logout mock realizado');
    
    return { error: null };
  }

  /**
   * Obtém usuário atual
   */
  public getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  /**
   * Obtém sessão atual
   */
  public getSession(): { data: { session: any } } {
    if (this.currentUser) {
      return {
        data: {
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: this.currentUser
          }
        }
      };
    }

    return { data: { session: null } };
  }

  /**
   * Simula mudança de estado de autenticação
   */
  public onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: any } } {
    // Simula callback inicial
    setTimeout(() => {
      if (this.currentUser) {
        callback('SIGNED_IN', {
          access_token: 'mock-access-token',
          user: this.currentUser
        });
      } else {
        callback('SIGNED_OUT', null);
      }
    }, 100);

    return {
      data: {
        subscription: {
          unsubscribe: () => console.log('🎭 Mock auth listener removido')
        }
      }
    };
  }

  /**
   * Lista usuários disponíveis para demonstração
   */
  public getAvailableUsers(): Array<{ email: string; password: string; name: string; role: string }> {
    return Object.entries(MOCK_USERS).map(([email, data]) => ({
      email,
      password: data.password,
      name: data.user.name,
      role: data.user.role
    }));
  }

  private saveSession(): void {
    if (this.currentUser) {
      localStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
    }
  }

  private restoreSession(): void {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        this.currentUser = JSON.parse(saved);
        console.log('🎭 Sessão mock restaurada:', this.currentUser?.name);
      }
    } catch (error) {
      console.warn('Erro ao restaurar sessão mock:', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.sessionKey);
  }
}

// Instância singleton
export const mockAuth = MockAuthService.getInstance();