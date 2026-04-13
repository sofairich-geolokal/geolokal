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

async function testDashboardQueries() {
  try {
    console.log('🧪 Testing dashboard queries...');
    
    // Test user statistics query
    console.log('\n1. Testing user stats query...');
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_count,
        COUNT(CASE WHEN role = 'lgu' THEN 1 END) as lgu_count,
        COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_count,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days
      FROM users
    `);
    console.log('✅ User stats:', userStats.rows[0]);
    
    // Test LGU statistics query
    console.log('\n2. Testing LGU stats query...');
    const lguStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT lgu_id) as total_lgus,
        COUNT(DISTINCT CASE WHEN role = 'lgu' THEN lgu_id END) as active_lgus
      FROM users
      WHERE lgu_id IS NOT NULL
    `);
    console.log('✅ LGU stats:', lguStats.rows[0]);
    
    // Test project statistics query
    console.log('\n3. Testing project stats query...');
    const projectStats = await pool.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_projects_30_days
      FROM projects
    `);
    console.log('✅ Project stats:', projectStats.rows[0]);
    
    // Test map statistics query
    console.log('\n4. Testing map stats query...');
    const mapStats = await pool.query(`
      SELECT 
        COUNT(*) as total_maps,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_maps_30_days,
        COUNT(DISTINCT source) as unique_categories
      FROM map_layers
    `);
    console.log('✅ Map stats:', mapStats.rows[0]);
    
    // Test audit logs query
    console.log('\n5. Testing audit logs query...');
    const auditStats = await pool.query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activities_7_days,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as activities_today
      FROM audit_logs
    `);
    console.log('✅ Audit stats:', auditStats.rows[0]);
    
    // Test export statistics query
    console.log('\n6. Testing export stats query...');
    const exportStats = await pool.query(`
      SELECT 
        COUNT(*) as total_exports,
        COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as exports_30_days
      FROM export_requests
    `);
    console.log('✅ Export stats:', exportStats.rows[0]);
    
    console.log('\n🎉 All queries executed successfully!');
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testDashboardQueries();
