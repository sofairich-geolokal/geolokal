const { execSync } = require('child_process');

// This script will be used to deploy database schema to production
console.log('Deploying database schema to production...');

try {
  // Generate Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Deploy migrations to production database
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('Database deployment completed successfully!');
} catch (error) {
  console.error('Database deployment failed:', error.message);
  process.exit(1);
}
