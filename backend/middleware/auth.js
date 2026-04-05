const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Ambil token dari header Authorization
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    // Verifikasi token
    const verified = jwt.verify(token, process.env.JWT_SECRET || "SECRET");
    req.user = verified;
    next(); // Lanjut ke controller
  } catch (err) {
    // Cek apakah token expired atau memang tidak valid
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token sudah kadaluarsa, silakan login kembali" });
    }
    return res.status(401).json({ error: "Token tidak valid" });
  }
};