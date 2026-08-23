import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

export function createApp({ supabaseClient, fetchUserFn } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = supabaseClient || (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null);

  async function fetchUser(token) {
    if (fetchUserFn) return fetchUserFn(token);
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured');
    const userResp = await fetch(`${SUPABASE_URL.replace(/\/+$/,'')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) throw new Error('Invalid access token');
    return userResp.json();
  }

  app.post('/admin/create-staff', async (req, res) => {
    try {
      // Dev helper: allow injecting auth uid via header when ALLOW_DEV_AUTH_HEADER=true
      const devHeader = req.headers['x-dev-auth-uid'];
      let authUserId = undefined;
      if (devHeader && process.env.ALLOW_DEV_AUTH_HEADER === 'true') {
        authUserId = String(devHeader);
      } else {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Missing user access token in Authorization header' });
        const userInfo = await fetchUser(token);
        authUserId = userInfo?.id;
        if (!authUserId) return res.status(400).json({ error: 'Unable to determine user id from token' });
      }

      if (!supabase) return res.status(500).json({ error: 'Supabase service not configured' });

      const { role = 'staff', display_name } = req.body;
      const payload = { auth_user_id: authUserId, role, display_name };

      const { data, error } = await supabase.from('staff_accounts').insert([payload]).select('*').limit(1);
      if (error) return res.status(500).json({ error: error.message || error });
      return res.json({ ok: true, user: Array.isArray(data) ? data[0] : data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err) });
    }
  });

  return app;
}

// If run directly, start the server using env-provided supabase client
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
