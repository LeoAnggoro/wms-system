const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Ambil token dari header
  if (!token) return res.status(401).json("Akses ditolak");

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Di sini req.user diisi data dari token
    next();
  } catch (err) {
    res.status(400).json("Token tidak valid");
  }
};