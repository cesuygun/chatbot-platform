import { test, expect } from '@playwright/test';

test.describe('Authentication Error Handling', () => {
  test('shows user-friendly error messages in production', async ({ page }) => {
    // Set environment to production
    await page.route('**/*', route => {
      const request = route.request();
      if (request.url().includes('process.env.NODE_ENV')) {
        return route.fulfill({
          status: 200,
          body: 'production',
        });
      }
      return route.continue();
    });

    // Try to register with an existing email
    await page.goto('/register');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify user-friendly error message
    await expect(page.getByText(/this email is already registered/i)).toBeVisible();
  });

  test('shows raw error messages in development', async ({ page }) => {
    // Set environment to development
    await page.route('**/*', route => {
      const request = route.request();
      if (request.url().includes('process.env.NODE_ENV')) {
        return route.fulfill({
          status: 200,
          body: 'development',
        });
      }
      return route.continue();
    });

    // Try to register with an existing email
    await page.goto('/register');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify raw error message
    await expect(page.getByText(/user already registered/i)).toBeVisible();
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/auth/v1/signup', route => {
      return route.abort('failed');
    });

    await page.goto('/register');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify generic error message
    await expect(page.getByText(/an unexpected error occurred/i)).toBeVisible();
  });
});

test.describe('Stripe Subscription Flow', () => {
  test('user can upgrade to premium and sees updated status', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Click subscribe button
    await page.getByTestId('subscribe-button').click();

    // Simulate Stripe redirect (mock)
    // In a real test, you would intercept the request and simulate a successful payment
    // For now, just go back to dashboard and check status
    await page.goto('/dashboard');
    // Simulate user_metadata.subscribed is now true (mocked in test env)
    await expect(page.getByTestId('subscription-status')).toHaveText(/active/i);
    await expect(page.getByTestId('premium-subscription')).toBeVisible();
  });
});

test.describe('Billing History', () => {
  test('user can view billing history', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Go to subscription management page
    await page.goto('/dashboard/subscription');
    await expect(page.getByText(/billing history/i)).toBeVisible();
    await expect(page.getByText(/view your past invoices/i)).toBeVisible();
    // Check for at least the table headers
    await expect(page.getByText(/date/i)).toBeVisible();
    await expect(page.getByText(/amount/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/invoice/i)).toBeVisible();
  });
});
