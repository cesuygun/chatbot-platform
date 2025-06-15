import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PricingPage from './page';
import { AuthProvider } from '@/contexts/auth/AuthProvider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock AuthContext
vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

describe('PricingPage', () => {
  const renderWithAuth = (component: React.ReactNode) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  it('renders all pricing plans', () => {
    renderWithAuth(<PricingPage />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows monthly prices by default', () => {
    renderWithAuth(<PricingPage />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });

  it('shows yearly prices when yearly is selected', () => {
    renderWithAuth(<PricingPage />);
    const yearlyToggle = screen.getByRole('switch', { name: /yearly/i });
    fireEvent.click(yearlyToggle);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$290')).toBeInTheDocument();
    expect(screen.getByText('$990')).toBeInTheDocument();
  });

  it('highlights the Pro plan', () => {
    renderWithAuth(<PricingPage />);
    const proPlan = screen.getByText('Pro').closest('div');
    expect(proPlan).toHaveClass('border-primary');
  });

  it('shows correct button text for each plan', () => {
    renderWithAuth(<PricingPage />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('displays all features for each plan', () => {
    renderWithAuth(<PricingPage />);
    expect(screen.getByText('1 Chatbot')).toBeInTheDocument();
    expect(screen.getByText('5 Chatbots')).toBeInTheDocument();
    expect(screen.getByText('Unlimited Chatbots')).toBeInTheDocument();
  });
});
