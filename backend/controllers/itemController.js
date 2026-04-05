const Item = require("../models/Item");
const User = require("../models/user");

//TAMBAH BARANG (DENGAN UPLOAD GAMBAR)
exports.createItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Anda harus login terlebih dahulu" });
    }

    // Ambil nama file dari multer (jika ada)
    const imagePath = req.file ? req.file.filename : null;

    const item = await Item.create({
      name: req.body.name,
      category: req.body.category,
      estimatedValue: req.body.estimatedValue,
      image: imagePath, // Menyimpan nama file ke kolom image
      createdBy: req.user.id 
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//AMBIL SEMUA BARANG
exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [
        { 
          model: User, 
          as: "owner", 
          attributes: ["name", "email"] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE DATA BARANG
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, estimatedValue } = req.body;
    
    // Jika ingin update gambar juga, bisa tambahkan logic req.file di sini
    const updateData = { name, category, estimatedValue };
    if (req.file) {
        updateData.image = req.file.filename;
    }

    const [updatedRows] = await Item.update(
      updateData,
      { where: { id: id } }
    );

    if (updatedRows > 0) {
      const updatedItem = await Item.findByPk(id);
      res.json({ message: "Barang berhasil diperbarui!", data: updatedItem });
    } else {
      res.status(404).json({ error: "Barang tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//HAPUS DATA BARANG
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);
    
    if (!item) {
      return res.status(404).json({ error: "Barang tidak ditemukan" });
    }

    await item.destroy();
    res.json({ message: "Barang berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
