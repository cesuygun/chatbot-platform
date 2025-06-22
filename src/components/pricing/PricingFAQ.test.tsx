import { describe, it, expect } from 'vitest';
import { PricingFAQ } from './PricingFAQ';
import { render, screen, fireEvent } from '@testing-library/react';

describe('PricingFAQ', () => {
  it('renders FAQ questions and answers', async () => {
    render(<PricingFAQ />);
    // For each question, click the trigger and await the answer
    const faqs = [
      {
        question: /what payment methods do you accept/i,
        answer: /we accept all major credit cards and paypal/i,
      },
      {
        question: /can i cancel my subscription/i,
        answer: /yes, you can cancel anytime from your dashboard/i,
      },
      {
        question: /do you offer refunds/i,
        answer: /we offer a 14-day money-back guarantee on all plans/i,
      },
    ];

    for (const { question, answer } of faqs) {
      const trigger = screen.getByRole('button', { name: question });
      fireEvent.click(trigger);
      // Wait for the answer to appear
      expect(await screen.findByText(answer)).toBeInTheDocument();
    }
  });
});
