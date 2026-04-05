const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const auth = require("../middleware/auth");
const upload = require('../middleware/upload');

// Rute GET untuk ambil semua data barang - WAJIB LOGIN
router.get("/", auth, itemController.getItems);
router.post("/", auth, upload.single('image'), itemController.createItem);
router.put("/:id", auth, upload.single('image'), itemController.updateItem);
router.delete("/:id", auth, itemController.deleteItem);

module.exports = router;