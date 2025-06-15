import { test, expect } from '@/test/auth.setup';

test.describe('Register Page', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check if the form elements are present
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit without filling the form
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Check for validation messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/register');
    
    // Fill the form with mismatched passwords
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Confirm Password').fill('password456');
    
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Check for password mismatch error
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register');
    
    // Click the login link
    await page.getByRole('link', { name: 'Already have an account? Sign in' }).click();
    
    // Check if we're redirected to the login page
    await expect(page).toHaveURL('/login');
  });
}); 