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
