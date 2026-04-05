const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", async (req, res) => {
  try {
    return authController.register(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    return authController.login(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    return authController.deleteUser(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;