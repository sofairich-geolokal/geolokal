import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { query } from '@/lib/db';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      activity_type,
      activity_data,
      map_bounds,
      zoom_level,
      active_layers,
      duration_ms,
      layer_id,
    } = body;

    // Get client IP and User-Agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Try to get user info from session or activity data
    let userInfo = null;
    let lgu_id = null;
    
    // Check if we can identify the user from activity_data or session
    if (activity_data && activity_data.username) {
      const userResult = await query('SELECT id, username, lgu_id FROM users WHERE username = $1', [activity_data.username]);
      if (userResult.rows.length > 0) {
        userInfo = userResult.rows[0];
        lgu_id = userInfo.lgu_id;
      }
    }

    const activity = await prisma.viewer_activity.create({
      data: {
        session_id,
        activity_type,
        activity_data: activity_data || {},
        ip_address,
        user_agent,
        map_bounds: map_bounds || {},
        zoom_level: zoom_level ? parseFloat(zoom_level) : null,
        active_layers: active_layers || [],
        duration_ms: duration_ms ? parseInt(duration_ms) : null,
        layer_id: layer_id ? parseInt(layer_id) : null,
        user_id: userInfo ? userInfo.id : null,
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

    // Create audit log entry for viewer activity
    if (lgu_id && userInfo) {
      await query(
        'INSERT INTO audit_logs (actor, action, details, lgu_id, created_by) VALUES ($1, $2, $3, $4, $5)',
        [userInfo.username, `VIEWER_${activity_type.toUpperCase()}`, `${activity_type}: ${JSON.stringify(activity_data || {})}`, lgu_id, userInfo.username]
      );
    }

    return NextResponse.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_id = searchParams.get('user_id');
    const activity_type = searchParams.get('activity_type');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const whereClause: any = {};
    
    if (session_id) {
      whereClause.session_id = session_id;
    }
    
    if (user_id) {
      whereClause.user_id = parseInt(user_id);
    }
    
    if (activity_type) {
      whereClause.activity_type = activity_type;
    }

    const activities = await prisma.viewer_activity.findMany({
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
        timestamp: 'desc',
      },
      take: limit ? parseInt(limit) : 100,
      skip: offset ? parseInt(offset) : 0,
    });

    // Get activity statistics
    const stats = await prisma.viewer_activity.groupBy({
      by: ['activity_type'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: activities,
      stats: stats.map((stat: any) => ({
        activity_type: stat.activity_type,
        count: stat._count.id,
      })),
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
