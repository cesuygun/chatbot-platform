import React from 'react';

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and PayPal.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel anytime from your dashboard.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee on all plans.',
  },
];

const PricingFAQ = () => (
  <div className="mt-12">
    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
    <ul className="space-y-4">
      {faqs.map((faq, idx) => (
        <li key={idx}>
          <strong>{faq.question}</strong>
          <p className="text-muted-foreground mt-1">{faq.answer}</p>
        </li>
      ))}
    </ul>
  </div>
);

export default PricingFAQ;
