export type AuthRole = 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'KIOSK';

export interface AuthActor {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  displayName?: string;
  isActive: boolean;
}

export interface AuthSession {
  token: string;
  actor: AuthActor;
  expiresAt: string;
}

export class AuthError extends Error {
  constructor(message: string, public readonly statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class DeactivatedAccountError extends AuthError {
  constructor(message: string = 'Account is deactivated or not authorized') {
    super(message, 403);
    this.name = 'DeactivatedAccountError';
  }
}
