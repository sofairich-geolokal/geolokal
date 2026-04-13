import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock LGU roles data - replace with actual database query
    const lguRoles = [
      'Ibaan',
      'Binangonan', 
      'San Mateo',
      'Antipolo',
      'Taytay',
      'Cainta',
      'Rodriguez'
    ];

    return NextResponse.json({
      success: true,
      roles: lguRoles
    });

  } catch (error) {
    console.error('Error fetching LGU roles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch LGU roles',
        roles: ['Ibaan', 'Binangonan', 'San Mateo'] // Fallback options
      },
      { status: 500 }
    );
  }
}
