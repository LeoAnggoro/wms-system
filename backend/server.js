const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 1. Sinkronisasi Database
const { syncDatabase } = require("./config/db"); 

const app = express();

app.use(cors()); 
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: "VERSI TERBARU: Server Aktif", 
    db_status: "Online" 
  });
});

console.log("-----------------------------------------");
console.log("🛠️  MEMULAI PROSES REGISTER ROUTE...");

// ... kode sebelumnya ...

try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Rute /api/auth BERHASIL dimuat");

  // Tambahkan pengecekan ini
  const itemRoutes = require("./routes/itemRoutes");
  if (itemRoutes) {
    app.use("/api/items", itemRoutes);
    console.log("✅ Rute /api/items BERHASIL dimuat");
  } else {
    console.error("❌ File itemRoutes ditemukan tapi isinya kosong!");
  }

} catch (err) {
  console.error("❌ GAGAL memuat rute:", err.message);
  // Ini penting: Jika file tidak ada, server akan kasih tahu di log Railway
}

Fungsi Start Server
const startServer = async () => {
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