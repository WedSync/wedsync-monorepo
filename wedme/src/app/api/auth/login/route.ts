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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create database client
    const dbClient = createClient();
    
    // Create auth service
    const authService = new AuthService(authConfig, dbClient);
    
    // Authenticate user
    const result = await authService.login({ email, password });
    
    // Get user's weddings for WedMe context
    const weddings = await dbClient.wedding.findMany({
      where: {
        OR: [
          { partnerOneId: result.user.id },
          { partnerTwoId: result.user.id }
        ]
      },
      include: {
        venue: true,
        partnerOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        partnerTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Return authentication response matching WedMe API contract
    return NextResponse.json({
      access_token: result.token.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        role: result.user.role,
        status: result.user.status,
        avatar: result.user.avatar,
        lastLoginAt: result.user.lastLoginAt
      },
      weddings: weddings.map(wedding => ({
        id: wedding.id,
        title: wedding.title,
        weddingDate: wedding.weddingDate,
        status: wedding.status,
        guestCountEstimated: wedding.guestCountEstimated,
        theme: wedding.theme,
        partnerOne: wedding.partnerOne,
        partnerTwo: wedding.partnerTwo,
        ceremonyVenue: wedding.ceremonyVenue,
        receptionVenue: wedding.receptionVenue,
        createdAt: wedding.createdAt,
        updatedAt: wedding.updatedAt
      }))
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials')) {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        );
      }
      if (error.message.includes('Account is')) {
        return NextResponse.json(
          { message: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('temporarily locked')) {
        return NextResponse.json(
          { message: 'Account temporarily locked due to too many failed attempts' },
          { status: 423 }
        );
      }
    }

    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}