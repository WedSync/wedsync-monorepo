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

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const authHeader = request.headers.get('authorization');
    const token = authUtils.extractBearerToken(authHeader) || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const payload = await authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: 'Token has been revoked' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await dbClient.user.findUnique({
      where: { id: payload.userId },
      include: { supplierProfile: true }
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Get user permissions
    const permissions = await authService.getUserPermissions(user.role, user.id);

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions
    };

    return NextResponse.json({ user: authUser });
  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}