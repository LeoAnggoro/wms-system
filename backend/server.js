const express = require("express");
const cors = require("cors");
require("dotenv").config();

// --- KOREKSI 1: Impor fungsi sinkronisasi database ---
const { syncDatabase } = require("./config/database"); 

const app = express();

// --- KOREKSI 2: Jalankan Koneksi Database ---
// Ini penting agar tabel dibuat/disinkronkan saat server menyala
syncDatabase()
  .then(() => console.log("✅ Database connected & synced"))
  .catch(err => console.error("❌ Database connection failed:", err));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    // Tambahkan domain Railway agar frontend & backend bisa saling bicara di production
    if(allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app') || origin.includes('netlify.app') || origin.includes('railway.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "🚀 WMS-System Backend is Active",
    status: "Healthy",
    time: new Date().toLocaleString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));

// Start server
const PORT = process.env.PORT || 5000;

// Gunakan 0.0.0.0 agar bisa diakses oleh Railway dari luar
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: https://wms-system-production-6dbe.up.railway.app/health`);
});

module.exports = app;