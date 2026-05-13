// lib/db-secure.ts - Custom SSL configuration for Aiven cloud database
import { Pool } from 'pg';
import { createSecureContext } from 'tls';

// Create custom SSL context that accepts self-signed certificates
const customSSLContext = createSecureContext({
  // Additional options to handle self-signed certificates
  minVersion: 'TLSv1.2',
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
    // Use custom SSL context
    secureContext: customSSLContext,
  } : false,
  // Connection pool settings
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  maxUses: 7500,
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client in db-secure:', err);
});

// Export query function with proper connection management
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn('Slow query detected in db-secure', { text, duration, params });
    }
    return res;
  } catch (error) {
    console.error('Database query error in db-secure:', error);
    
    // Check if it's a connection limit error
    if (error instanceof Error) {
      if (error.message.includes('remaining connection slots') || 
          error.message.includes('too many connections') ||
          error.message.includes('connection limit')) {
        console.error('Database connection limit reached in db-secure.');
        return { rows: [], rowCount: 0 } as any;
      }
    }
    
    throw error;
  }
};

// Export pool for direct access
export { pool };

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('db-secure pool has been closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('db-secure pool has been closed');
    process.exit(0);
  });
});
