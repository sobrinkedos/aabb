import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContextSimple';
import { supabase } from '../../lib/supabase';

// Mock do Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  },
  isSupabaseConfigured: false
}));

// Mock do AuthLoader
vi.mock('../components/Auth/AuthLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="auth-loader">{message}</div>
}));

// Componente de teste para usar o hook
const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? user.name : 'no user'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('demo@clubmanager.com', 'demo123456')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-loader')).toBeInTheDocument();
  });

  it('should show no user when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no user');
  });

  it('should login demo user successfully', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await act(async () => {
      await user.click(screen.getByTestId('login-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Usuário Demo');
    });
  });

  it('should logout user successfully', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Login first
    await act(async () => {
      await user.click(screen.getByTestId('login-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Usuário Demo');
    });

    // Then logout
    await act(async () => {
      await user.click(screen.getByTestId('logout-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });

  it('should handle login with invalid credentials', async () => {
    const { login } = useAuth();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const result = await act(async () => {
      return login('invalid@email.com', 'wrongpassword');
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Credenciais inválidas');
  });

  it('should call Supabase auth methods when configured', async () => {
    // Mock Supabase as configured
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });

    // Temporarily mock isSupabaseConfigured as true
    vi.doMock('../../lib/supabase', () => ({
      supabase: {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: null
          }),
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null
          }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } }
          }))
        }
      },
      isSupabaseConfigured: true
    }));

    const TestComponentWithSupabase = () => {
      const { login } = useAuth();
      
      return (
        <button 
          data-testid="supabase-login" 
          onClick={() => login('test@example.com', 'password')}
        >
          Login with Supabase
        </button>
      );
    };

    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponentWithSupabase />
      </AuthProvider>
    );

    await act(async () => {
      await user.click(screen.getByTestId('supabase-login'));
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });
});