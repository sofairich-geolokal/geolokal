import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch download requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const requestId = searchParams.get('id');

    if (requestId) {
      // Fetch specific download request
      const downloadRequest = await prisma.download_requests.findUnique({
        where: { id: parseInt(requestId) },
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
              attribution: true,
            },
          },
        },
      });

      if (!downloadRequest) {
        return NextResponse.json(
          { success: false, error: 'Download request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: downloadRequest,
      });
    }

    const whereClause: any = {};
    
    if (userId) {
      whereClause.user_id = parseInt(userId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    const downloadRequests = await prisma.download_requests.findMany({
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
            attribution: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: downloadRequests,
      count: downloadRequests.length,
    });
  } catch (error) {
    console.error('Error fetching download requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch download requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new download request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      layer_id,
      layer_name,
      official_email,
      client_name,
      sex,
      address,
      office_agency,
      sector,
      purpose,
      official_contact_no,
      agree_terms,
      certify_info,
      bbox,
      map_extent,
      requested_format,
    } = body;

    // Validate required fields
    if (!user_id || !layer_id || !official_email || !client_name) {
      return NextResponse.json(
        { success: false, error: 'User ID, layer ID, email, and name are required' },
        { status: 400 }
      );
    }

    // Check if layer is downloadable
    const layer = await prisma.map_layers.findUnique({
      where: { id: parseInt(layer_id) },
    });

    if (!layer) {
      return NextResponse.json(
        { success: false, error: 'Layer not found' },
        { status: 404 }
      );
    }

    if (!layer.is_downloadable) {
      return NextResponse.json(
        { success: false, error: 'This layer is not available for download' },
        { status: 403 }
      );
    }

    // Generate download request ID
    const requestId = `DL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const downloadRequest = await prisma.download_requests.create({
      data: {
        user_id: parseInt(user_id),
        layer_id: parseInt(layer_id),
        layer_name,
        official_email,
        client_name,
        sex: sex || 'Not Specified',
        address: address || '',
        office_agency: office_agency || '',
        sector: sector || '',
        purpose: purpose || '',
        official_contact_no: official_contact_no || '',
        agree_terms: agree_terms || false,
        certify_info: certify_info || false,
        bbox: bbox || layer.bbox,
        map_extent: map_extent || layer.bbox,
        requested_format: requested_format || 'shapefile',
        request_id: requestId,
        status: 'pending',
        download_link: null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
            attribution: true,
          },
        },
      },
    });

    // TODO: Send email notification with download link
    // This would integrate with your email service

    return NextResponse.json({
      success: true,
      data: downloadRequest,
      message: 'Download request submitted successfully. You will receive an email with the download link shortly.',
    });
  } catch (error) {
    console.error('Error creating download request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create download request' },
      { status: 500 }
    );
  }
}

// PUT - Update download request status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, download_link } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // Set processed_at when status changes to completed
      if (status === 'completed') {
        updateData.processed_at = new Date();
      }
    }
    
    if (download_link) {
      updateData.download_link = download_link;
    }

    const downloadRequest = await prisma.download_requests.update({
      where: { id: parseInt(id) },
      data: updateData,
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
            attribution: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: downloadRequest,
      message: 'Download request updated successfully',
    });
  } catch (error) {
    console.error('Error updating download request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update download request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a download request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    await prisma.download_requests.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Download request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting download request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete download request' },
      { status: 500 }
    );
  }
}
