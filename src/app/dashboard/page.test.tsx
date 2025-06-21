import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DashboardPage from './page';

describe('DashboardPage', () => {
  it('renders dashboard with chatbot list', async () => {
    render(<DashboardPage />);

    // Wait for the dashboard to render
    await waitFor(() => {
      expect(screen.getByText('My Chatbots')).toBeInTheDocument();
      expect(screen.getByText('Create New')).toBeInTheDocument();
    });
  });

  it('displays list of chatbots', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Customer Support')).toBeInTheDocument();
      expect(screen.getByText('Product FAQ')).toBeInTheDocument();
      expect(screen.getByText('Lead Generation')).toBeInTheDocument();
      expect(screen.getByText('Sales Assistant')).toBeInTheDocument();
      expect(screen.getByText('Booking Agent')).toBeInTheDocument();
    });
  });

  it('shows chatbot statistics', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages: 1245')).toBeInTheDocument();
      expect(screen.getByText('Avg. Rating: 4.8/5')).toBeInTheDocument();
      expect(screen.getByText('Last Updated: 2 days ago')).toBeInTheDocument();
    });
  });

  it('displays plan usage information', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Plan Usage')).toBeInTheDocument();
      expect(screen.getByText('You have used 3 of your 5 available chatbots.')).toBeInTheDocument();
    });
  });

  it('has edit and deploy buttons for each chatbot', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit');
      const deployButtons = screen.getAllByText('Deploy');

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deployButtons.length).toBeGreaterThan(0);
    });
  });

  it('has create new chatbot button', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /create new/i });
      expect(createButton).toBeInTheDocument();
    });
  });
});
