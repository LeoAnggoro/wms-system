const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // 1. Ambil token dari header 'Authorization'
  const authHeader = req.header("Authorization");
  
  // Format biasanya: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Jika tidak ada token, tolak akses
  if (!token) {
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    // 3. Verifikasi token menggunakan secret key (pastikan sama dengan saat login)
    // Gunakan 'secret' sebagai default jika di .env belum ada
    const verified = jwt.verify(token, process.env.JWT_SECRET || "secret");
    
    // 4. Simpan data user yang terverifikasi ke dalam request
    req.user = verified;
    
    // 5. Lanjut ke controller
    next();
  } catch (err) {
    res.status(400).json({ error: "Token tidak valid atau sudah kadaluarsa" });
  }
};