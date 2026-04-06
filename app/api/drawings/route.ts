import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      drawing_type,
      geometry,
      properties,
      layer_id,
      is_saved,
    } = body;

    const drawing = await prisma.drawing_data.create({
      data: {
        session_id,
        drawing_type,
        properties: properties || {},
        layer_id: layer_id ? parseInt(layer_id) : null,
        is_saved: is_saved !== undefined ? is_saved : false,
      },
    });

    return NextResponse.json({
      success: true,
      data: drawing,
    });
  } catch (error) {
    console.error('Error creating drawing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create drawing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_id = searchParams.get('user_id');
    const drawing_type = searchParams.get('drawing_type');
    const is_saved = searchParams.get('is_saved');
    const limit = searchParams.get('limit');

    const whereClause: any = {};
    
    if (session_id) {
      whereClause.session_id = session_id;
    }
    
    if (user_id) {
      whereClause.user_id = parseInt(user_id);
    }
    
    if (drawing_type) {
      whereClause.drawing_type = drawing_type;
    }
    
    if (is_saved !== null) {
      whereClause.is_saved = is_saved === 'true';
    }

    const drawings = await prisma.drawing_data.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit ? parseInt(limit) : 50,
    });

    return NextResponse.json({
      success: true,
      data: drawings,
      count: drawings.length,
    });
  } catch (error) {
    console.error('Error fetching drawings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drawings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_saved, properties } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Drawing ID is required' },
        { status: 400 }
      );
    }

    const drawing = await prisma.drawing_data.update({
      where: { id: parseInt(id) },
      data: {
        is_saved: is_saved !== undefined ? is_saved : undefined,
        properties: properties !== undefined ? properties : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: drawing,
    });
  } catch (error) {
    console.error('Error updating drawing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update drawing' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Drawing ID is required' },
        { status: 400 }
      );
    }

    await prisma.drawing_data.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Drawing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting drawing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete drawing' },
      { status: 500 }
    );
  }
}
