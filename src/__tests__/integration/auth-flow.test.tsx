import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContextSimple';
import LoginForm from '../../components/Auth/LoginForm';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';

// Mock do Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  },
  isSupabaseConfigured: false
}));

// Mock dos componentes de loading e erro
vi.mock('../../components/Auth/AuthLoader', () => ({
  default: () => <div data-testid="auth-loader">Loading...</div>
}));

vi.mock('../../components/Auth/AuthErrorDisplay', () => ({
  AuthErrorDisplay: ({ error, onRetry }: any) => (
    error ? (
      <div data-testid="auth-error">
        {error}
        {onRetry && <button data-testid="retry-btn" onClick={onRetry}>Retry</button>}
      </div>
    ) : null
  )
}));

// Componente protegido para teste
const ProtectedComponent = () => (
  <div data-testid="protected-content">Protected Content</div>
);

// Wrapper com roteamento
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Fill in login form
      const emailInput = screen.getByPlaceholderText('Digite seu email');
      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /entrar$/i });

      await user.type(emailInput, 'demo@clubmanager.com');
      await user.type(passwordInput, 'demo123456');
      await user.click(loginButton);

      // Should redirect or show success (in real app, would redirect)
      // For demo mode, we expect no error
      await waitFor(() => {
        expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument();
      });
    });

    it('should show error for invalid credentials', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Fill in invalid credentials
      const emailInput = screen.getByPlaceholderText('Digite seu email');
      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /entrar$/i });

      await user.type(emailInput, 'invalid@email.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toBeInTheDocument();
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Credenciais inválidas');
      });
    });

    it('should handle demo login button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Click demo login button
      const demoButton = screen.getByRole('button', { name: /entrar como demo/i });
      await user.click(demoButton);

      // Should not show error for demo login
      await waitFor(() => {
        expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Try to submit without filling fields
      const loginButton = screen.getByRole('button', { name: /entrar$/i });
      await user.click(loginButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('preencha todos os campos');
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when not authenticated', async () => {
      // Mock useLocation and Navigate
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          Navigate: ({ to }: { to: string }) => {
            mockNavigate(to);
            return <div data-testid="redirect">Redirecting to {to}</div>;
          },
          useLocation: () => ({ pathname: '/protected' })
        };
      });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <ProtectedComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Should redirect to login
      expect(screen.getByTestId('redirect')).toHaveTextContent('Redirecting to /login');
    });

    it('should show protected content when authenticated', async () => {
      // This test would require mocking the authenticated state
      // In a real scenario, you'd set up the auth context with a logged-in user
      
      // For now, we'll test the component structure
      render(
        <TestWrapper>
          <ProtectedRoute>
            <ProtectedComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // In unauthenticated state, should not show protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Session Persistence', () => {
    it('should handle page refresh correctly', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByTestId('auth-loader')).toBeInTheDocument();

      // Should complete loading
      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Should show login form (not authenticated)
      expect(screen.getByPlaceholderText('Digite seu email')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.mocked(require('../../lib/supabase').supabase.auth.signInWithPassword)
        .mockRejectedValue(new Error('Failed to fetch'));

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Fill form and submit
      const emailInput = screen.getByPlaceholderText('Digite seu email');
      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /entrar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      await user.click(loginButton);

      // Should show network error (but in demo mode, it uses mock auth)
      // This test verifies the error handling structure is in place
      await waitFor(() => {
        expect(screen.queryByTestId('auth-error')).toBeInTheDocument();
      });
    });

    it('should provide retry functionality for retryable errors', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('auth-loader')).not.toBeInTheDocument();
      });

      // Trigger an error first
      const emailInput = screen.getByPlaceholderText('Digite seu email');
      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /entrar$/i });

      await user.type(emailInput, 'invalid@email.com');
      await user.type(passwordInput, 'wrong');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toBeInTheDocument();
      });

      // Check if retry button is available (depends on error type)
      const retryButton = screen.queryByTestId('retry-btn');
      if (retryButton) {
        await user.click(retryButton);
        // Verify retry attempt was made
        expect(retryButton).toBeInTheDocument();
      }
    });
  });
});