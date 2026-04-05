const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log("=".repeat(50));
console.log("✅ SERVER STARTING...");
console.log("=".repeat(50));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "WMS Server Active",
    version: "2.0",
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working!" });
});

// Auth routes - SIMPEL DULU
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt:", email);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email & password required" });
    }
    
    // Import model di dalam route (lazy load)
    const User = require("./models/user");
    const bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");
    
    // Cari user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ error: "Email atau password salah" });
    }
    
    // Cek password
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      console.log("Wrong password for:", email);
      return res.status(401).json({ error: "Email atau password salah" });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "SECRET",
      { expiresIn: "1d" }
    );
    
    console.log("Login success:", email);
    
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    
    const User = require("./models/user");
    const bcrypt = require("bcrypt");
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "staff"
    });
    
    res.status(201).json({
      message: "User created",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Items routes (placeholder)
app.get('/api/items', (req, res) => {
  res.json({ items: [] });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/`);
  console.log(`✅ Login endpoint: http://0.0.0.0:${PORT}/api/auth/login`);
  console.log("=".repeat(50));
});
