const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { syncDatabase } = require("../config/db");

let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    await syncDatabase();
    dbInitialized = true;
  }
};

router.post("/register", async (req, res) => {
  try {
    await initDB();
    return authController.register(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    await initDB();
    return authController.login(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await initDB();
    return authController.deleteUser(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
