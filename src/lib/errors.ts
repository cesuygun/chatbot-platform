// Type guard for general error objects
export const isError = (err: unknown): err is Error => {
  return err instanceof Error;
};

// Type guard for Supabase error
const isSupabaseError = (error: unknown): error is { code: string; message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
};

// Get environment-specific error message
export const getErrorMessage = (error: unknown): string => {
  if (isSupabaseError(error) && error.code === '23505') {
    return 'This email is already in use';
  }
  return process.env.NODE_ENV === 'production'
    ? 'Registration failed'
    : String(error);
};

// Common error types for auth operations
export type AuthOperationError = {
  type: 'auth';
  message: string;
  originalError?: unknown;
};

// Create a typed error object
export const createAuthError = (error: unknown): AuthOperationError => ({
  type: 'auth',
  message: getErrorMessage(error),
  originalError: error,
}); 