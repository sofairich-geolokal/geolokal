// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '16443'),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // Required for Aiven Cloud connections
  } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);