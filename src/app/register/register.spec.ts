import { test, expect } from '@/test/auth.setup';

test.describe('Register Page', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check if the form elements are present
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('register-button')).toBeVisible();
    await expect(page.getByTestId('terms-checkbox')).toBeVisible();
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit without filling the form
    await page.getByTestId('register-button').click();
    
    // Check for validation messages
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText('Please enter a valid email address');
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/register');
    
    // Fill the form with mismatched passwords
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password456');
    
    await page.getByTestId('register-button').click();
    
    // Check for password mismatch error
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText('Passwords do not match');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register');
    
    // Click the login link
    await page.getByTestId('login-link').click();
    
    // Check if we're redirected to the login page
    await expect(page).toHaveURL('/login');
  });

  test('should show error when terms are not accepted', async ({ page }) => {
    await page.goto('/register');
    
    // Fill the form with valid data but don't accept terms
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('password123');
    
    await page.getByTestId('register-button').click();
    
    // Check for terms acceptance error
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText('Please accept the terms and conditions');
  });

  test('should show error for short password', async ({ page }) => {
    await page.goto('/register');
    
    // Fill the form with a short password
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('short');
    await page.getByTestId('confirm-password-input').fill('short');
    await page.getByTestId('terms-checkbox').check();
    
    await page.getByTestId('register-button').click();
    
    // Check for password length error
    await expect(page.getByTestId('registration-error')).toBeVisible();
    await expect(page.getByTestId('registration-error')).toContainText('Password must be at least 8 characters long');
  });
}); 