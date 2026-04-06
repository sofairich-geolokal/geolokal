require('dotenv').config(); // This loads the .env file
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

// Test PG Pool connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for Aiven
  },
});

// Test Prisma connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnections() {
  console.log('Testing database connections...\n');
  
  // Test PG Pool
  try {
    console.log('1. Testing PG Pool connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ PG Pool connection successful:', result.rows[0].now);
  } catch (error) {
    console.error('❌ PG Pool connection failed:', error.message);
  } finally {
    await pool.end();
  }

  // Test Prisma
  try {
    console.log('\n2. Testing Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ Prisma query successful:', result[0]);
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnections();