import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should handle successful login', async ({ page }) => {
    await page.fill('input[name=email]', 'test@example.com');
    await page.fill('input[name=password]', 'securepassword');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name=email]', 'invalid@example.com');
    await page.fill('input[name=password]', 'wrongpassword');
    await page.click('button[type=submit]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.click('text=Forgot your password?');
    await page.fill('input[name=email]', 'test@example.com');
    await page.click('button[type=submit]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should handle registration flow', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name=email]', 'newuser@example.com');
    await page.fill('input[name=password]', 'newpassword123');
    await page.fill('input[name=confirmPassword]', 'newpassword123');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for password mismatch during registration', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name=email]', 'newuser@example.com');
    await page.fill('input[name=password]', 'newpassword123');
    await page.fill('input[name=confirmPassword]', 'differentpassword');
    await page.click('button[type=submit]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // First login
    await page.fill('input[name=email]', 'test@example.com');
    await page.fill('input[name=password]', 'securepassword');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');

    // Then logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to dashboard when accessing auth pages while logged in', async ({
    page,
  }) => {
    // First login
    await page.fill('input[name=email]', 'test@example.com');
    await page.fill('input[name=password]', 'securepassword');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');

    // Try to access login page
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });
});
