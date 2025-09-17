import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@wedsync/utils/auth';
import { createClient } from '@wedsync/database';

// Initialize auth service
const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  tokenExpiry: 3600, // 1 hour
  refreshTokenExpiry: 86400 * 7, // 7 days
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 30 // 30 minutes
};

const dbClient = createClient();
const authService = new AuthService(authConfig, dbClient);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phoneNumber } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Register user
    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: 'supplier', // WedSync is for suppliers
      phoneNumber
    });

    // Set secure HTTP-only cookie with the token
    const response = NextResponse.json({
      user: result.user,
      token: result.token
    });

    response.cookies.set('auth-token', result.token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.token.expiresIn
    });

    response.cookies.set('refresh-token', result.token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: authConfig.refreshTokenExpiry
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = errorMessage.includes('already exists') ? 409 : 
                      errorMessage.includes('validation') ? 400 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}