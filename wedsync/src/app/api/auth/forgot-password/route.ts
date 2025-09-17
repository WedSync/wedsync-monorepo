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
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Request password reset
    await authService.requestPasswordReset(email);

    // Always return success for security reasons
    // (don't reveal if email exists or not)
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Always return success for security reasons
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  }
}