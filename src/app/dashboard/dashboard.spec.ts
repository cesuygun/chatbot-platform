import { test, expect } from '@/test/auth.setup';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard content', async ({ page }) => {
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('create-bot-button')).toBeVisible();
  });

  test('should create a new bot', async ({ page }) => {
    await page.getByTestId('create-bot-button').click();
    await page.getByTestId('bot-name-input').fill('Test Bot');
    await page.getByTestId('bot-description-input').fill('Test Description');
    await page.getByTestId('create-bot-submit').click();
    
    // Wait for the new bot to appear in the list
    await expect(page.getByText('Test Bot')).toBeVisible();
  });

  test('should delete a bot', async ({ page }) => {
    // First create a bot
    await page.getByTestId('create-bot-button').click();
    await page.getByTestId('bot-name-input').fill('Bot to Delete');
    await page.getByTestId('bot-description-input').fill('Will be deleted');
    await page.getByTestId('create-bot-submit').click();
    
    // Wait for the bot to appear and then delete it
    await expect(page.getByText('Bot to Delete')).toBeVisible();
    await page.getByTestId('delete-bot-button').first().click();
    await page.getByTestId('confirm-delete-button').click();
    
    // Verify the bot is removed
    await expect(page.getByText('Bot to Delete')).not.toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    // Clear authentication state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should show embed code dialog and copy embed code', async ({ page }) => {
    // Create a bot first
    await page.getByTestId('create-bot-button').click();
    await page.getByTestId('bot-name-input').fill('Embed Bot');
    await page.getByTestId('create-bot-submit').click();
    await expect(page.getByText('Embed Bot')).toBeVisible();

    // Open embed code dialog
    await page.getByTestId('embed-bot-button-').click(); // Use partial match if dynamic id
    await expect(page.getByTestId('embed-code-textarea')).toBeVisible();

    // Click copy button
    await page.getByTestId('copy-embed-code-button').click();
    await expect(page.getByTestId('copy-embed-code-button')).toHaveText(/copied/i);

    // Close dialog
    await page.getByTestId('close-embed-dialog-button').click();
    await expect(page.getByTestId('embed-code-textarea')).not.toBeVisible();
  });
}); 