import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      layers,
      format,
      bounds,
      projection,
      includeAttributes,
      email,
    } = body;

    // Create export request record
    const exportRequest = await prisma.export_request.create({
      data: {
        layers: layers || [],
        format: format || 'geojson',
        bounds: bounds || {},
        projection: projection || 'EPSG:4326',
        include_attributes: includeAttributes !== false,
        email: email || null,
        status: 'processing',
        requested_at: new Date(),
      },
    });

    // For now, return a mock response
    // In production, this would trigger a background job to process the export
    if (layers && layers.length > 0) {
      // Mock immediate download for small requests
      if (layers.length <= 3 && !email) {
        return NextResponse.json({
          success: true,
          download_url: `/api/exports/download/${exportRequest.id}`,
          export_id: exportRequest.id,
        });
      } else {
        // Email notification for large requests
        return NextResponse.json({
          success: true,
          email_sent: true,
          export_id: exportRequest.id,
          message: 'Export request submitted. Download link will be sent to your email.',
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'No layers specified for export',
    });
  } catch (error) {
    console.error('Export request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process export request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get('export_id');
    const userId = searchParams.get('user_id');

    if (exportId) {
      // Get specific export request
      const exportRequest = await prisma.export_request.findUnique({
        where: { id: parseInt(exportId) },
      });

      if (!exportRequest) {
        return NextResponse.json(
          { success: false, error: 'Export request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: exportRequest,
      });
    } else {
      // Get user's export history
      const whereClause: any = {};
      if (userId) {
        whereClause.user_id = parseInt(userId);
      }

      const exports = await prisma.export_request.findMany({
        where: whereClause,
        orderBy: {
          requested_at: 'desc',
        },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        data: exports,
      });
    }
  } catch (error) {
    console.error('Export fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch export data' },
      { status: 500 }
    );
  }
}
