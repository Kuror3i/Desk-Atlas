import type { AuthActor, AuthSession } from '../models/auth';
import { AuthError, DeactivatedAccountError, UnauthorizedError } from '../models/auth';
import type { AuthRepository } from './authRepository';

export interface SupabaseAuthConfig {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  anonKey?: string;
  kioskSecret?: string;
}

export class SupabaseAuthRepository implements AuthRepository {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly anonKey: string;
  private readonly kioskSecret: string;

  constructor(config: SupabaseAuthConfig = {}) {
    this.supabaseUrl = (
      config.supabaseUrl ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      ''
    ).replace(/\/$/, '');
    this.serviceRoleKey = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.anonKey =
      config.anonKey ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      this.serviceRoleKey;
    this.kioskSecret =
      config.kioskSecret ||
      process.env.KIOSK_SECRET ||
      process.env.NEXT_PUBLIC_KIOSK_SECRET ||
      '';
  }

  async verifyStaffLogin(email: string, password: string): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new AuthError('Server authentication service configuration missing', 500);
    }

    // 1. Try secure database RPC verify_staff_login
    try {
      const rpcRes = await fetch(`${this.supabaseUrl}/rest/v1/rpc/verify_staff_login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
        },
        body: JSON.stringify({
          p_email: trimmedEmail,
          p_password: password,
        }),
      });

      if (rpcRes.ok) {
        const result = await rpcRes.json();
        if (result.success && result.user) {
          const roleUpper = String(result.user.role || '').toUpperCase() as 'ADMIN' | 'STAFF';
          const actor: AuthActor = {
            id: result.user.id,
            email: result.user.email,
            role: roleUpper === 'ADMIN' ? 'ADMIN' : 'STAFF',
            displayName: result.user.displayName || result.user.display_name,
            isActive: true,
          };
          const token = `da_session_${Date.now()}_${result.user.id}`;
          return {
            token,
            actor,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          };
        } else if (result.error?.toLowerCase().includes('deactivated')) {
          throw new DeactivatedAccountError('Account is deactivated or not authorized');
        } else {
          throw new UnauthorizedError(result.error || 'Invalid email or password');
        }
      }
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
    }

    // 2. Fallback: GoTrue token exchange + staff_profiles verification
    const authRes = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.anonKey,
      },
      body: JSON.stringify({
        email: trimmedEmail,
        password,
      }),
    });

    if (!authRes.ok) {
      const authErr = await authRes.json().catch(() => ({}));
      throw new UnauthorizedError(
        authErr.error_description || authErr.msg || 'Invalid email or password'
      );
    }

    const authData = await authRes.json();
    const userId = authData.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication failed');
    }

    const profile = await this.getStaffProfile(userId);
    if (!profile || !profile.isActive) {
      throw new DeactivatedAccountError('Account is not authorized or is deactivated');
    }

    return {
      token: authData.access_token,
      actor: profile,
      expiresAt: new Date(Date.now() + (authData.expires_in || 3600) * 1000).toISOString(),
    };
  }

  async verifySessionToken(token: string): Promise<AuthActor | null> {
    if (!token) return null;

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      return null;
    }

    // If it's a test/synthetic token format
    if (token.startsWith('da_session_') || token.startsWith('da_test_session_')) {
      const parts = token.split('_');
      const userId = parts[parts.length - 1];
      if (userId) {
        return this.getStaffProfile(userId);
      }
      return null;
    }

    // Otherwise verify with Supabase Auth /auth/v1/user
    try {
      const res = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return null;
      const userData = await res.json();
      if (!userData?.id) return null;

      return this.getStaffProfile(userData.id);
    } catch {
      return null;
    }
  }

  async getStaffProfile(userId: string): Promise<AuthActor | null> {
    if (!this.supabaseUrl || !this.serviceRoleKey || !userId) {
      return null;
    }

    try {
      const res = await fetch(
        `${this.supabaseUrl}/rest/v1/staff_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
        {
          headers: {
            apikey: this.serviceRoleKey,
            Authorization: `Bearer ${this.serviceRoleKey}`,
          },
          cache: 'no-store',
        }
      );

      if (!res.ok) return null;
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return null;

      const p = rows[0];
      const roleUpper = String(p.role || '').toUpperCase() as 'ADMIN' | 'STAFF';

      return {
        id: p.user_id,
        email: p.email || '',
        role: roleUpper === 'ADMIN' ? 'ADMIN' : 'STAFF',
        displayName: p.display_name,
        isActive: Boolean(p.is_active),
      };
    } catch {
      return null;
    }
  }

  async validateKioskSecret(secret: string): Promise<boolean> {
    if (!this.kioskSecret) {
      // If no kiosk secret is configured on server, accept default internal kiosk context
      return true;
    }
    return Boolean(secret && secret === this.kioskSecret);
  }

  async generateSignedProofUrl(proofPath: string, expiresInSeconds: number = 300): Promise<string> {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new AuthError('Storage service configuration missing', 500);
    }

    const cleanPath = proofPath.replace(/^\/+/, '');
    const res = await fetch(
      `${this.supabaseUrl}/storage/v1/object/sign/payment-proofs/${cleanPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
        },
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to generate signed URL for payment proof: ${err}`);
    }

    const data = await res.json();
    const signedUrl = data.signedURL || data.signedUrl;
    if (!signedUrl) {
      throw new Error('Storage did not return a signed URL');
    }

    return `${this.supabaseUrl}/storage/v1${signedUrl}`;
  }
}
