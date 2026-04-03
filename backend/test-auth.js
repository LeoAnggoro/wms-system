const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const axios = require('axios');

const API_URL = 'https://wms-system-production-6dbe.up.railway.app';

async function testAuth() {
  try {
    console.log('📝 REGISTER...');
    const registerRes = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Register success:', registerRes.data);

    console.log('\n🔐 LOGIN...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login success:', loginRes.data);
    const token = loginRes.data.token;

    console.log('\n📦 GET ITEMS (with auth)...');
    const itemsRes = await axios.get(`${API_URL}/api/items`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Items:', itemsRes.data);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testAuth();
