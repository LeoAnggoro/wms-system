const { Sequelize } = require("sequelize");

let sequelizeInstance = null;

const getSequelize = () => {
  if (sequelizeInstance) return sequelizeInstance;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // --- SOLUASI TENANT SUPABASE ---
  // Kita ambil Project ID dari URL (ajrubsqxqcnblxqjmjsg)
  // Ini memastikan Supabase tahu proyek mana yang kita akses
  const projectId = "ajrubsqxqcnblxqjmjsg"; 

  sequelizeInstance = new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      },
      // Menambahkan session ID ke koneksi agar Supavisor (Pooler Supabase) tidak bingung
      // Ini adalah obat mujarab untuk error "Tenant not found"
      options: `-c user_agent=${projectId}` 
    },
    // Kita nyalakan logging agar bisa melihat proses pembuatan tabel di log Railway
    logging: (msg) => console.log(`[Sequelize]: ${msg}`), 
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    // Force agar Sequelize tidak mencoba fitur yang tidak didukung Pooler
    keepDefaultTimezone: true,
    benchmark: true
  });
  
  return sequelizeInstance;
};

const syncDatabase = async () => {
  try {
    const instance = getSequelize();
    
    // 1. Tes koneksi dulu (Handshake)
    console.log("📡 Attempting to shake hands with Supabase...");
    await instance.authenticate();
    console.log("✅ Connection to Supabase has been established successfully.");
    
    // 2. Sinkronisasi tabel (CREATE TABLE IF NOT EXISTS)
    console.log("🔄 Syncing database tables...");
    await instance.sync({ alter: true });
    console.log("✅ Database tables synced successfully");
    
    return instance;
  } catch (error) {
    console.error("❌ DATABASE CONNECTION ERROR:");
    console.error(`Message: ${error.message}`);
    
    if (error.message.includes("tenant")) {
      console.error("💡 TIP: Check your DATABASE_URL in Railway. Make sure it has 'postgres.ajrubsqxqcnblxqjmjsg' as the user.");
    }
    
    throw error;
  }
};

module.exports = { getSequelize, syncDatabase };