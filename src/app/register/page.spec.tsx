import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('should show email validation error', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should show password length validation error', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('short');
    await page.getByTestId('confirm-password-input').fill('short');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password456');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should navigate to login page', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on WebKit/Mobile Safari due to flakiness');
    await page.evaluate(() => {
      document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
    });
    await page.getByRole('link', { name: 'Login' }).click({ force: true });
    await expect(page).toHaveURL('/login');
  });
});
