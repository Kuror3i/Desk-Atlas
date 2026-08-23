import request from 'supertest';
import { createApp } from '../src/server.js';
import { strict as assert } from 'assert';

describe('POST /admin/create-staff', () => {
  it('creates staff using injected supabase client and dev header', async () => {
    process.env.ALLOW_DEV_AUTH_HEADER = 'true';
    // Mock supabase client that returns a Promise-resolving result similar to real client
    const mockSupabase = {
      from: () => ({
        insert: (payload) => ({
          select: () => ({
            limit: async () => ({ data: [{ staff_account_id: 'mock-id', display_name: payload[0].display_name, role: payload[0].role, auth_user_id: payload[0].auth_user_id }], error: null }),
          }),
        }),
      }),
    };

    const app = createApp({ supabaseClient: mockSupabase, fetchUserFn: async () => ({ id: 'real-uid' }) });

    const res = await request(app)
      .post('/admin/create-staff')
      .set('x-dev-auth-uid', 'dev-user-123')
      .send({ role: 'staff', display_name: 'Test Staff' });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.user.display_name, 'Test Staff');
  });
});
