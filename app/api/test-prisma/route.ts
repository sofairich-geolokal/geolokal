import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Testing Prisma connection...');
    
    // Simple test query
    const result = await prisma.$queryRaw<Array<{user_count: number}>>`SELECT COUNT(*) as user_count FROM users`;
    
    console.log('Prisma test result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Prisma connection test',
      userCount: result[0]?.user_count || 0
    });
    
  } catch (error: any) {
    console.error('Prisma connection error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
