const express = require("express");
const cors = require("cors");
require("dotenv").config();

// PASTIKAN NAMA FILE SESUAI (db.js atau database.js)
const { syncDatabase } = require("./config/database"); 

const app = express();

// CORS Configuration - Diperketat untuk production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    // Tambahkan pengecekan domain railway secara otomatis
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

// Root route (Untuk cek apakah backend sudah live)
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
    env: process.env.NODE_ENV || 'production'
  });
});

// --- ROUTES LOGGING (Sangat membantu debugging) ---
console.log("🛣️ Registering routes...");

try {
  app.use("/api/auth", require("./routes/authRoutes"));
  console.log("✅ Route /api/auth registered");
  
  app.use("/api/items", require("./routes/itemRoutes"));
  console.log("✅ Route /api/items registered");
} catch (err) {
  console.error("❌ Gagal memuat rute:", err.message);
}

// Start server - sync database first
const startServer = async () => {
  try {
    console.log("📡 Connecting to Database...");
    await syncDatabase();
    console.log("✅ Database connected & synced");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Local Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error.message);
    // Jangan langsung exit jika di development, tapi di Railway sebaiknya exit
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
};

startServer();

module.exports = app;