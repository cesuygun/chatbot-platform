import { describe, it, expect } from 'vitest';
import { PricingHeader } from './PricingHeader';
import { render, screen } from '@testing-library/react';

describe('PricingHeader', () => {
  it('renders the title and subtitle', () => {
    render(<PricingHeader />);
    expect(screen.getByText(/our pricing plans/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the plan that fits your needs/i)).toBeInTheDocument();
  });
});
