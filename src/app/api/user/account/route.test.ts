import { describe, it, expect, vi } from 'vitest';
import { DELETE } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as supabaseAuthHelpers from '@supabase/auth-helpers-nextjs';

vi.mock('@supabase/auth-helpers-nextjs');
vi.mock('@supabase/supabase-js');
vi.mock('next/headers');

describe('Account API Route', () => {
  const supabaseAuthMock = {
    auth: {
      getUser: vi.fn(),
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(supabaseAuthHelpers.createRouteHandlerClient).mockReturnValue(supabaseAuthMock as any);

  const supabaseAdminMock = {
    auth: {
      admin: {
        deleteUser: vi.fn(),
      },
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(createClient).mockReturnValue(supabaseAdminMock as any);

  it('should delete user account successfully', async () => {
    supabaseAuthMock.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    supabaseAdminMock.auth.admin.deleteUser.mockResolvedValue({ error: null });

    const request = new NextRequest('http://localhost/api/user/account', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Account deleted successfully');
  });

  it('should return 401 if user is not authenticated', async () => {
    supabaseAuthMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Unauthorized' },
    });

    const request = new NextRequest('http://localhost/api/user/account', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    expect(response.status).toBe(401);
  });
});
