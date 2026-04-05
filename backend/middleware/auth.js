const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Akses ditolak" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Token tidak valid" });
  }
};