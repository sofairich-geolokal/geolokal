import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const lgus = await prisma.city_muni_master.findMany({
      include: {
        map_layers: {
          select: {
            id: true,
            layer_name: true,
            is_visible: true,
          },
        },
        projects: {
          select: {
            id: true,
            project_name: true,
            status: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            is_active: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: lgus.map((lgu: any) => ({
        ...lgu,
        layer_count: lgu.map_layers.length,
        project_count: lgu.projects.length,
        user_count: lgu.users.length,
        active_users: lgu.users.filter((user: any) => user.is_active).length,
      })),
    });
  } catch (error) {
    console.error('Error fetching LGUs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LGUs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, province } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'LGU name is required' },
        { status: 400 }
      );
    }

    const lgu = await prisma.city_muni_master.create({
      data: {
        name,
        province,
      },
    });

    return NextResponse.json({
      success: true,
      data: lgu,
    });
  } catch (error) {
    console.error('Error creating LGU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create LGU' },
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
        { success: false, error: 'LGU ID is required' },
        { status: 400 }
      );
    }

    await prisma.city_muni_master.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'LGU deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting LGU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete LGU' },
      { status: 500 }
    );
  }
}
