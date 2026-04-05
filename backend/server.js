const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { syncDatabase } = require("./config/db"); 

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// 1. Root route (Cek ini di browser untuk pastikan server online)
app.get('/', (req, res) => {
  res.json({ 
    message: "VERSI TERBARU: Server Aktif", 
    db_status: "Online" 
  });
});

console.log("-----------------------------------------");
console.log("🛠️  MEMULAI PROSES REGISTER ROUTE...");

// 2. Register Routes
try {
  const authRoutes = require("./routes/authRoutes");
  const itemRoutes = require("./routes/itemRoutes");

  app.use("/api/auth", authRoutes);
  console.log("✅ Rute /api/auth BERHASIL dimuat");

  app.use("/api/items", itemRoutes);
  console.log("✅ Rute /api/items BERHASIL dimuat");

} catch (err) {
  console.error("❌ GAGAL memuat rute. Cek folder 'routes' dan nama file!");
  console.error("Error Detail:", err.message);
}

// 3. Fungsi Start Server
const startServer = async () => {
  // Railway menggunakan variabel PORT secara dinamis
  const PORT = process.env.PORT || 5000; 
  
  try {
    console.log("📡 Sedang mencoba koneksi ke Supabase...");
    await syncDatabase();
    console.log("✅ DATABASE SYNC BERHASIL!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 SERVER TERBANG DI PORT ${PORT}`);
    });
  } catch (error) {
    console.error("🔥 SERVER GAGAL TOTAL:");
    console.error(`Pesan Error: ${error.message}`);
    process.exit(1);
  }
};

console.log("-----------------------------------------");
startServer();