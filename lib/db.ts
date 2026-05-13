// lib/db.ts
import { Pool } from 'pg';

// Database connection with aggressive timeout settings
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'), // Use default PostgreSQL port
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // Required for Aiven Cloud connections
  } : false,
  // Aggressive connection settings for reliability
  max: 2, // Further reduced connections
  min: 0, // Don't keep connections ready
  idleTimeoutMillis: 2000, // Very short idle timeout
  connectionTimeoutMillis: 3000, // Shorter connection timeout
  maxUses: 10, // Reuse connections frequently
  allowExitOnIdle: false, // Keep connections available
  // Additional connection options
  application_name: 'geolokal_app',
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    const result = await pool.query('SELECT 1 as health_check');
    return { healthy: true, message: 'Database is healthy' };
  } catch (error: any) {
    return { healthy: false, message: error.message };
  }
};

export const query = async (text: string, params?: any[]) => {
  const maxRetries = 2;
  const timeoutMs = 2000;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        pool.query(text, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        )
      ]);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Database query attempt ${attempt} failed:`, error.message);
      
      const isConnectionError = error.message?.includes('timeout') || 
                           error.message?.includes('ECONNREFUSED') ||
                           error.message?.includes('connect') ||
                           error.message?.includes('connection');
      
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