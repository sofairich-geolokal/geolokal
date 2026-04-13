require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function debugDashboardAPI() {
  try {
    console.log('🔍 Debugging dashboard API queries...');
    
    // Test each query individually to find the failing one
    
    // 1. User stats
    console.log('\n1. Testing user stats...');
    try {
      const userStats = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role ILIKE 'superadmin' THEN 1 END) as superadmin_count,
          COUNT(CASE WHEN role ILIKE 'lgu' THEN 1 END) as lgu_count,
          COUNT(CASE WHEN role ILIKE 'viewer' THEN 1 END) as viewer_count,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days
        FROM users
      `);
      console.log('✅ User stats OK:', userStats.rows[0]);
    } catch (err) {
      console.error('❌ User stats failed:', err.message);
    }

    // 2. LGU stats
    console.log('\n2. Testing LGU stats...');
    try {
      const lguStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT lgu_id) as total_lgus,
          COUNT(DISTINCT CASE WHEN role ILIKE 'lgu' THEN lgu_id END) as active_lgus
        FROM users
        WHERE lgu_id IS NOT NULL
      `);
      console.log('✅ LGU stats OK:', lguStats.rows[0]);
    } catch (err) {
      console.error('❌ LGU stats failed:', err.message);
    }

    // 3. Project stats
    console.log('\n3. Testing project stats...');
    try {
      const projectStats = await pool.query(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_projects_30_days
        FROM projects
      `);
      console.log('✅ Project stats OK:', projectStats.rows[0]);
    } catch (err) {
      console.error('❌ Project stats failed:', err.message);
    }

    // 4. Map stats
    console.log('\n4. Testing map stats...');
    try {
      const mapStats = await pool.query(`
        SELECT 
          COUNT(*) as total_maps,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_maps_30_days,
          COUNT(DISTINCT source) as unique_categories
        FROM map_layers
      `);
      console.log('✅ Map stats OK:', mapStats.rows[0]);
    } catch (err) {
      console.error('❌ Map stats failed:', err.message);
    }

    // 5. Audit stats
    console.log('\n5. Testing audit stats...');
    try {
      const auditStats = await pool.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activities_7_days,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as activities_today
        FROM audit_logs
      `);
      console.log('✅ Audit stats OK:', auditStats.rows[0]);
    } catch (err) {
      console.error('❌ Audit stats failed:', err.message);
    }

    // 6. Export stats
    console.log('\n6. Testing export stats...');
    try {
      const exportStats = await pool.query(`
        SELECT 
          COUNT(*) as total_exports,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as exports_30_days
        FROM export_requests
      `);
      console.log('✅ Export stats OK:', exportStats.rows[0]);
    } catch (err) {
      console.error('❌ Export stats failed:', err.message);
    }

    // 7. Storage stats
    console.log('\n7. Testing storage stats...');
    try {
      const storageStats = await pool.query(`
        SELECT 
          COALESCE(SUM(pg_column_size(geom)), 0) as total_geometry_size,
          COALESCE(SUM(pg_column_size(data)), 0) as total_data_size
        FROM map_layers
        WHERE geom IS NOT NULL OR data IS NOT NULL
      `);
      console.log('✅ Storage stats OK:', storageStats.rows[0]);
    } catch (err) {
      console.error('❌ Storage stats failed:', err.message);
    }

    // 8. Recent activities
    console.log('\n8. Testing recent activities...');
    try {
      const recentActivities = await pool.query(`
        SELECT 
          actor,
          action,
          details,
          to_char(created_at, 'Mon DD, HH:MI AM') as formatted_date
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 10
      `);
      console.log('✅ Recent activities OK:', recentActivities.rows.length, 'rows');
    } catch (err) {
      console.error('❌ Recent activities failed:', err.message);
    }

    // 9. User growth
    console.log('\n9. Testing user growth...');
    try {
      const userGrowth = await pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_users
        FROM users
        WHERE created_at > CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);
      console.log('✅ User growth OK:', userGrowth.rows.length, 'rows');
    } catch (err) {
      console.error('❌ User growth failed:', err.message);
    }

    // 10. Source types
    console.log('\n10. Testing source types...');
    try {
      const sourceTypes = await pool.query(`
        SELECT 
          source as label,
          COUNT(*) as value,
          CASE 
            WHEN source = 'shapefile' THEN '#3b82f6'
            WHEN source = 'geojson' THEN '#10b981'
            WHEN source = 'kml' THEN '#f59e0b'
            ELSE '#6b7280'
          END as color
        FROM map_layers
        WHERE source IS NOT NULL
        GROUP BY source
      `);
      console.log('✅ Source types OK:', sourceTypes.rows);
    } catch (err) {
      console.error('❌ Source types failed:', err.message);
    }

    // 11. Project data
    console.log('\n11. Testing project data...');
    try {
      const projectData = await pool.query(`
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
      console.log('✅ Project data OK:', projectData.rows.length, 'rows');
    } catch (err) {
      console.error('❌ Project data failed:', err.message);
    }
    
    console.log('\n🎉 Debugging complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

debugDashboardAPI();
