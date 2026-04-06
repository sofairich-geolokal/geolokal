import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is superadmin
    const authResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = authResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Superadmin role required.' }, { status: 403 });
    }

    console.log('📊 Superadmin Dashboard API: Fetching comprehensive stats...');
    
    // Get user statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_count,
        COUNT(CASE WHEN role = 'lgu' THEN 1 END) as lgu_count,
        COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_count,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days
      FROM users
    `);

    // Get LGU statistics
    const lguStats = await query(`
      SELECT 
        COUNT(DISTINCT lgu_id) as total_lgus,
        COUNT(DISTINCT CASE WHEN role = 'lgu' THEN lgu_id END) as active_lgus
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
        COUNT(DISTINCT category_id) as unique_categories
      FROM map_layers
    `);

    // Get audit log statistics
    const auditStats = await query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activities_7_days,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as activities_today
      FROM audit_logs
    `);

    // Get data export statistics
    const exportStats = await query(`
      SELECT 
        COUNT(*) as total_exports,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as exports_30_days
      FROM export_requests
    `);

    // Get system storage statistics (if available)
    const storageStats = await query(`
      SELECT 
        COALESCE(SUM(pg_column_size(geom)), 0) as total_geometry_size,
        COALESCE(SUM(pg_column_size(data)), 0) as total_data_size
      FROM map_layers
      WHERE geom IS NOT NULL OR data IS NOT NULL
    `);

    // Get recent activities for dashboard
    const recentActivities = await query(`
      SELECT 
        actor,
        action,
        details,
        to_char(created_at, 'Mon DD, HH:MI AM') as formatted_date
      FROM audit_logs
      ORDER BY created_at DESC
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

    const userStatsResult = userStats.rows[0] || {};
    const lguResult = lguStats.rows[0] || {};
    const projectResult = projectStats.rows[0] || {};
    const mapResult = mapStats.rows[0] || {};
    const auditResult = auditStats.rows[0] || {};
    const exportResult = exportStats.rows[0] || {};
    const storageResult = storageStats.rows[0] || {};
    
    return NextResponse.json({
      users: userStatsResult,
      lgus: lguResult,
      projects: projectResult,
      maps: mapResult,
      activities: auditResult,
      exports: exportResult,
      storage: storageResult,
      recentActivities: recentActivities.rows || [],
      userGrowth: userGrowth.rows || []
    });
  } catch (error) {
    console.error('Superadmin Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch superadmin dashboard statistics' },
      { status: 500 }
    );
  }
}
