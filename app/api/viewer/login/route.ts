import { NextResponse } from 'next/server';
import { login } from '@/app/actions/auth';

export async function POST(request: Request) {
  try {
    const { username, password, selectedCityId } = await request.json();
    
    console.log('🔍 LOGIN API: Received request:', { username, password: '***', selectedCityId });

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Attempt login with viewer target
    console.log('🔍 LOGIN API: Calling auth.login...');
    const result = await login(username, password, selectedCityId, 'viewer');
    console.log('🔍 LOGIN API: Auth result:', JSON.stringify(result, null, 2));

    // Check if user exists and has viewer role
    if (result.success && result.user) {
      // Verify user role is 'viewer' (case insensitive)
      if (result.user.role.toLowerCase() !== 'viewer') {
        return NextResponse.json(
          { success: false, error: 'Access denied. Viewer role required.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: result.user
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Viewer login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
