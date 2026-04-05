const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken'); // 1. Cukup sekali di paling atas

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "staff"
    });

    return res.status(201).json({
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
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email & password wajib diisi" });
    }

    // 2. Cari user (Pastikan menggunakan trim agar tidak ada spasi tak sengaja)
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    
    if (!user) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    // 3. Cek password dengan bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    // 4. Generate JWT (Gunakan try-catch internal jika ragu, tapi cukup satu alur saja)
    const userId = user.id || user._id; // Sesuaikan dengan database (Sequelize biasanya .id)
    
    const token = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_SECRET || "SECRET",
      { expiresIn: "1d" }
    );

    // 5. Kirim Response Final
    return res.status(200).json({
      message: "Login berhasil",
      token: token, 
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Gagal memproses login" });
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
    return res.status(500).json({ error: "Gagal menghapus user" });
  }
};

module.exports = { 
  register, 
  login, 
  deleteUser 
};