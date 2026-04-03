const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 1. Definisikan fungsi REGISTER
const register = async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashed
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Definisikan fungsi LOGIN
const login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json("User tidak ditemukan");

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).json("Password salah");

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id: id } });

    if (deleted) {
      return res.status(200).json({ message: "User berhasil dihapus" });
    }
    return res.status(404).json({ error: "User tidak ditemukan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  register, 
  login, 
  deleteUser 
};