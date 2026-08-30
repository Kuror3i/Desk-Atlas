import type { AuthActor, AuthSession } from '../models/auth';
import { AuthError, DeactivatedAccountError, UnauthorizedError } from '../models/auth';
import type { AuthRepository } from './authRepository';

export interface InMemoryUserRecord {
  id: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  displayName?: string;
  isActive: boolean;
}

export class InMemoryAuthRepository implements AuthRepository {
  private users: Map<string, InMemoryUserRecord> = new Map();
  private sessions: Map<string, { actor: AuthActor; expiresAt: number }> = new Map();
  private kioskSecret: string = 'test-kiosk-secret-123';

  constructor(initialUsers: InMemoryUserRecord[] = []) {
    for (const u of initialUsers) {
      this.users.set(u.email.toLowerCase(), u);
    }
  }

  seedUser(user: InMemoryUserRecord) {
    this.users.set(user.email.toLowerCase(), user);
  }

  setKioskSecret(secret: string) {
    this.kioskSecret = secret;
  }

  async verifyStaffLogin(email: string, password: string): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = this.users.get(trimmedEmail);

    if (!user || user.password !== password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new DeactivatedAccountError('Account is deactivated or not authorized');
    }

    const actor: AuthActor = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      isActive: user.isActive,
    };

    const token = `da_test_session_${Date.now()}_${user.id}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    this.sessions.set(token, { actor, expiresAt });

    return {
      token,
      actor,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async verifySessionToken(token: string): Promise<AuthActor | null> {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) {
      // In test mode, support mock-token format
      if (token.startsWith('mock-admin-token')) {
        return {
          id: 'admin-1',
          email: 'admin@deskatlas.com',
          role: 'ADMIN',
          displayName: 'Admin User',
          isActive: true,
        };
      }
      if (token.startsWith('mock-staff-token')) {
        return {
          id: 'staff-1',
          email: 'staff@deskatlas.com',
          role: 'STAFF',
          displayName: 'Staff User',
          isActive: true,
        };
      }
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    // Always re-check active status in user record
    const user = Array.from(this.users.values()).find((u) => u.id === session.actor.id);
    if (user && !user.isActive) {
      return null;
    }

    return session.actor;
  }

  async getStaffProfile(userId: string): Promise<AuthActor | null> {
    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      isActive: user.isActive,
    };
  }

  async validateKioskSecret(secret: string): Promise<boolean> {
    return Boolean(secret && secret === this.kioskSecret);
  }

  async generateSignedProofUrl(proofPath: string, expiresInSeconds: number = 300): Promise<string> {
    const token = `sig_${Date.now()}_${expiresInSeconds}`;
    return `https://mock-storage.deskatlas.internal/payment-proofs/${proofPath}?token=${token}&expires_in=${expiresInSeconds}`;
  }
}
