// Type guard for general error objects
export const isError = (err: unknown): err is Error => {
  return err instanceof Error;
};

// Type guard for Supabase error
const isSupabaseError = (error: unknown): error is { code?: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  );
};

// Get environment-specific error message
export const getErrorMessage = (error: unknown): string => {
  // Handle Supabase API error structure
  if (typeof error === 'object' && error !== null) {
    const supabaseError = (error as { error?: { code?: string } }).error;
    if (supabaseError?.code === '23505') {
      return 'This email is already in use';
    }
  }
  
  // Fallback for non-Supabase errors
  return process.env.NODE_ENV === 'production'
    ? 'Registration failed. Please try again.'
    : error instanceof Error ? error.message : 'Unknown error';
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