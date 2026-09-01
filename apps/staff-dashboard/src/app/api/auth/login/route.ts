import { NextRequest, NextResponse } from 'next/server';
import {
  AuthError,
  SupabaseAuthRepository,
  createAuthService,
} from '@deskatlas/domain';

export const runtime = 'nodejs';

// In-memory rate limiter for login
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const rateLimitKey = `${ip}:${trimmedEmail}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const authRepo = new SupabaseAuthRepository();
    const authService = createAuthService(authRepo);

    const session = await authService.loginStaff(trimmedEmail, password);

    // Verify role is STAFF or ADMIN
    if (session.actor.role !== 'STAFF' && session.actor.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Account is not authorized for staff access' },
        { status: 403 }
      );
    }

    rateLimitMap.delete(rateLimitKey);

    return NextResponse.json({
      user: {
        id: session.actor.id,
        email: session.actor.email,
        role: session.actor.role.toLowerCase(),
        displayName: session.actor.displayName || 'Staff Member',
      },
      token: session.token,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
