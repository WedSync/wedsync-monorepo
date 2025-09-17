import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@wedsync/utils/auth';
import { createClient } from '@wedsync/database';

const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
  tokenExpiry: 3600, // 1 hour
  refreshTokenExpiry: 604800, // 1 week
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 15, // minutes
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Create database client
    const dbClient = createClient();
    
    // Create auth service
    const authService = new AuthService(authConfig, dbClient);
    
    // Request password reset
    await authService.requestPasswordReset(email);
    
    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, you will receive password reset instructions.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    
    // Don't reveal specific errors to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, you will receive password reset instructions.'
    });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}