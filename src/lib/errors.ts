import { AuthError } from '@supabase/supabase-js';

// Type guard for AuthError
export const isAuthError = (err: unknown): err is AuthError => {
  return typeof err === 'object' && err !== null && 'message' in err;
};

// Type guard for general error objects
export const isError = (err: unknown): err is Error => {
  return err instanceof Error;
};

// Type guard for Supabase error
export const isSupabaseError = (err: unknown): err is { message: string; status: number; code?: string } => {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { message?: unknown; status?: unknown; code?: unknown };
  return typeof e.message === 'string' && typeof e.status === 'number';
};

// Get environment-specific error message
export const getErrorMessage = (error: unknown): string => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    if (isSupabaseError(error) && error.code === '23505') {
      return 'This email is already in use';
    }
    return 'Registration failed. Please try again.';
  }
  return String(error);
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