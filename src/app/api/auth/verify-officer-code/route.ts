import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Officer code is required' }, { status: 400 });
    }

    const expectedCode = process.env.OFFICER_REGISTRATION_CODE;
    
    if (!expectedCode) {
      console.error('OFFICER_REGISTRATION_CODE is not set in environment variables');
      return NextResponse.json({ valid: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (code !== expectedCode) {
      return NextResponse.json({ valid: false, error: 'Invalid officer code' }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 });
  }
}
