import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Set up MSW server
const server = setupServer(
  http.post(/.*\/api\/chat$/, async ({ request }) => {
    const body = (await request.json()) as { message: string; botId: string };
    await new Promise(res => setTimeout(res, 200)); // Add delay for loading state
    if (body.message === 'Test message') {
      return HttpResponse.json({ message: 'Test response' });
    }
    return new HttpResponse(null, { status: 500 });
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe('ChatInterface', () => {
  const mockBotId = 'test-bot-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface', () => {
    render(<ChatInterface botId={mockBotId} />);
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('sends message and displays response', async () => {
    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    await userEvent.type(input, 'Test message');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('handles error response', async () => {
    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    await userEvent.type(input, 'Error message');
    await userEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText('Sorry, I encountered an error. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('disables input while loading', async () => {
    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    await userEvent.type(input, 'Test message');
    await userEvent.click(button);

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  it('shows loading indicator', async () => {
    render(<ChatInterface botId={mockBotId} />);
    const input = screen.getByTestId('message-input');
    const button = screen.getByTestId('send-button');

    await userEvent.type(input, 'Test message');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Loading response' })).toBeInTheDocument();
    });
  });
});
