// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  //database:'GeoLokal',
  password: 'Rukhsar', 
  port: 5432,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
console.log('query');