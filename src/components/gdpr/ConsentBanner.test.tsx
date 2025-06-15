import { render, screen, fireEvent } from '@testing-library/react';
import { ConsentBanner } from './ConsentBanner';
import { vi } from 'vitest';

describe('ConsentBanner', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
  });

  it('shows banner when no preferences are saved', () => {
    render(<ConsentBanner />);
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    expect(screen.getByText('Accept All')).toBeInTheDocument();
    expect(screen.getByText('Reject All')).toBeInTheDocument();
    expect(screen.getByText('Customize')).toBeInTheDocument();
  });

  it('hides banner when preferences are saved', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
    render(<ConsentBanner />);
    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument();
  });

  it('opens preferences dialog when customize is clicked', () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByText('Customize'));
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('saves preferences when accept all is clicked', () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByText('Accept All'));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      JSON.stringify({ necessary: true, analytics: true, marketing: true })
    );
  });

  it('saves preferences when reject all is clicked', () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByText('Reject All'));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });

  it('updates preferences when switches are toggled', () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByText('Customize'));

    const analyticsSwitch = screen.getByLabelText('Analytics Cookies');
    const marketingSwitch = screen.getByLabelText('Marketing Cookies');

    fireEvent.click(analyticsSwitch);
    fireEvent.click(marketingSwitch);

    fireEvent.click(screen.getByText('Save Preferences'));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      JSON.stringify({ necessary: true, analytics: true, marketing: true })
    );
  });
});
