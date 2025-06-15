import { REDIRECT_TIMEOUT_MS } from './constants';

/**
 * Checks if the current environment is a test environment
 * @returns {boolean} True if in test environment, false otherwise
 */
const isTestEnvironment = process.env.NODE_ENV === 'test';

/**
 * Executes a callback function after a timeout, with special handling for test environments
 * @param {() => void} callback - The function to execute after the timeout
 */
export const redirectWithTimeout = (callback: () => void): void => {
  // In test environment, execute callback immediately
  if (isTestEnvironment) {
    callback();
    return;
  }

  // In production, use normal setTimeout
  setTimeout(callback, REDIRECT_TIMEOUT_MS);
};
