import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginPage from './page';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { AuthContextType } from '@/contexts/auth/AuthContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock AuthContext
vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoginPage', () => {
  const mockRouter: AppRouterInstance = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  const mockSignIn = vi.fn();

  const mockAuth: AuthContextType = {
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useAuth).mockReturnValue(mockAuth);
    mockSignIn.mockReset();
    mockSignIn.mockResolvedValue({ error: null });
  });

  it('renders login form with all required elements', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login and redirects to dashboard', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });

    // Mock user state change after successful login
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      role: 'authenticated',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
      phone: '',
      confirmation_sent_at: '2024-01-01T00:00:00Z',
      confirmed_at: '2024-01-01T00:00:00Z',
      is_anonymous: false,
      identities: [],
    };
    
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // Wait for signIn to be called
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Simulate user state change by updating the mock
    vi.mocked(useAuth).mockReturnValue({
      ...mockAuth,
      user: mockUser,
      loading: false,
    });

    // Re-render to trigger useEffect
    render(<LoginPage />);

    // Wait for redirect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error and displays error message', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Some error' });
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent('An error occurred during login');
    });
  });

  it('shows production error message', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent('Network error');
    });
  });

  it('should show validation error when email is invalid', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(screen.getByTestId('login-error')).toHaveTextContent(
      'Please enter a valid email address'
    );
  });

  it('should show validation error when password is too short', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'short');
    await userEvent.click(submitButton);

    expect(screen.getByTestId('login-error')).toHaveTextContent(
      'Password must be at least 8 characters long'
    );
  });
});
