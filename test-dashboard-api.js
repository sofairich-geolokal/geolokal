const { query } = require('./lib/db');

async function testDashboardAPI() {
  try {
    console.log('Testing dashboard API logic...');
    
    // Simulate the API logic
    const userId = 1; // Simulate a user ID
    
    // Verify user is superadmin
    console.log('1. Testing user authentication...');
    const authResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = authResult.rows[0];
    
    if (!user || user.role.toLowerCase() !== 'superadmin') {
      console.log('Authentication failed - user is not superadmin:', user);
      return;
    }
    
    console.log('Authentication passed - user is superadmin');
    
    // Test the complete API logic
    console.log('2. Running complete dashboard stats query...');
    
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
        COUNT(DISTINCT layer_type) as unique_categories
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

    // Get system storage statistics
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
    
    console.log('API test completed successfully!');
    console.log('Response data structure:', Object.keys(responseData));
    console.log('Sample data:', {
      users: responseData.users,
      lgus: responseData.lgus,
      projects: responseData.projects
    });
    
  } catch (error) {
    console.error('API test error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
  }
}

testDashboardAPI().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
