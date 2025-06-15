import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotForm } from './ChatbotForm';

// Mock the environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  },
}));

// Mock Radix UI Select to HTML equivalents
vi.mock(
  '@radix-ui/react-select',
  async () => await import('../../tests/__mocks__/@radix-ui/react-select')
);

function getSupabaseMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (vi as any).mockedSupabase;
}

vi.mock('@supabase/ssr', () => {
  const mockGetUser = vi.fn();
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockCreateBrowserClient = vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }));
  // Expose mocks for use in tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vi as any).mockedSupabase = {
    mockGetUser,
    mockSingle,
    mockSelect,
    mockInsert,
    mockFrom,
    mockCreateBrowserClient,
  };
  return {
    createBrowserClient: mockCreateBrowserClient,
  };
});

describe('ChatbotForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();
  const mockUser = { id: 'test-user-id' };
  const mockBot = { id: 'test-bot-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = getSupabaseMocks();
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mocks.mockSingle.mockResolvedValue({ data: mockBot, error: null });
  });

  it('renders form fields correctly', () => {
    render(<ChatbotForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    expect(screen.getByLabelText(/bot name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create bot/i })).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    render(<ChatbotForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/bot name/i), 'Test Bot');
    await userEvent.type(screen.getByLabelText(/description/i), 'Test Description');

    // Select model
    const modelSelect = screen.getByLabelText(/model/i);
    fireEvent.change(modelSelect, { target: { value: 'gpt-4' } });

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /create bot/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockBot.id);
    });
  });

  it('handles form validation errors', async () => {
    render(<ChatbotForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Submit form without filling required fields
    await userEvent.click(screen.getByRole('button', { name: /create bot/i }));

    await waitFor(() => {
      expect(screen.getByText('Bot name is required')).toBeInTheDocument();
      expect(screen.getByText('Model selection is required')).toBeInTheDocument();
    });
  });

  it('handles authentication errors', async () => {
    const mocks = getSupabaseMocks();
    mocks.mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Auth error'),
    });

    render(<ChatbotForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/bot name/i), 'Test Bot');
    const modelSelect = screen.getByLabelText(/model/i);
    fireEvent.change(modelSelect, { target: { value: 'gpt-4' } });

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /create bot/i }));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(screen.getByText('User not authenticated')).toBeInTheDocument();
    });
  });

  it('handles bot creation errors', async () => {
    const mocks = getSupabaseMocks();
    mocks.mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Creation error') });

    render(<ChatbotForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/bot name/i), 'Test Bot');
    const modelSelect = screen.getByLabelText(/model/i);
    fireEvent.change(modelSelect, { target: { value: 'gpt-4' } });

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /create bot/i }));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(screen.getByText('Creation error')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    render(<ChatbotForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/bot name/i), 'Test Bot');
    const modelSelect = screen.getByLabelText(/model/i);
    fireEvent.change(modelSelect, { target: { value: 'gpt-4' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create bot/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByLabelText(/bot name/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(modelSelect).toBeDisabled();
    });
  });
});
