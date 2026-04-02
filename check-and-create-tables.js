require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkAndCreateTables() {
  try {
    console.log('Checking database tables...');
    
    // Check if tax_parcels table exists
    const taxParcelsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tax_parcels'
      );
    `);
    
    // Check if cbms_indicators table exists
    const cbmsIndicatorsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cbms_indicators'
      );
    `);
    
    console.log('tax_parcels exists:', taxParcelsCheck.rows[0].exists);
    console.log('cbms_indicators exists:', cbmsIndicatorsCheck.rows[0].exists);
    
    // Create tax_parcels table if it doesn't exist
    if (!taxParcelsCheck.rows[0].exists) {
      console.log('Creating tax_parcels table...');
      await pool.query(`
        CREATE TABLE "tax_parcels" (
          "id" SERIAL NOT NULL,
          "parcel_no" VARCHAR(50) NOT NULL,
          "owner_name" VARCHAR(100),
          "valuation" DECIMAL(15,2),
          "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "tax_parcels_pkey" PRIMARY KEY ("id")
        );
      `);
      
      // Create unique index
      await pool.query(`
        CREATE UNIQUE INDEX "tax_parcels_parcel_no_key" ON "tax_parcels"("parcel_no");
      `);
      
      // Insert sample data
      await pool.query(`
        INSERT INTO tax_parcels (parcel_no, owner_name, valuation) VALUES
        ('TP-001', 'Juan Dela Cruz', 150000.00),
        ('TP-002', 'Maria Santos', 250000.00),
        ('TP-003', 'Jose Reyes', 180000.00),
        ('TP-004', 'Ana Garcia', 320000.00),
        ('TP-005', 'Carlos Rodriguez', 210000.00);
      `);
      
      console.log('✅ tax_parcels table created with sample data');
    }
    
    // Create cbms_indicators table if it doesn't exist
    if (!cbmsIndicatorsCheck.rows[0].exists) {
      console.log('Creating cbms_indicators table...');
      await pool.query(`
        CREATE TABLE "cbms_indicators" (
          "id" SERIAL NOT NULL,
          "indicator_code" VARCHAR(20) NOT NULL,
          "indicator_value" DECIMAL(10,2),
          "status" VARCHAR(20),
          "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cbms_indicators_pkey" PRIMARY KEY ("id")
        );
      `);
      
      // Insert sample data
      await pool.query(`
        INSERT INTO cbms_indicators (indicator_code, indicator_value, status) VALUES
        ('POP001', 15000.50, 'Active'),
        ('ECON001', 2500.75, 'Active'),
        ('HEALTH001', 95.2, 'Active'),
        ('EDU001', 88.5, 'Active'),
        ('INFRA001', 1200.00, 'Active');
      `);
      
      console.log('✅ cbms_indicators table created with sample data');
    }
    
    // Check if audit_logs has sample data
    const auditLogsCount = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
    if (parseInt(auditLogsCount.rows[0].count) === 0) {
      console.log('Adding sample audit logs...');
      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, details, actor) VALUES
        (1, 'LOGIN_SUCCESS', 'User logged in successfully', 'Admin User'),
        (1, 'DATA_EXPORT', 'Exported tax parcels data', 'Admin User'),
        (1, 'SYSTEM_BACKUP', 'System backup completed', 'System'),
        (1, 'USER_CREATION', 'New user account created', 'Admin User'),
        (1, 'LOGIN_SUCCESS', 'User logged in successfully', 'Admin User');
      `);
      console.log('✅ Sample audit logs added');
    }
    
    console.log('\n🎉 Database setup completed!');
    
    // Test the queries used by the API
    console.log('\nTesting API queries...');
    const parcelResult = await pool.query('SELECT COUNT(*) as count FROM tax_parcels');
    const cbmsResult = await pool.query('SELECT COUNT(*) as count FROM cbms_indicators');
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const logsResult = await pool.query("SELECT COUNT(*) as count FROM audit_logs");
    
    console.log(`Tax parcels: ${parcelResult.rows[0].count}`);
    console.log(`CBMS indicators: ${cbmsResult.rows[0].count}`);
    console.log(`Active users: ${usersResult.rows[0].count}`);
    console.log(`Audit logs: ${logsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndCreateTables();
