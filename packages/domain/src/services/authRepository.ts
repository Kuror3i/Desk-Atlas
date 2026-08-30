import type { AuthActor, AuthSession } from '../models/auth';

export interface AuthRepository {
  verifyStaffLogin(email: string, password: string): Promise<AuthSession>;
  verifySessionToken(token: string): Promise<AuthActor | null>;
  getStaffProfile(userId: string): Promise<AuthActor | null>;
  validateKioskSecret(secret: string): Promise<boolean>;
  generateSignedProofUrl(proofPath: string, expiresInSeconds?: number): Promise<string>;
}
