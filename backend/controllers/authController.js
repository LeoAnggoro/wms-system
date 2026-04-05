const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    //Cek email sudah ada
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Simpan user
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "staff" // default role
    });

    //  JANGAN kirim password
    res.status(201).json({
      message: "User berhasil dibuat",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //  Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: "Email & password wajib diisi" });
    }

    // ✅ Cari user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    // Cek password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    //  Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "SECRET",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE USER =================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.destroy({ where: { id } });

    if (deleted) {
      return res.status(200).json({ message: "User berhasil dihapus" });
    }

    return res.status(404).json({ error: "User tidak ditemukan" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  register, 
  login, 
  deleteUser 
};