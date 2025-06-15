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

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('PricingPage', () => {
  const renderWithAuth = (component: React.ReactNode) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('redirects to login when clicking on a plan without being logged in', async () => {
    renderWithAuth(<PricingPage />);
    const getStartedButton = screen.getByText('Get Started');
    fireEvent.click(getStartedButton);
    expect(window.location.href).toBe('/login?redirectTo=/pricing');
  });

  it('opens email client for enterprise plan', () => {
    renderWithAuth(<PricingPage />);
    const contactSalesButton = screen.getByText('Contact Sales');
    fireEvent.click(contactSalesButton);
    expect(window.location.href).toBe('mailto:sales@example.com');
  });
});
