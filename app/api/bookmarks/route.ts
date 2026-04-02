import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      layer_id,
      bookmark_name,
      bookmark_config,
      is_public,
    } = body;

    const bookmark = await prisma.layer_bookmark.create({
      data: {
        user_id: user_id ? parseInt(user_id) : null,
        layer_id: layer_id ? parseInt(layer_id) : null,
        bookmark_name,
        bookmark_config: bookmark_config || {},
        is_public: is_public !== undefined ? is_public : false,
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        map_layers: {
          select: {
            id: true,
            layer_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const layer_id = searchParams.get('layer_id');
    const is_public = searchParams.get('is_public');

    const whereClause: any = {};
    
    if (user_id) {
      whereClause.user_id = parseInt(user_id);
    }
    
    if (layer_id) {
      whereClause.layer_id = parseInt(layer_id);
    }
    
    if (is_public !== null) {
      whereClause.is_public = is_public === 'true';
    }

    const bookmarks = await prisma.layer_bookmark.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        map_layers: {
          select: {
            id: true,
            layer_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: bookmarks,
      count: bookmarks.length,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, bookmark_name, bookmark_config, is_public } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.layer_bookmark.update({
      where: { id: parseInt(id) },
      data: {
        bookmark_name: bookmark_name !== undefined ? bookmark_name : undefined,
        bookmark_config: bookmark_config !== undefined ? bookmark_config : undefined,
        is_public: is_public !== undefined ? is_public : undefined,
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        map_layers: {
          select: {
            id: true,
            layer_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bookmark' },
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
        { success: false, error: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    await prisma.layer_bookmark.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
