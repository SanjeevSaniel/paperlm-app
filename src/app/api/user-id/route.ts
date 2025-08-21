import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getUserWorkspaceUrl } from '@/lib/authManager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'get_or_create' } = body;

    console.log('User-ID API called with action:', action);
    
    if (action === 'get_or_create') {
      // Get authenticated user data from Clerk
      const authData = await getAuthenticatedUser();
      
      if (!authData) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      console.log('Retrieved authenticated user:', {
        paperlmUserId: authData.paperlmUserId,
        email: authData.email,
        userType: authData.userType
      });
      
      return NextResponse.json({
        success: true,
        paperlmUserId: authData.paperlmUserId,
        userType: authData.userType,
        email: authData.email,
        isAuthenticated: true,
        workspaceUrl: getUserWorkspaceUrl(authData.paperlmUserId)
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('User ID API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get authenticated user data from Clerk
    const authData = await getAuthenticatedUser();
    
    if (!authData) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      paperlmUserId: authData.paperlmUserId,
      userType: authData.userType,
      email: authData.email,
      isAuthenticated: true,
      workspaceUrl: getUserWorkspaceUrl(authData.paperlmUserId)
    });

  } catch (error) {
    console.error('Get user ID error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}