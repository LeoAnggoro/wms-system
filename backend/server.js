const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 1. Pastikan path ini benar! Jika file kamu namanya database.js, gunakan database
const { syncDatabase } = require("./config/database"); 

const app = express();

app.use(cors()); // Buka dulu untuk semua origin selama debugging
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Root route - Cek apakah kodingan baru sudah naik
app.get('/', (req, res) => {
  res.json({ 
    message: "VERSI TERBARU: Server Aktif", 
    db_status: "Checking..." 
  });
});

// Logging Route Manual
console.log("-----------------------------------------");
console.log("🛠️  MEMULAI PROSES REGISTER ROUTE...");

try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Rute /api/auth BERHASIL dimuat");
} catch (err) {
  console.error("❌ GAGAL memuat rute auth:", err.message);
}

// 2. Fungsi Start Server yang lebih ketat
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  try {
    console.log("📡 Sedang mencoba koneksi ke Supabase...");
    
    // Tunggu database sampai benar-benar siap
    await syncDatabase();
    
    console.log("✅ DATABASE SYNC BERHASIL!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 SERVER TERBANG DI PORT ${PORT}`);
      console.log(`🔗 Cek Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("🔥 SERVER GAGAL TOTAL:");
    console.error(`Pesan Error: ${error.message}`);
    // Jangan biarkan server menggantung, matikan agar Railway restart
    process.exit(1);
  }
};

console.log("-----------------------------------------");
startServer();