import { describe, it, expect, vi } from 'vitest';
import { PATCH } from './route';
import { NextRequest } from 'next/server';
import * as supabaseAuthHelpers from '@supabase/auth-helpers-nextjs';

vi.mock('@supabase/auth-helpers-nextjs');
vi.mock('next/headers');

describe('Profile API Route', () => {
  const supabaseMock = {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(supabaseAuthHelpers.createRouteHandlerClient).mockReturnValue(supabaseMock as any);

  it('should update user profile successfully', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    supabaseMock.auth.updateUser.mockResolvedValue({ error: null });

    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Jane Doe' }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Profile updated successfully');
  });

  it('should return 401 if user is not authenticated', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Unauthorized' },
    });

    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Jane Doe' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });
}); 