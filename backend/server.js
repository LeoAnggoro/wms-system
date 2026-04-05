const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { syncDatabase } = require("./config/db"); 

const app = express();

// Middleware
// Tambahkan konfigurasi CORS yang lebih spesifik jika perlu, 
// tapi app.use(cors()) sudah cukup untuk fase development.
app.use(cors()); 
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// 1. Root route (Cek ini di browser: https://wms-system-production-6dbe.up.railway.app/)
app.get('/', (req, res) => {
  res.json({ 
    message: "VERSI TERBARU: Server Aktif", 
    db_status: "Online",
    timestamp: new Date().toISOString()
  });
});

console.log("-----------------------------------------");
console.log("🛠️  MEMULAI PROSES REGISTER ROUTE...");

// 2. Register Routes dengan Pengecekan Eksistensi
try {
  // Pastikan nama file di folder './routes/' benar-benar 'authRoutes.js' dan 'itemRoutes.js'
  // Linux (Railway) sangat sensitif terhadap huruf besar/kecil (Case Sensitive)
  const authRoutes = require("./routes/authRoutes");
  const itemRoutes = require("./routes/itemRoutes");

  app.use("/api/auth", authRoutes);
  console.log("✅ Rute /api/auth BERHASIL dimuat");

  app.use("/api/items", itemRoutes);
  console.log("✅ Rute /api/items BERHASIL dimuat");

} catch (err) {
  console.error("❌ GAGAL MEMUAT RUTE!");
  console.error("Kemungkinan penyebab: Nama file salah (Besar/Kecil) atau ada error di dalam file rute.");
  console.error("Error Detail:", err.message);
  // Kita tidak process.exit(1) di sini agar server tetap nyala dan kita bisa debug root-nya
}

// 3. Fungsi Start Server
const startServer = async () => {
  // Railway memberikan port lewat process.env.PORT secara dinamis
  const PORT = process.env.PORT || 5000; 
  
  try {
    console.log("📡 Sedang mencoba koneksi ke Supabase...");
    // Memastikan tabel 'Items' dan 'Users' sinkron dengan Supabase
    await syncDatabase();
    console.log("✅ DATABASE SYNC BERHASIL!");

    // Binding ke '0.0.0.0' sangat penting untuk deployment cloud seperti Railway
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 SERVER TERBANG DI PORT ${PORT}`);
      console.log(`🔗 Akses API di: http://0.0.0.0:${PORT}/api/items`);
    });
  } catch (error) {
    console.error("🔥 SERVER GAGAL TOTAL SAAT BOOTING:");
    console.error(`Pesan Error: ${error.message}`);
    process.exit(1);
  }
};

console.log("-----------------------------------------");
startServer();