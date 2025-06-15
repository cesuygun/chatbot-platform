import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import RegisterPage from './page';
import { AuthProvider } from '@/contexts/auth/AuthProvider';

// Mock modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}));

// Mock process.env
vi.stubEnv('NODE_ENV', 'test');

// Mock useAuth hook
vi.mock('@/contexts/auth/AuthContext', async () => {
  const actual = await import('@/contexts/auth/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      signUp: vi.fn().mockImplementation(async (email: string) => {
        if (email === 'existing@example.com') {
          return {
            error: {
              code: '23505',
              message: 'User already registered',
            },
            data: null,
          };
        }
        if (email === 'test@exists.com') {
          return {
            error: new Error('Registration failed'),
            data: null,
          };
        }
        return {
          error: null,
          data: { user: { id: 'test_user_id', email } },
        };
      }),
      isLoading: false,
      user: null,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const renderWithAuth = (component: React.ReactNode) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('RegisterPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(mockRouter);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'test_url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_key';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('renders register form with all required elements', () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );
    renderWithAuth(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('handles registration error and displays user-friendly message', async () => {
    renderWithAuth(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const termsCheckbox = screen.getByLabelText(/accept the terms/i);
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(termsCheckbox);
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('This email is already in use')).toBeInTheDocument();
    });
  });

  it('should show validation error when email is invalid', async () => {
    renderWithAuth(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const termsCheckbox = screen.getByLabelText(/accept the terms/i);
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(termsCheckbox);
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should show validation error when password is too short', async () => {
    renderWithAuth(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const termsCheckbox = screen.getByLabelText(/accept the terms/i);
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(confirmPasswordInput, 'short');
    await userEvent.click(termsCheckbox);
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('should show validation error when passwords do not match', async () => {
    renderWithAuth(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const termsCheckbox = screen.getByLabelText(/accept the terms/i);
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'different_password');
    await userEvent.click(termsCheckbox);
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should show validation error when terms are not accepted', async () => {
    renderWithAuth(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('Please accept the terms and conditions')).toBeInTheDocument();
    });
  });

  it('should allow registration when all validations pass', async () => {
    renderWithAuth(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const termsCheckbox = screen.getByLabelText(/accept the terms/i);
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(termsCheckbox);
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Registration successful! Please check your email to confirm your account.'
        )
      ).toBeInTheDocument();
    });

    // Wait for the redirect
    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      },
      { timeout: 3500 }
    );
  });

  describe('Register Page - Production Mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.stubEnv('NODE_ENV', 'test');
    });

    it('shows production error message', async () => {
      renderWithAuth(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const termsCheckbox = screen.getByLabelText(/accept the terms/i);
      const registerButton = screen.getByRole('button', { name: /register/i });

      await userEvent.type(emailInput, 'test@exists.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(termsCheckbox);
      await userEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
      });
    });
  });
});
