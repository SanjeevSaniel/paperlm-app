import { testNeonConnection } from '@/lib/neon';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing NeonDB connection...');
    const isConnected = await testNeonConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'NeonDB connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'NeonDB connection failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('NeonDB test error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}