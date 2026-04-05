const { Sequelize } = require("sequelize");

let sequelizeInstance = null;

const getSequelize = () => {
  if (sequelizeInstance) return sequelizeInstance;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set di Railway');
  }
const payload = {
  name: formData.name,
  category: formData.category,
  estimated_value: parseFloat(formData.estimatedValue), // Kiri (DB), Kanan (State React)
  image_url: imageUrl
};
  // Project ID Supabase kamu
  const projectId = "ajrubsqxqcnblxqjmjsg"; 

  sequelizeInstance = new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Wajib untuk koneksi cloud ke Supabase
      },
      // --- PENYELAMAT KONEKSI ---
      prepareThreshold: 0, // WAJIB: Agar tidak error "prepared statement" di Pooler 6543
      options: `-c user_agent=${projectId}` // Agar Supabase tidak bingung "Tenant not found"
    },
    logging: (msg) => console.log(`[Sequelize]: ${msg}`), 
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    keepDefaultTimezone: true,
    benchmark: true
  });
  
  return sequelizeInstance;
};

const syncDatabase = async () => {
  try {
    const instance = getSequelize();
    
    console.log(" Mencoba 'menghubungkan' dengan Supabase...");
    await instance.authenticate();
    console.log(" KONEKSI BERHASIL: Terhubung ke Supabase.");
    
    console.log("🔄 Sinkronisasi Tabel (Syncing)...");
    await instance.sync({ alter: true });
    console.log("SEMUA TABEL SIAP: Database sinkron.");
    
    return instance;
  } catch (error) {
    console.error(" DATABASE CONNECTION ERROR:");
    console.error(`Pesan: ${error.message}`);
    
    if (error.message.includes("tenant")) {
      console.error("💡 TIPS: Pastikan DATABASE_URL di Railway pakai port 6543 dan user 'postgres.ajrubsqxqcnblxqjmjsg'");
    }
    
    throw error;
  }
};


module.exports = { getSequelize, syncDatabase };