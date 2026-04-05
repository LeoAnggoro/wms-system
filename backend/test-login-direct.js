// Test script untuk mengecek authentication secara langsung
// Jalankan: node test-login-direct.js

const bcrypt = require('bcrypt');

// Simulasi test tanpa database
async function testPasswordComparison() {
  console.log('='.repeat(60));
  console.log('🧪 TEST: Password Comparison Logic');
  console.log('='.repeat(60));

  // Simulasi password yang benar
  const correctPassword = 'password123';
  
  // Hash password yang benar
  const hashedPassword = await bcrypt.hash(correctPassword, 10);
  console.log('\n✅ Password benar yang di-hash:', hashedPassword.substring(0, 30) + '...');

  // Test 1: Password yang salah
  const wrongPassword = 'wrongpassword';
  const testWrong = await bcrypt.compare(wrongPassword, hashedPassword);
  console.log(`\n[Test 1] Password salah: "${wrongPassword}"`);
  console.log(`   Hasil compare: ${testWrong}`);
  console.log(`   ✅ Expected: false, Actual: ${testWrong}, ${testWrong === false ? 'PASS' : 'FAIL'}`);

  // Test 2: Password yang benar
  const testCorrect = await bcrypt.compare(correctPassword, hashedPassword);
  console.log(`\n[Test 2] Password benar: "${correctPassword}"`);
  console.log(`   Hasil compare: ${testCorrect}`);
  console.log(`   ✅ Expected: true, Actual: ${testCorrect}, ${testCorrect === true ? 'PASS' : 'FAIL'}`);

  // Test 3: Password kosong
  const testEmpty = await bcrypt.compare('', hashedPassword);
  console.log(`\n[Test 3] Password kosong: ""`);
  console.log(`   Hasil compare: ${testEmpty}`);
  console.log(`   ✅ Expected: false, Actual: ${testEmpty}, ${testEmpty === false ? 'PASS' : 'FAIL'}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST SELESAI');
  console.log('='.repeat(60));
}

// Test logic validation
function testLoginLogic() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('🧪 TEST: Login Logic Validation');
  console.log('='.repeat(60));

  // Simulasi user database
  const mockUser = {
    email: 'admin@wms.com',
    password: '$2a$10$abcdef1234567890abcdef1234567890abcdef1234567890abcd' // hashed password
  };

  // Scenario 1: User tidak ada
  const userInput1 = { email: 'unknown@email.com', password: 'anypassword' };
  const userFound1 = mockUser.email === userInput1.email;
  console.log(`\n[Scenario 1] Email tidak terdaftar: "${userInput1.email}"`);
  console.log(`   User found: ${userFound1}`);
  console.log(`   ✅ Should return: 401 Email atau password salah`);

  // Scenario 2: User ada, password salah
  const userInput2 = { email: 'admin@wms.com', password: 'wrongpassword' };
  const userFound2 = mockUser.email === userInput2.email;
  console.log(`\n[Scenario 2] User ada, password salah`);
  console.log(`   User found: ${userFound2}`);
  console.log(`   Next step: bcrypt.compare(wrongpassword, hashedPassword) → false`);
  console.log(`   ✅ Should return: 401 Email atau password salah`);

  // Scenario 3: User ada, password benar
  const userInput3 = { email: 'admin@wms.com', password: 'password123' };
  const userFound3 = mockUser.email === userInput3.email;
  console.log(`\n[Scenario 3] User ada, password benar`);
  console.log(`   User found: ${userFound3}`);
  console.log(`   Next step: bcrypt.compare(correctpassword, hashedPassword) → true`);
  console.log(`   ✅ Should return: 200 dengan token`);

  console.log('\n' + '='.repeat(60));
}

// Run tests
(async () => {
  try {
    await testPasswordComparison();
    testLoginLogic();
    
    console.log('\n📝 KESIMPULAN:');
    console.log('Jika backend code sudah benar, maka:');
    console.log('1. ❌ Email tidak terdaftar → 401 Error');
    console.log('2. ❌ Password salah → 401 Error');
    console.log('3. ✅ Email + password benar → 200 Success + Token');
    console.log('\n⚠️  Jika masih bisa login dengan credentials salah,');
    console.log('   kemungkinan penyebab:');
    console.log('   a) Server Railway belum di-restart dengan code baru');
    console.log('   b) Environment variable DATABASE_URL belum diset');
    console.log('   c) Ada route lain yang tidak melalui auth controller');
    console.log('   d) Frontend mengakses endpoint yang salah');
  } catch (err) {
    console.error('❌ Error during test:', err);
  }
})();
