import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    const whereClause: any = {};
    
    if (userId) {
      whereClause.user_id = parseInt(userId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    const exportHistory = await prisma.export_request.findMany({
      where: whereClause,
      orderBy: {
        requested_at: 'desc',
      },
      take: limit ? parseInt(limit) : 20,
    });

    return NextResponse.json({
      success: true,
      data: exportHistory,
    });
  } catch (error) {
    console.error('Export history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch export history' },
      { status: 500 }
    );
  }
}
