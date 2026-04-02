import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test endpoint called');
    const testData = [
      { label: 'Test', value: 1, percentage: 100 }
    ];
    console.log('Returning test data:', JSON.stringify(testData));
    return NextResponse.json(testData);
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json([]);
  }
}
