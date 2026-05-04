const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Testing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_USER:', process.env.DB_USER);

    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Database connection successful',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        env_check: {
          has_db_user: !!process.env.DB_USER,
          has_db_host: !!process.env.DB_HOST,
          has_db_name: !!process.env.DB_NAME,
          has_db_password: !!process.env.DB_PASSWORD,
          has_db_port: !!process.env.DB_PORT,
          has_db_ssl: !!process.env.DB_SSL
        }
      })
    };

  } catch (error) {
    console.error('Database connection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Database connection failed',
        details: error.message,
        env_check: {
          has_db_user: !!process.env.DB_USER,
          has_db_host: !!process.env.DB_HOST,
          has_db_name: !!process.env.DB_NAME,
          has_db_password: !!process.env.DB_PASSWORD,
          has_db_port: !!process.env.DB_PORT,
          has_db_ssl: !!process.env.DB_SSL
        }
      })
    };
  }
};
