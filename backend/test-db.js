const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const { getSequelize } = require('./config/db');

async function testDB() {
  try {
    console.log('🔌 Testing database connection...');
    const sequelize = getSequelize();
    
    await sequelize.authenticate();
    console.log('✅ Database connection established!');
    
    console.log('\n📋 Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced!');
    
    console.log('\n🎉 Database ready!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
}

testDB();
