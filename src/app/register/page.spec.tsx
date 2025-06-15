import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('register-button')).toBeVisible();
    await expect(page.getByTestId('terms-checkbox')).toBeVisible();
  });

  test('should show email validation error', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password123');
    await page.getByTestId('register-button').click();
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText(
      'Please enter a valid email address'
    );
  });

  test('should show password length validation error', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('short');
    await page.getByTestId('confirm-password-input').fill('short');
    await page.getByTestId('register-button').click();
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText(
      'Password must be at least 8 characters long'
    );
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password456');
    await page.getByTestId('register-button').click();
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText('Passwords do not match');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByTestId('login-link').click();
    await expect(page).toHaveURL('/login');
  });

  test('should show error when terms are not accepted', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password123');
    await page.getByTestId('register-button').click();
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText(
      'Please accept the terms and conditions'
    );
  });
});
