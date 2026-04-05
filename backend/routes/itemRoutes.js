const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const auth = require("../middleware/auth");
const upload = require('../middleware/upload');

// Rute GET untuk ambil semua data barang
// Jika kamu ingin rute ini diproteksi JWT, tambahkan middleware 'auth' sebelum async
router.get("/", async (req, res) => {
  try {
    return itemController.getItems(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, upload.single('image'), async (req, res) => {
  try {
    return itemController.createItem(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, upload.single('image'), async (req, res) => {
  try {
    return itemController.updateItem(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    return itemController.deleteItem(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;