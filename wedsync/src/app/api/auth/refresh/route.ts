import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@wedsync/utils/auth';
import { createClient } from '@wedsync/database';

// Initialize auth service
const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  tokenExpiry: 3600,
  refreshTokenExpiry: 86400 * 7,
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 30
};

const dbClient = createClient();
const authService = new AuthService(authConfig, dbClient);

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Refresh the access token
    const newToken = await authService.refreshToken(refreshToken);

    // Set new access token in cookie
    const response = NextResponse.json({
      token: newToken
    });

    response.cookies.set('auth-token', newToken.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: newToken.expiresIn
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
    
    // Clear invalid tokens
    const response = NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );

    response.cookies.set('auth-token', '', { maxAge: 0 });
    response.cookies.set('refresh-token', '', { maxAge: 0 });

    return response;
  }
}