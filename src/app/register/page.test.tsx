import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { vi, expect } from 'vitest';
import '@testing-library/jest-dom';
import RegisterPage from './page';
import { AuthProvider } from '@/contexts/auth/AuthProvider';
import { getErrorMessage } from '@/lib/errors';

// Mock modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}));

// Mock process.env
vi.stubEnv('NODE_ENV', 'test');

// Mock error utilities
vi.mock('@/lib/errors', () => ({
  getErrorMessage: vi.fn(error => {
    if (error?.message === 'User already registered') {
      return 'This email is already registered. Please try logging in instead.';
    }
    return error?.message || 'An error occurred';
  }),
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => {
    const error = {
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        status: 409,
      },
    };
    return {
      signUp: vi.fn().mockRejectedValueOnce(error),
      isLoading: false,
      user: null,
    };
  },
}));

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
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  const renderWithAuth = (component: React.ReactNode) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

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
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User already registered' },
        }),
      },
    };
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );
    renderWithAuth(<RegisterPage />);
    screen.debug(); // Inspect DOM structure

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(registerButton);

    // Use flexible async matcher
    const errorMessage = await screen.findByText(
      content =>
        content.toLowerCase().includes('user already registered') ||
        content.toLowerCase().includes('email already registered'),
      { exact: false }
    );
    expect(errorMessage).toBeInTheDocument();
    expect(getErrorMessage).toHaveBeenCalledWith({ message: 'User already registered' });
  });

  it('shows error when passwords do not match', async () => {
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

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'different_password');
    await userEvent.click(registerButton);

    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('handles successful registration and shows success message', async () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'test_user_id', email: 'test@example.com' } },
          error: null,
        }),
      },
    };
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );
    renderWithAuth(<RegisterPage />);
    screen.debug(); // Inspect DOM structure

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(registerButton);

    // Use flexible async matcher
    const successMessage = await screen.findByText(
      content => content.toLowerCase().includes('registration successful'),
      { exact: false }
    );
    expect(successMessage).toBeInTheDocument();
    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      },
      { timeout: 3500 }
    );
  });

  it('detects already registered emails', async () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'existing-user' } },
          error: null,
        }),
        signUp: vi.fn(),
      },
    };
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );
    renderWithAuth(<RegisterPage />);
    screen.debug(); // Inspect DOM structure

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(registerButton);

    // Use flexible async matcher
    const duplicateError = await screen.findByText(
      content => content.toLowerCase().includes('this email is already registered'),
      { exact: false }
    );
    expect(duplicateError).toBeInTheDocument();
    expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
  });

  it('shows error on duplicate email', async () => {
    renderWithAuth(<RegisterPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'test@exists.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Debug DOM state
    screen.debug();

    const duplicateError = await screen.findByText('This email is already in use', {
      exact: false,
    });
    await waitFor(() => {
      expect(duplicateError).toBeInTheDocument();
    });
  });

  it('shows error on duplicate email after triggering submission', async () => {
    renderWithAuth(<RegisterPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'test@exists.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Debug DOM state
    screen.debug();

    await waitFor(() => {
      expect(screen.getByTestId('registration-error')).toBeInTheDocument();
    });
    console.log('Rendered error:', screen.getByTestId('registration-error').textContent);
  });
});

describe('Register Page - Production Mode', () => {
  beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('shows production error message', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    await userEvent.type(screen.getByLabelText('Email'), 'test@exists.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Debug DOM state
    screen.debug();

    await waitFor(() => {
      expect(screen.getByText('This email is already in use')).toBeInTheDocument();
    });
  });
});
