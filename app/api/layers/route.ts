import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lguId = searchParams.get('lguId');
    const visible = searchParams.get('visible');

    const whereClause: any = {};
    
    if (category) {
      whereClause.category_id = parseInt(category);
    }
    
    if (lguId) {
      whereClause.lgu_id = parseInt(lguId);
    }
    
    if (visible !== null) {
      whereClause.is_visible = visible === 'true';
    }

    const layers = await prisma.map_layers.findMany({
      where: whereClause,
      include: {
        project_categories: true,
        city_muni_master: true,
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [
        { z_index: 'asc' },
        { layer_name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: layers,
      count: layers.length,
    });
  } catch (error) {
    console.error('Error fetching layers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      layer_name, // Received from frontend
      lgu_id,
      category_id,
      layer_type,
      metadata,
      style_config,
      bbox,
      projection,
      min_zoom,
      max_zoom,
      attribution,
      opacity,
      z_index,
      is_visible,
      is_downloadable,
    } = body;

    const data: any = {
      name: layer_name, // Fixed: mapping frontend 'layer_name' to DB 'name'
      layer_type,
      metadata,
      style_config,
      projection: projection || 'EPSG:4326',
      min_zoom: min_zoom ? parseInt(min_zoom) : 0,
      max_zoom: max_zoom ? parseInt(max_zoom) : 20,
      opacity: opacity ? parseFloat(opacity) : 1.0,
      z_index: z_index ? parseInt(z_index) : 0,
      is_visible: is_visible !== undefined ? is_visible : true,
      is_downloadable: is_downloadable !== undefined ? is_downloadable : false,
    };

    if (lgu_id !== undefined && lgu_id !== null && lgu_id !== '') {
      data.lgu_id = parseInt(lgu_id);
    }
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      data.category_id = parseInt(category_id);
    }
    if (bbox) {
      data.bbox = bbox;
    }
    if (attribution) {
      data.attribution = attribution;
    }

    const layer = await prisma.map_layers.create({
      data,
      include: {
        project_categories: true,
        city_muni_master: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: layer,
    });
  } catch (error) {
    console.error('Error creating layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create layer', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, layer_name, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Layer ID is required' },
        { status: 400 }
      );
    }

    // Map layer_name if provided
    if (layer_name) {
      (updateData as any).layer_name = layer_name;
    }

    if (updateData.lgu_id) updateData.lgu_id = parseInt(updateData.lgu_id);
    if (updateData.category_id) updateData.category_id = parseInt(updateData.category_id);
    if (updateData.min_zoom) updateData.min_zoom = parseInt(updateData.min_zoom);
    if (updateData.max_zoom) updateData.max_zoom = parseInt(updateData.max_zoom);
    if (updateData.opacity) updateData.opacity = parseFloat(updateData.opacity);
    if (updateData.z_index) updateData.z_index = parseInt(updateData.z_index);

    const layer = await prisma.map_layers.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        project_categories: true,
        city_muni_master: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: layer,
    });
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layer' },
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
        { success: false, error: 'Layer ID is required' },
        { status: 400 }
      );
    }

    await prisma.map_layers.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Layer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete layer' },
      { status: 500 }
    );
  }
}