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
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      partnerEmail,
      weddingDate,
      role = 'couple' 
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }

    // Create database client
    const dbClient = createClient();
    
    // Create auth service
    const authService = new AuthService(authConfig, dbClient);
    
    // Register user
    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber: undefined
    });

    // If this is a couple signup, create initial wedding record
    let wedding = null;
    if (role === 'couple' && (weddingDate || partnerEmail)) {
      try {
        const weddingData: any = {
          title: `${firstName} & Partner's Wedding`,
          partnerOneId: result.user.id,
          status: 'planning',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        if (weddingDate) {
          weddingData.weddingDate = new Date(weddingDate);
        }

        wedding = await dbClient.wedding.create({
          data: weddingData,
          include: {
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

        // If partner email provided, send invitation
        if (partnerEmail) {
          // TODO: Implement partner invitation email
          // await emailService.sendPartnerInvitation(partnerEmail, wedding.id, result.user);
        }
      } catch (weddingError) {
        // Log wedding creation error but don't fail the signup
        console.error('Wedding creation error:', weddingError);
      }
    }

    // Return authentication response
    return NextResponse.json({
      access_token: result.token.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: firstName,
        lastName: lastName,
        role: result.user.role,
        status: result.user.status,
        avatar: null,
        lastLoginAt: null
      },
      weddings: wedding ? [{
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
      }] : []
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { message: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: 'An error occurred during signup' },
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