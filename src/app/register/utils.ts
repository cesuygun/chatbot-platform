import { REDIRECT_TIMEOUT_MS } from './constants';

// Check if we're in a test environment (Vitest sets NODE_ENV to 'test')
const isTestEnvironment = process.env.NODE_ENV === 'test';

// For testing - direct access to modify the setTimeout function
export const redirectWithTimeout = (callback: () => void) => {
  // In test environment, execute callback immediately
  if (isTestEnvironment) {
    callback();
    return;
  }

  // In production, use normal setTimeout
  setTimeout(callback, REDIRECT_TIMEOUT_MS);
};
