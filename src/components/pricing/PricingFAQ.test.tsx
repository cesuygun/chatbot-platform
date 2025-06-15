import { render, screen } from '@testing-library/react';
import PricingFAQ from './PricingFAQ';

describe('PricingFAQ', () => {
  it('renders FAQ questions and answers', () => {
    render(<PricingFAQ />);
    expect(screen.getByText(/what payment methods do you accept/i)).toBeInTheDocument();
    expect(screen.getByText(/can i cancel my subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/do you offer refunds/i)).toBeInTheDocument();
    expect(screen.getByText(/we accept all major credit cards and paypal/i)).toBeInTheDocument();
    expect(
      screen.getByText(/yes, you can cancel anytime from your dashboard/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we offer a 14-day money-back guarantee on all plans/i)
    ).toBeInTheDocument();
  });
});
