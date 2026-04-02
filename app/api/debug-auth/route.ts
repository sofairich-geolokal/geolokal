import { NextResponse } from 'next/server';
import { login } from '@/app/actions/auth';

export async function POST(request: Request) {
  try {
    const { username, password, selectedCityId } = await request.json();
    
    console.log('Debug auth - Input:', { username, password, selectedCityId });
    
    // Call the login function
    const result = await login(username, password, selectedCityId, 'viewer');
    
    console.log('Debug auth - Result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      debug: true,
      input: { username, password: '***', selectedCityId },
      result: result
    });

  } catch (error: any) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      debug: true,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
