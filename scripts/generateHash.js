const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('');
  console.log('=====================================');
  console.log('Password: admin123');
  console.log('');
  console.log('Hash (copy this entire line):');
  console.log(hash);
  console.log('=====================================');
  console.log('');
}

generateHash();