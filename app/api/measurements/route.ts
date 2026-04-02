import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      measurement_type,
      measurement_value,
      unit,
      coordinates,
      layer_id,
    } = body;

    const measurement = await prisma.measurement_data.create({
      data: {
        session_id,
        measurement_type,
        measurement_value: measurement_value ? parseFloat(measurement_value) : null,
        unit: unit || 'meters',
        coordinates: coordinates || [],
        layer_id: layer_id ? parseInt(layer_id) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create measurement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_id = searchParams.get('user_id');
    const measurement_type = searchParams.get('measurement_type');
    const limit = searchParams.get('limit');

    const whereClause: any = {};
    
    if (session_id) {
      whereClause.session_id = session_id;
    }
    
    if (user_id) {
      whereClause.user_id = parseInt(user_id);
    }
    
    if (measurement_type) {
      whereClause.measurement_type = measurement_type;
    }

    const measurements = await prisma.measurement_data.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit ? parseInt(limit) : 50,
    });

    return NextResponse.json({
      success: true,
      data: measurements,
      count: measurements.length,
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}
