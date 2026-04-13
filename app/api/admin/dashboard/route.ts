import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin Dashboard API: Starting request...');
    
    // Get logged-in user ID from auth token
    const userId = await getAuthUser();
    console.log('Admin Dashboard API: User ID from auth:', userId);
    
    if (!userId) {
      console.log('Admin Dashboard API: No user ID found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin/superadmin
    const authResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = authResult.rows[0];
    
    if (!user || (user.role.toLowerCase() !== 'superadmin' && user.role.toLowerCase() !== 'admin')) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    console.log('Admin Dashboard API: Fetching comprehensive stats...');
    
    // Dynamic user statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role ILIKE 'superadmin' THEN 1 END) as superadmin_count,
        COUNT(CASE WHEN role ILIKE 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role ILIKE 'lgu' THEN 1 END) as lgu_count,
        COUNT(CASE WHEN role ILIKE 'viewer' THEN 1 END) as viewer_count,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
        COUNT(CASE WHEN last_login > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_users_7_days,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
      FROM users
    `);

    // Dynamic LGU statistics
    const lguStats = await query(`
      SELECT 
        COUNT(DISTINCT lgu_id) as total_lgus,
        COUNT(DISTINCT CASE WHEN role ILIKE 'lgu' THEN lgu_id END) as active_lgus,
        COUNT(DISTINCT CASE WHEN role ILIKE 'viewer' THEN lgu_id END) as viewer_lgus,
        COUNT(CASE WHEN lgu_id IS NOT NULL THEN 1 END) as users_with_lgu
      FROM users
      WHERE lgu_id IS NOT NULL
    `);

    // Dynamic project statistics
    const projectStats = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_projects,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_projects_30_days,
        COUNT(CASE WHEN updated_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as updated_projects_7_days
      FROM projects
    `);

    // Dynamic map statistics
    const mapStats = await query(`
      SELECT 
        COUNT(*) as total_maps,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_maps_30_days,
        COUNT(DISTINCT layer_type) as unique_categories,
        COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_maps,
        COUNT(CASE WHEN is_downloadable = true THEN 1 END) as downloadable_maps,
        COUNT(CASE WHEN uploaded_by IS NOT NULL THEN 1 END) as maps_with_owner
      FROM map_layers
    `);

    // Dynamic audit log statistics
    const auditStats = await query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN timestamp > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activities_7_days,
        COUNT(CASE WHEN timestamp > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as activities_today,
        COUNT(CASE WHEN timestamp > CURRENT_DATE - INTERVAL '1 hour' THEN 1 END) as activities_1_hour,
        COUNT(DISTINCT actor) as unique_actors,
        COUNT(DISTINCT action) as unique_actions
      FROM audit_logs
    `);

    // Dynamic export/download statistics
    const exportStats = await query(`
      SELECT 
        COUNT(*) as total_exports,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as exports_30_days,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_exports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_exports,
        COUNT(CASE WHEN expires_at > CURRENT_DATE THEN 1 END) as active_exports
      FROM download_requests
    `);

    // Dynamic storage statistics
    const storageStats = await query(`
      SELECT 
        COALESCE(SUM(pg_column_size(geom)), 0) as total_geometry_size,
        COALESCE(SUM(pg_column_size(metadata)), 0) as total_metadata_size,
        COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) as layers_with_geometry,
        COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as layers_with_metadata
      FROM map_layers
    `);

    // Dynamic data source statistics
    const sourceStats = await query(`
      SELECT 
        layer_type as source_type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM map_layers
      WHERE layer_type IS NOT NULL
      GROUP BY layer_type
      ORDER BY count DESC
    `);

    // Recent activities with more details
    const recentActivities = await query(`
      SELECT 
        actor,
        action,
        details,
        to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as formatted_date,
        timestamp,
        CASE 
          WHEN timestamp > CURRENT_DATE - INTERVAL '1 hour' THEN 'Just now'
          WHEN timestamp > CURRENT_DATE - INTERVAL '1 day' THEN 'Today'
          WHEN timestamp > CURRENT_DATE - INTERVAL '7 days' THEN 'This week'
          ELSE 'Older'
        END as time_category
      FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 15
    `);

    // User growth over last 6 months
    const userGrowth = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users,
        COUNT(CASE WHEN role ILIKE 'lgu' THEN 1 END) as new_lgu_users,
        COUNT(CASE WHEN role ILIKE 'viewer' THEN 1 END) as new_viewer_users
      FROM users
      WHERE created_at > CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // Project activity over last 6 months
    const projectActivity = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as created_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects
      FROM projects
      WHERE created_at > CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // System health metrics
    const systemHealth = await query(`
      SELECT 
        COUNT(DISTINCT uploaded_by) as active_contributors,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as daily_new_layers,
        COUNT(CASE WHEN updated_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as weekly_updated_layers,
        (SELECT COUNT(*) FROM users WHERE last_login > CURRENT_DATE - INTERVAL '1 day') as daily_active_users
    `);

    const userStatsResult = userStats.rows[0] || {};
    const lguResult = lguStats.rows[0] || {};
    const projectResult = projectStats.rows[0] || {};
    const mapResult = mapStats.rows[0] || {};
    const auditResult = auditStats.rows[0] || {};
    const exportResult = exportStats.rows[0] || {};
    const storageResult = storageStats.rows[0] || {};
    const healthResult = systemHealth.rows[0] || {};
    
    const responseData = {
      // Core statistics
      users: userStatsResult,
      lgus: lguResult,
      projects: projectResult,
      maps: mapResult,
      activities: auditResult,
      exports: exportResult,
      storage: storageResult,
      health: healthResult,
      
      // Chart data
      recentActivities: recentActivities.rows || [],
      userGrowth: userGrowth.rows || [],
      projectActivity: projectActivity.rows || [],
      sourceStats: sourceStats.rows || [],
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      dataRefreshInterval: '5 minutes',
      apiVersion: '1.0.0'
    };
    
    console.log('Admin Dashboard API: Successfully fetched comprehensive stats');
    console.log('Response data keys:', Object.keys(responseData));
    
    return NextResponse.json(responseData);
    
  } catch (error: unknown) {
    console.error('Admin Dashboard API error:', error);
    
    const errorDetails = {
      message: (error as Error)?.message || 'No message',
      stack: (error as Error)?.stack || 'No stack',
      name: (error as Error)?.name || 'Unknown',
      code: (error as any)?.code || 'No code'
    };
    
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard statistics', details: errorDetails.message },
      { status: 500 }
    );
  }
}
