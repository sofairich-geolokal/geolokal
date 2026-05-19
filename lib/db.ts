// lib/db.ts
import { Pool } from 'pg';

// Support both individual DB_* env vars and a single DATABASE_URL connection string.
// Prefer DATABASE_URL when present (e.g., Aiven, Heroku style).
let poolConfig: any = {};

if (process.env.DATABASE_URL) {
  const sslEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === 'require' || process.env.DB_SSL_MODE === 'require';
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    // For managed providers like Aiven, allow self-signed certs if requested
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    min: parseInt(process.env.DB_MIN_CONNECTIONS || '0'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '5000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '3000'),
    application_name: process.env.DB_APP_NAME || 'geolokal_app',
  };
} else {
  const sslEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === 'require' || process.env.DB_SSL_MODE === 'require';
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'), // Use default PostgreSQL port
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    // Aggressive connection settings for reliability
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '2'),
    min: 0,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '2000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '3000'),
    maxUses: parseInt(process.env.DB_MAX_USES || '10'),
    allowExitOnIdle: false,
    application_name: process.env.DB_APP_NAME || 'geolokal_app',
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  };
}

// Log warning if essential env vars missing
if (!process.env.DATABASE_URL) {
  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER) {
    console.warn('Database environment variables appear incomplete. Consider setting DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.');
  }
}

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool(poolConfig);
  }
  return pool;
}

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    const p = getPool();
    const result = await p.query('SELECT 1 as health_check');
    return { healthy: true, message: 'Database is healthy' };
  } catch (error: any) {
    return { healthy: false, message: error.message };
  }
};

export const query = async (text: string, params?: any[]) => {
  const maxRetries = 3;
  const timeoutMs = parseInt(process.env.DB_QUERY_TIMEOUT_MS || '8000');
  let lastError: any;
  const p = getPool();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        p.query(text, params),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), timeoutMs))
      ]);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Database query attempt ${attempt} failed:`, error?.message || error);

      // Handle AggregateError from pg pool which wraps multiple underlying errors
      const msg = String(error?.message || error);
      const isConnectionError = msg.includes('timeout') || msg.includes('ECONNREFUSED') || msg.includes('connect') || msg.includes('connection') || msg.includes('AggregateError');

      if (isConnectionError && attempt < maxRetries) {
        console.warn(`Retrying database connection (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};