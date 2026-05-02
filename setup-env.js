#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up GeoLokal environment...');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env-example.txt');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  // Read the example file
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Create .env.local with example content
    fs.writeFileSync(envPath, exampleContent);
    console.log('✅ .env.local created from env-example.txt');
  } else {
    // Create basic .env.local
    const basicEnv = `# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/geolokal

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@geolokal.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env.local created');
  }
  
  console.log('\n⚠️  IMPORTANT: Please update .env.local with your actual database credentials');
  console.log('   - DATABASE_URL: Your PostgreSQL connection string');
  console.log('   - SMTP credentials: Your email service configuration');
  console.log('   - NEXTAUTH_SECRET: Generate a random secret key');
  console.log('   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Get from Google Cloud Console');
} else {
  console.log('✅ .env.local already exists');
}

// Check if DATABASE_URL is configured
const envContent = fs.readFileSync(envPath, 'utf8');
if (envContent.includes('postgresql://username:password')) {
  console.log('\n❌ DATABASE_URL still contains placeholder values');
  console.log('   Please update your database credentials in .env.local');
  process.exit(1);
} else {
  console.log('\n✅ DATABASE_URL appears to be configured');
}

console.log('\n🚀 Environment setup complete!');
console.log('   Restart your development server to apply changes.');
