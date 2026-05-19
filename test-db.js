// Test database connection
const { Pool } = require('pg');
// If DB_SSL_MODE indicates 'require' or if DB_SSL is 'true', allow insecure TLS for testing
const dbSslMode = process.env.DB_SSL || process.env.DB_SSL_MODE || '';
if (dbSslMode === 'require' || dbSslMode === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Support both DATABASE_URL and individual DB_* env vars and SSL modes
const useDatabaseUrl = !!process.env.DATABASE_URL;

// Log which connection method will be used and target host/db for easier debugging
try {
  if (useDatabaseUrl && process.env.DATABASE_URL) {
    const parsed = new URL(process.env.DATABASE_URL);
    console.log('Using DATABASE_URL -> host:', parsed.hostname, 'port:', parsed.port || '(default)', 'db:', parsed.pathname.replace('/', ''));
  } else {
    console.log('Using individual DB_* vars -> DB_HOST:', process.env.DB_HOST, 'DB_PORT:', process.env.DB_PORT, 'DB_NAME:', process.env.DB_NAME);
  }
} catch (e) {
  console.warn('Failed to parse DATABASE_URL for logging:', e.message);
}

const pool = new Pool(useDatabaseUrl ? {
  connectionString: process.env.DATABASE_URL,
  ssl: dbSslMode === 'true' || dbSslMode === 'require' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '2'),
  min: 0,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '5000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '10000'),
  maxUses: parseInt(process.env.DB_MAX_USES || '25'),
  allowExitOnIdle: true,
} : {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: dbSslMode === 'true' || dbSslMode === 'require' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '2'),
  min: 0,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '5000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '10000'),
  maxUses: parseInt(process.env.DB_MAX_USES || '25'),
  allowExitOnIdle: true,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_SSL:', process.env.DB_SSL);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('Database connected successfully!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version);
    
    // Test user table
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users in database:', userCount.rows[0].count);
    // Dump a few users for debugging login issues
    try {
      const users = await pool.query("SELECT id, username, password_hash, role FROM users ORDER BY id LIMIT 10");
      console.log('Sample users:');
      users.rows.forEach(u => console.log(`  id=${u.id} username=${u.username} role=${u.role} password_hash=${u.password_hash ? u.password_hash.substring(0,40) + '...' : 'NULL'}`));

      const su = await pool.query("SELECT id, username, password_hash FROM users WHERE lower(username) LIKE '%superadmin%' LIMIT 5");
      if (su.rows.length) {
        su.rows.forEach(r => console.log(`Found user ${r.username} id=${r.id} hash=${r.password_hash ? r.password_hash.substring(0,60) + '...' : 'NULL'}`));
      } else {
        console.log('No SuperAdmin user found');
      }
    } catch (e) {
      console.warn('Could not query users table:', e.message || e);
    }
    
  } catch (error) {
    console.error('Database connection failed:', error.message || error);
    if (error.code) console.error('Error code:', error.code);
    if (error.detail) console.error('Error detail:', error.detail);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
