import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'officer' | 'admin';
  phone?: string;
  [key: string]: unknown;
}

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'nagriksetu_super_secure_jwt_secret_token_key_2026_prod';

export const AUTH_COOKIE_NAME = 'nagriksetu_auth_token';

/**
 * Signs a new JWT token for an authenticated user.
 */
export async function signJwtToken(payload: AuthUserPayload, expiresIn: string = '7d'): Promise<string> {
  return sign(
    { ...payload },
    JWT_SECRET_STRING,
    {
      algorithm: 'HS256',
      expiresIn,
      issuer: 'nagriksetu:auth'
    }
  );
}

/**
 * Verifies and decodes a JWT token. Returns null if invalid or expired.
 */
export async function verifyJwtToken(token: string): Promise<AuthUserPayload | null> {
  if (!token) return null;
  try {
    const decoded = verify(token, JWT_SECRET_STRING, {
      issuer: 'nagriksetu:auth'
    });
    return decoded as AuthUserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts JWT token from request cookies or Authorization header.
 */
export function getAuthTokenFromRequest(request: Request | NextRequest): string | null {
  // 1. Check Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Check HTTP-only Cookie
  if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
    const cookie = (request as NextRequest).cookies.get(AUTH_COOKIE_NAME);
    if (cookie?.value) return cookie.value;
  }

  // 3. Check Cookie header string
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Convenience helper to verify request and get user payload directly.
 */
export async function getAuthUserFromRequest(request: Request | NextRequest): Promise<AuthUserPayload | null> {
  const token = getAuthTokenFromRequest(request);
  if (!token) return null;
  return verifyJwtToken(token);
}
