import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import TestPage from './page';

// Mock the ChatbotWidget component
vi.mock('@/components/chatbot/ChatbotWidget', () => ({
  ChatbotWidget: ({ botId, className }: { botId: string; className: string }) => (
    <div data-testid="chatbot-widget" className={className}>
      Chatbot Widget for bot {botId}
    </div>
  ),
}));

describe('TestPage', () => {
  it('renders page content', () => {
    render(<TestPage />);
    expect(screen.getByText('Chatbot Widget Test Page')).toBeInTheDocument();
    expect(screen.getByText(/click the chat button in the bottom right/i)).toBeInTheDocument();
  });

  it('renders ChatbotWidget with correct props', () => {
    render(<TestPage />);
    const widget = screen.getByTestId('chatbot-widget');
    expect(widget).toBeInTheDocument();
    expect(widget).toHaveClass('fixed bottom-4 right-4');
    expect(widget).toHaveTextContent('Chatbot Widget for bot test-bot-id');
  });
});
