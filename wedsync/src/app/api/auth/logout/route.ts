import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@wedsync/utils/auth';
import { createClient } from '@wedsync/database';
import { authUtils } from '@wedsync/utils/auth';

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
    // Get token from cookie or header
    const authHeader = request.headers.get('authorization');
    const token = authUtils.extractBearerToken(authHeader) || 
                  request.cookies.get('auth-token')?.value;

    if (token) {
      // Add token to blacklist
      await authService.logout(token);
    }

    // Clear authentication cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if logout fails, clear cookies
    const response = NextResponse.json({ message: 'Logged out' });
    
    response.cookies.set('auth-token', '', { maxAge: 0 });
    response.cookies.set('refresh-token', '', { maxAge: 0 });

    return response;
  }
}