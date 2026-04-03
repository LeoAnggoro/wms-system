const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const auth = require("../middleware/auth");
const upload = require('../middleware/upload');
const { syncDatabase } = require("../config/db");

let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    await syncDatabase();
    dbInitialized = true;
  }
};

router.get("/", auth, async (req, res) => {
  try {
    await initDB();
    return itemController.getItems(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, upload.single('image'), async (req, res) => {
  try {
    await initDB();
    return itemController.createItem(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, upload.single('image'), async (req, res) => {
  try {
    await initDB();
    return itemController.updateItem(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await initDB();
    return itemController.deleteItem(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
