import type { AuthActor, AuthSession } from '../models/auth';
import {
  AuthError,
  DeactivatedAccountError,
  ForbiddenError,
  UnauthorizedError,
} from '../models/auth';
import type { AuthRepository } from './authRepository';

export interface RequestAuthContext {
  headers?: {
    get(name: string): string | null;
  } | Record<string, string | string[] | undefined>;
  cookies?: {
    get(name: string): { value: string } | string | undefined;
  } | Record<string, string | undefined>;
}

export function createAuthService(repository: AuthRepository) {
  return {
    async loginStaff(email: string, password: string): Promise<AuthSession> {
      return repository.verifyStaffLogin(email, password);
    },

    async authenticateRequest(context: RequestAuthContext): Promise<AuthActor | null> {
      let token: string | null = null;

      // 1. Extract from Authorization header
      if (context.headers) {
        let authHeader: string | null = null;
        if (typeof (context.headers as any).get === 'function') {
          authHeader = (context.headers as any).get('authorization') || (context.headers as any).get('Authorization');
        } else {
          const raw = (context.headers as any)['authorization'] || (context.headers as any)['Authorization'];
          authHeader = Array.isArray(raw) ? raw[0] : (raw || null);
        }

        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        }

        if (!token) {
          // Check x-session-token or x-actor-user-id fallback
          let sessionHeader: string | null = null;
          if (typeof (context.headers as any).get === 'function') {
            sessionHeader = (context.headers as any).get('x-session-token');
          } else {
            const raw = (context.headers as any)['x-session-token'];
            sessionHeader = Array.isArray(raw) ? raw[0] : (raw || null);
          }
          if (sessionHeader) {
            token = sessionHeader.trim();
          }
        }
      }

      // 2. Extract from cookies if token not found
      if (!token && context.cookies) {
        if (typeof (context.cookies as any).get === 'function') {
          const c = (context.cookies as any).get('da_token') || (context.cookies as any).get('sb-access-token');
          token = typeof c === 'object' ? c?.value : c;
        } else {
          token = (context.cookies as any)['da_token'] || (context.cookies as any)['sb-access-token'] || null;
        }
      }

      if (!token) {
        return null;
      }

      const actor = await repository.verifySessionToken(token);
      if (!actor || !actor.isActive) {
        return null;
      }

      return actor;
    },

    async requireAdmin(contextOrActor: RequestAuthContext | AuthActor | null): Promise<AuthActor> {
      let actor: AuthActor | null = null;
      if (!contextOrActor) {
        throw new UnauthorizedError('Authentication required');
      }

      if ('role' in contextOrActor && 'id' in contextOrActor) {
        actor = contextOrActor as AuthActor;
      } else {
        actor = await this.authenticateRequest(contextOrActor as RequestAuthContext);
      }

      if (!actor) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!actor.isActive) {
        throw new DeactivatedAccountError('Account is deactivated or not authorized');
      }

      if (actor.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }

      return actor;
    },

    async requireStaffOrAdmin(contextOrActor: RequestAuthContext | AuthActor | null): Promise<AuthActor> {
      let actor: AuthActor | null = null;
      if (!contextOrActor) {
        throw new UnauthorizedError('Staff authentication required');
      }

      if ('role' in contextOrActor && 'id' in contextOrActor) {
        actor = contextOrActor as AuthActor;
      } else {
        actor = await this.authenticateRequest(contextOrActor as RequestAuthContext);
      }

      if (!actor) {
        throw new UnauthorizedError('Staff authentication required');
      }

      if (!actor.isActive) {
        throw new DeactivatedAccountError('Account is deactivated or not authorized');
      }

      if (actor.role !== 'ADMIN' && actor.role !== 'STAFF') {
        throw new ForbiddenError('Staff or Admin access required');
      }

      return actor;
    },

    async validateKioskContext(context: RequestAuthContext): Promise<boolean> {
      let kioskSecret: string | null = null;
      if (context.headers) {
        if (typeof (context.headers as any).get === 'function') {
          kioskSecret = (context.headers as any).get('x-kiosk-secret');
        } else {
          const raw = (context.headers as any)['x-kiosk-secret'];
          kioskSecret = Array.isArray(raw) ? raw[0] : (raw || null);
        }
      }

      return repository.validateKioskSecret(kioskSecret || '');
    },

    async getSignedPaymentProofUrl(actor: AuthActor, proofPath: string, expiresInSeconds?: number): Promise<string> {
      if (!actor || actor.role !== 'ADMIN' || !actor.isActive) {
        throw new ForbiddenError('Only active Admin accounts may access payment proof storage');
      }
      return repository.generateSignedProofUrl(proofPath, expiresInSeconds);
    },
  };
}
