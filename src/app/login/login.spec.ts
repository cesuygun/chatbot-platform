import { test, expect } from '@/test/auth.setup';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the page to load and check if the form elements are present
    await page.waitForSelector('[data-testid="email-input"]');
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the form to be ready
    await page.waitForSelector('[data-testid="email-input"]');
    
    // Fill the form with invalid email
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();
    
    // Check for validation message
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText('Please enter a valid email address');
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the form to be ready
    await page.waitForSelector('[data-testid="email-input"]');
    
    // Fill the form with short password
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('short');
    await page.getByTestId('login-button').click();
    
    // Check for validation message
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText('Password must be at least 8 characters long');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="register-link"]');
    
    // Click the register link
    await page.getByTestId('register-link').click();
    
    // Check if we're redirected to the register page
    await expect(page).toHaveURL('/register');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the form to be ready
    await page.waitForSelector('[data-testid="email-input"]');
    
    // Fill the form with invalid credentials
    await page.getByTestId('email-input').fill('wrong@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-button').click();
    
    // Check for error message - wait for it to appear
    await page.waitForSelector('[data-testid="login-error"]');
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText('Invalid login credentials');
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the form to be ready
    await page.waitForSelector('[data-testid="email-input"]');
    
    // Fill the form with valid credentials
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();
    
    // Wait for redirect to happen (this might take a moment due to auth state loading)
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Check if we're redirected to the dashboard
    await expect(page).toHaveURL('/dashboard');
  });
}); 