import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotWidget } from './ChatbotWidget';
import { vi } from 'vitest';

// Mock the ChatInterface component
vi.mock('./ChatInterface', () => ({
  ChatInterface: ({ botId }: { botId: string }) => (
    <div data-testid="chat-interface">Chat Interface for bot {botId}</div>
  ),
}));

describe('ChatbotWidget', () => {
  const mockBotId = 'test-bot-id';

  it('renders chat button', () => {
    render(<ChatbotWidget botId={mockBotId} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens chat dialog when button is clicked', async () => {
    render(<ChatbotWidget botId={mockBotId} />);
    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(screen.getByText('Chat with us')).toBeInTheDocument();
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
  });

  it('closes chat dialog when close button is clicked', async () => {
    render(<ChatbotWidget botId={mockBotId} />);

    // Open dialog
    const openButton = screen.getByRole('button');
    await userEvent.click(openButton);

    // Close dialog
    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(screen.queryByText('Chat with us')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chat-interface')).not.toBeInTheDocument();
  });

  it('passes botId to ChatInterface', async () => {
    render(<ChatbotWidget botId={mockBotId} />);
    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(screen.getByText(`Chat Interface for bot ${mockBotId}`)).toBeInTheDocument();
  });
});
