const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testAuthenticationFix() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING AUTHENTICATION FIX');
  console.log('='.repeat(60));
  
  // Test 1: Login dengan email yang tidak terdaftar
  console.log('\n[Test 1] Login dengan email tidak terdaftar');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    console.log('❌ FAIL: Should have rejected invalid email');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ PASS: Correctly rejected with status 401');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  // Test 2: Login dengan password yang salah
  console.log('\n[Test 2] Login dengan password salah (email terdaftar)');
  try {
    // First register a user
    await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'correctpassword123'
    });
    
    // Try to login with wrong password
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'testuser@example.com',
      password: 'wrongpassword'
    });
    console.log('❌ FAIL: Should have rejected wrong password');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ PASS: Correctly rejected with status 401');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  // Test 3: Login dengan email kosong
  console.log('\n[Test 3] Login dengan email kosong');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: '',
      password: 'somepassword'
    });
    console.log('❌ FAIL: Should have rejected empty email');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ PASS: Correctly rejected with status 400');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  // Test 4: Login dengan password kosong
  console.log('\n[Test 4] Login dengan password kosong');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: ''
    });
    console.log('❌ FAIL: Should have rejected empty password');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ PASS: Correctly rejected with status 400');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  // Test 5: Login dengan format email tidak valid
  console.log('\n[Test 5] Login dengan format email tidak valid');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'invalid-email-format',
      password: 'somepassword'
    });
    console.log('❌ FAIL: Should have rejected invalid email format');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ PASS: Correctly rejected with status 400');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  // Test 6: Login yang berhasil (valid credentials)
  console.log('\n[Test 6] Login dengan credentials yang valid');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'testuser@example.com',
      password: 'correctpassword123'
    });
    if (loginRes.data.token && loginRes.data.user) {
      console.log('✅ PASS: Login successful');
      console.log('   Token received:', loginRes.data.token.substring(0, 20) + '...');
      console.log('   User:', loginRes.data.user);
    } else {
      console.log('❌ FAIL: Missing token or user in response');
    }
  } catch (err) {
    console.log('❌ FAIL: Should have accepted valid credentials');
    console.log('   Error:', err.response?.data || err.message);
  }

  // Test 7: Register dengan password terlalu pendek
  console.log('\n[Test 7] Register dengan password terlalu pendek (< 6 karakter)');
  try {
    const registerRes = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Short Password User',
      email: 'shortpwd@example.com',
      password: '12345'
    });
    console.log('❌ FAIL: Should have rejected short password');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ PASS: Correctly rejected with status 400');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  // Test 8: Register dengan format email tidak valid
  console.log('\n[Test 8] Register dengan format email tidak valid');
  try {
    const registerRes = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Invalid Email User',
      email: 'not-an-email',
      password: 'password123'
    });
    console.log('❌ FAIL: Should have rejected invalid email format');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ PASS: Correctly rejected with status 400');
      console.log('   Error message:', err.response.data.error);
    } else {
      console.log('⚠️  Unexpected response:', err.response?.status, err.response?.data);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTING COMPLETE');
  console.log('='.repeat(60));
}

testAuthenticationFix();
