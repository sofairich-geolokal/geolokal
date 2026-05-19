// run-login-test.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const dbSslMode = process.env.DB_SSL || process.env.DB_SSL_MODE || '';
if (dbSslMode === 'require' || dbSslMode === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: dbSslMode === 'require' || dbSslMode === 'true' ? { rejectUnauthorized: false } : false,
});

const tests = [
  { username: 'SuperAdmin', password: 'SuperAdmin@2026' },
  { username: 'sofairich', password: 'sofairich@123' },
  { username: 'Doona', password: 'VJFLl0tkrL' },
  { username: 'Diana', password: '2dEWhpWhYH' },
  { username: 'Alian', password: '9ORtp9TeRX' },
  { username: 'viewer2', password: 'm3kOOLMoKP' },
  { username: 'admin123', password: 'admin123' },
  { username: 'superadmin', password: 'superadmin' },
  { username: 'viewer', password: 'viewer' },
  { username: 'test', password: 'hDAxdaLmEj' }
];

async function checkLogin(test) {
  const res = await pool.query('SELECT id, username, password_hash, role FROM users WHERE lower(username) = lower($1) LIMIT 1', [test.username]);
  if (res.rows.length === 0) return { ...test, found: false };
  const user = res.rows[0];
  const hash = user.password_hash;
  let ok = false;
  if (!hash) ok = false;
  else if (typeof hash === 'string' && hash.startsWith('$2')) {
    ok = await bcrypt.compare(test.password, hash);
  } else {
    ok = test.password === hash;
  }
  return { ...test, found: true, userId: user.id, role: user.role, ok };
}

(async () => {
  try {
    for (const t of tests) {
      const r = await checkLogin(t);
      console.log(`${t.username}: found=${r.found} ok=${r.ok} role=${r.role || '-'} id=${r.userId || '-'} `);
    }
  } catch (e) {
    console.error('Error checking logins:', e);
  } finally {
    await pool.end();
  }
})();
