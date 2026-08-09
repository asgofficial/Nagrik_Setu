import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/jwt';
import { findUserById } from '@/lib/authStore';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid JWT authentication token' },
        { status: 401 }
      );
    }

    // Refresh fresh profile data if available
    const dbUser = await findUserById(authUser.id);

    const userProfile = {
      id: dbUser?.id || authUser.id,
      email: dbUser?.email || authUser.email,
      name: dbUser?.name || authUser.name,
      role: dbUser?.role || authUser.role,
      phone: dbUser?.phone || authUser.phone,
    };

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /auth/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching session profile' },
      { status: 500 }
    );
  }
}