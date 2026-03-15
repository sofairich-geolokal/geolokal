require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('Testing database connection...');
console.log('Connection string format:', connectionString.replace(/\/\/.*@/, '//***:***@'));

// Test with direct pg pool first
const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err.message);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Direct PostgreSQL connection failed:', err.message);
    console.error('Error details:', err);
  } else {
    console.log('✅ Direct PostgreSQL connection successful');
    console.log('Server time:', res.rows[0].now);
  }
  
  pool.end();
  
  // Test with Prisma using a new pool
  const prismaPool = new Pool({ connectionString });
  const adapter = new PrismaPg(prismaPool);
  const prisma = new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Prisma connection successful');
      return prisma.$queryRaw`SELECT NOW()`;
    })
    .then(result => {
      console.log('Prisma query successful:', result);
    })
    .catch(err => {
      console.error('❌ Prisma connection failed:', err.message);
      console.error('Error details:', err);
    })
    .finally(() => {
      prisma.$disconnect();
      prismaPool.end();
    });
});
