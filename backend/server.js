const express = require("express");
const cors = require("cors");
const path = require("path"); // Tambahkan ini untuk path static
require("dotenv").config();

// SESUAIKAN PATH: Tambahkan './backend/'
const { syncDatabase } = require("./backend/config/db"); 

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

// Path uploads juga harus diarahkan ke dalam folder backend jika folder uploads ada di sana
app.use("/uploads", express.static(path.join(__dirname, "backend/uploads")));

app.get('/', (req, res) => {
  res.json({ 
    message: "VERSI TERBARU: Server Aktif", 
    folder_structure: "Root -> Backend Folder",
    timestamp: new Date().toISOString()
  });
});

console.log("-----------------------------------------");
console.log("🛠️  MEMULAI PROSES REGISTER ROUTE...");

try {
  // PERBAIKAN UTAMA: Tambahkan './backend/' sebelum nama folder
  const authRoutes = require("./backend/routes/authRoutes");
  const itemRoutes = require("./backend/routes/itemRoutes");

  app.use("/api/auth", authRoutes);
  console.log("✅ Rute /api/auth BERHASIL dimuat");

  app.use("/api/items", itemRoutes);
  console.log("✅ Rute /api/items BERHASIL dimuat");

} catch (err) {
  console.error("❌ GAGAL MEMUAT RUTE!");
  console.error("DETAIL ERROR:", err.message);
  console.error("STACK TRACE:", err.stack); 
}

const startServer = async () => {
  const PORT = process.env.PORT || 5000; 
  
  try {
    console.log("📡 Menghubungkan ke Database...");
    await syncDatabase();
    console.log("✅ DATABASE SYNC BERHASIL!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 SERVER TERBANG DI PORT ${PORT}`);
    });
  } catch (error) {
    console.error("🔥 BOOTING GAGAL:");
    console.error(error.message);
    process.exit(1);
  }
};

console.log("-----------------------------------------");
startServer();