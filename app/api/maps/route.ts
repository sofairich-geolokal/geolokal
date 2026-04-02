import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all saved maps
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let maps;
    if (userId) {
      maps = await prisma.saved_maps.findMany({
        where: { user_id: parseInt(userId) },
        orderBy: { created_at: 'desc' }
      });
    } else {
      maps = await prisma.saved_maps.findMany({
        orderBy: { created_at: 'desc' }
      });
    }
    
    return NextResponse.json({ success: true, maps });
  } catch (error) {
    console.error('Error fetching maps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maps' },
      { status: 500 }
    );
  }
}

// POST - save a new map
export async function POST(request: NextRequest) {
  try {
    const mapData = await request.json();
    
    const savedMap = await prisma.saved_maps.create({
      data: {
        map_name: mapData.name,
        user_id: mapData.userId || null, // Default to guest if no userId provided
        basemap: mapData.basemap,
        layers_config: mapData.layers,
        map_config: mapData.mapView || null,
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      map: savedMap,
      message: 'Map saved successfully to database' 
    });
  } catch (error) {
    console.error('Error saving map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save map to database' },
      { status: 500 }
    );
  }
}

// PUT - update an existing map
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    
    const updatedMap = await prisma.saved_maps.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return NextResponse.json({ 
      success: true, 
      map: updatedMap,
      message: 'Map updated successfully' 
    });
  } catch (error) {
    console.error('Error updating map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update map' },
      { status: 500 }
    );
  }
}

// DELETE - remove a saved map
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Map ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.saved_maps.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Map deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete map' },
      { status: 500 }
    );
  }
}
