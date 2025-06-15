import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/contexts/auth/AuthProvider';
import LoginPage from './page';
import { User } from '@supabase/supabase-js';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

const renderWithAuth = (component: React.ReactNode) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('LoginPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as { mockReturnValue: (v: typeof mockRouter) => void }).mockReturnValue(
      mockRouter
    );
  });

  it('renders login form with all required elements', () => {
    renderWithAuth(<LoginPage />);
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login and redirects to dashboard', async () => {
    const { supabase } = await import('@/lib/supabase');
    (
      supabase.auth.signInWithPassword as unknown as {
        mockResolvedValueOnce: (v: { data: { user: User | null }; error: Error | null }) => void;
      }
    ).mockResolvedValueOnce({
      data: { user: { id: '123' } as User },
      error: null,
    });

    renderWithAuth(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error and displays error message', async () => {
    const { supabase } = await import('@/lib/supabase');
    (
      supabase.auth.signInWithPassword as unknown as {
        mockResolvedValueOnce: (v: { data: { user: User | null }; error: Error | null }) => void;
      }
    ).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' } as Error,
    });

    renderWithAuth(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/fetch failed/i)).toBeInTheDocument();
    });
  });
});
