import { NextResponse } from 'next/server';
import { getAuthUser, getUserData } from '@/lib/auth';

export async function GET() {
  try {
    // Get user ID from auth token
    const userId = await getAuthUser();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const user = await getUserData(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      lgu_id: user.lgu_id,
      lgu_name: user.lgu_name
    });

  } catch (error: any) {
    console.error('Auth Me Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to get user data' }, 
      { status: 500 }
    );
  }
}
