import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard API: Starting request...');
    
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    console.log('Dashboard API: User ID from auth:', userId);
    
    if (!userId) {
      console.log('Dashboard API: No user ID found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const authResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = authResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    console.log('Superadmin Dashboard API: Fetching comprehensive stats...');
    console.log('User ID:', userId);
    
    // Get user statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role ILIKE 'superadmin' THEN 1 END) as superadmin_count,
        COUNT(CASE WHEN role ILIKE 'lgu' THEN 1 END) as lgu_count,
        COUNT(CASE WHEN role ILIKE 'viewer' THEN 1 END) as viewer_count,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days
      FROM users
    `);

    // Get LGU statistics
    const lguStats = await query(`
      SELECT 
        COUNT(DISTINCT lgu_id) as total_lgus,
        COUNT(DISTINCT CASE WHEN role ILIKE 'lgu' THEN lgu_id END) as active_lgus
      FROM users
      WHERE lgu_id IS NOT NULL
    `);

    // Get project statistics
    const projectStats = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_projects_30_days
      FROM projects
    `);

    // Get map statistics
    const mapStats = await query(`
      SELECT 
        COUNT(*) as total_maps,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_maps_30_days,
        COUNT(DISTINCT source) as unique_categories
      FROM map_layers
    `);

    // Get audit log statistics
    const auditStats = await query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN timestamp > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activities_7_days,
        COUNT(CASE WHEN timestamp > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as activities_today
      FROM audit_logs
    `);

    // Get data export statistics
    const exportStats = await query(`
      SELECT 
        COUNT(*) as total_exports,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as exports_30_days
      FROM download_requests
    `);

    // Get system storage statistics (if available)
    const storageStats = await query(`
      SELECT 
        COALESCE(SUM(pg_column_size(geom)), 0) as total_geometry_size,
        COALESCE(SUM(pg_column_size(metadata)), 0) as total_data_size
      FROM map_layers
      WHERE geom IS NOT NULL OR metadata IS NOT NULL
    `);

    // Get recent activities for dashboard
    const recentActivities = await query(`
      SELECT 
        actor,
        action,
        details,
        to_char(timestamp, 'Mon DD, HH:MI AM') as formatted_date
      FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    // Get user growth over last 6 months
    const userGrowth = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users
      FROM users
      WHERE created_at > CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // Get source types for chart
    const sourceTypes = await query(`
      SELECT 
        layer_type as label,
        COUNT(*) as value,
        CASE 
          WHEN layer_type = 'vector' THEN '#3b82f6'
          WHEN layer_type = 'raster' THEN '#10b981'
          WHEN layer_type = 'wms' THEN '#f59e0b'
          WHEN layer_type = 'wfs' THEN '#8b5cf6'
          ELSE '#6b7280'
        END as color
      FROM map_layers
      WHERE layer_type IS NOT NULL
      GROUP BY layer_type
    `);

    // Get project data for chart
    const projectData = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
      FROM projects
      WHERE created_at > CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    const userStatsResult = userStats.rows[0] || {};
    const lguResult = lguStats.rows[0] || {};
    const projectResult = projectStats.rows[0] || {};
    const mapResult = mapStats.rows[0] || {};
    const auditResult = auditStats.rows[0] || {};
    const exportResult = exportStats.rows[0] || {};
    const storageResult = storageStats.rows[0] || {};
    
    const responseData = {
      users: userStatsResult,
      lgus: lguResult,
      projects: projectResult,
      maps: mapResult,
      activities: auditResult,
      exports: exportResult,
      storage: storageResult,
      recentActivities: recentActivities.rows || [],
      userGrowth: userGrowth.rows || [],
      sourceTypes: sourceTypes.rows || [],
      projectData: projectData.rows || []
    };
    
    console.log('Dashboard API: Successfully fetched stats');
    console.log('Response data keys:', Object.keys(responseData));
    
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('Superadmin Dashboard stats error:', error);
    
    const errorDetails = {
      message: (error as Error)?.message || 'No message',
      stack: (error as Error)?.stack || 'No stack',
      name: (error as Error)?.name || 'Unknown',
      code: (error as any)?.code || 'No code'
    };
    
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { error: 'Failed to fetch superadmin dashboard statistics', details: errorDetails.message },
      { status: 500 }
    );
  }
}
