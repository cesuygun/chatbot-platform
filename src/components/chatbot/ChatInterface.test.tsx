import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatInterface } from './ChatInterface';

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock fetch
global.fetch = vi.fn();

describe('ChatInterface', () => {
  const mockBotId = 'test-bot-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface', () => {
    render(<ChatInterface botId={mockBotId} />);
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('sends message and displays response', async () => {
    const mockResponse = { message: 'Test response' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await userEvent.type(input, 'Test message');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('handles error response', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await userEvent.type(input, 'Test message');
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('disables input while loading', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await userEvent.type(input, 'Test message');
    await userEvent.click(sendButton);

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('shows loading indicator', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await userEvent.type(input, 'Test message');
    await userEvent.click(sendButton);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
