import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/authStore';
import { signJwtToken, AUTH_COOKIE_NAME } from '@/lib/jwt';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['citizen', 'officer', 'admin']).default('citizen'),
  officerCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role, officerCode } = parsed.data;

    // Verify officer registration code if officer role is selected
    if (role === 'officer') {
      const expectedCode = process.env.OFFICER_REGISTRATION_CODE || 'JANSETU_OFFICER_2026';
      if (!officerCode || officerCode.trim() !== expectedCode.trim()) {
        return NextResponse.json(
          { error: 'Invalid Authority Verification Code. Please check the code provided by your municipality.' },
          { status: 403 }
        );
      }
    }

    // Create user with hashed password
    const user = await createUser({
      name,
      email,
      password,
      phone,
      role,
    });

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };

    const token = await signJwtToken(tokenPayload, '7d');

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: tokenPayload,
        token,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[API /auth/register] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during registration' },
      { status: 400 }
    );
  }
}
