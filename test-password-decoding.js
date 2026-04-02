require('dotenv').config();

// Test if passwords are base64 encoded
const passwords = ['c2SPUuIfSm', 'eMrYk8ffFQ', 'keqqtd9Gks'];

passwords.forEach(pwd => {
  try {
    const decoded = Buffer.from(pwd, 'base64').toString('utf8');
    console.log(`Password: ${pwd} -> Base64 decoded: "${decoded}"`);
  } catch (error) {
    console.log(`Password: ${pwd} -> Not valid base64`);
  }
});

// Test common passwords that might match
const commonPasswords = ['test', 'password', 'admin', 'viewer', 'ibaan', 'ibaan.viewer1', '123456', 'password123'];

console.log('\nTesting common password matches:');
passwords.forEach(storedPwd => {
  const matches = commonPasswords.filter(common => common === storedPwd);
  if (matches.length > 0) {
    console.log(`✅ Found match: ${storedPwd}`);
  }
});

if (passwords.every(pwd => !commonPasswords.includes(pwd))) {
  console.log('❌ No common password matches found');
  console.log('The passwords appear to be hashed or encoded, but auth.ts expects plain text comparison');
}
