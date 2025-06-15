// Type guard for general error objects
export const isError = (err: unknown): err is Error => {
  return err instanceof Error;
};

// Get environment-specific error message
export const getErrorMessage = (error: unknown, operation: 'login' | 'register' = 'register'): string => {
  // Handle duplicate email error
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === '23505') {
      return 'This email is already in use';
    }
  }

  // Handle user already registered error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message === 'User already registered') {
      return 'This email is already registered. Please try logging in instead.';
    }
    if (message === 'Invalid credentials') {
      return 'Invalid credentials';
    }
  }

  // Return environment-specific error message
  return process.env.NODE_ENV === 'production'
    ? `${operation === 'login' ? 'Login' : 'Registration'} failed. Please try again.`
    : error instanceof Error
    ? error.message
    : `An error occurred during ${operation}`;
};

// Common error types for auth operations
export type AuthOperationError = {
  type: 'auth';
  message: string;
  originalError?: unknown;
};

// Create a typed error object
export const createAuthError = (error: unknown, operation: 'login' | 'register' = 'register'): AuthOperationError => ({
  type: 'auth',
  message: getErrorMessage(error, operation),
  originalError: error,
});
