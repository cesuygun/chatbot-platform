import { render, screen } from '@testing-library/react';
import PricingHeader from './PricingHeader';

describe('PricingHeader', () => {
  it('renders the title and subtitle', () => {
    render(<PricingHeader />);
    expect(screen.getByText(/our pricing plans/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the plan that fits your needs/i)).toBeInTheDocument();
  });
});
