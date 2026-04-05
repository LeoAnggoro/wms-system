import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: '', estimatedValue: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 1. Fungsi Logout
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  // 2. Fungsi Ambil Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items') 
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Gagal mengambil data:", err.message);
      if (err.message.includes("JWT") || err.message.includes("claims")) {
        alert("Sesi berakhir, silakan login kembali.");
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  // 3. Efek saat pertama kali load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        fetchData();
      }
    };
    checkUser();
  }, [navigate, fetchData]);

  // 4. Handler Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setFormData({
      name: item.name || '',
      category: item.category || '',
      estimatedValue: item.estimatedValue || ''
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus barang ini?")) {
      try {
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
        alert("Berhasil dihapus!");
        fetchData();
      } catch (err) {
        alert("Gagal menghapus: " + err.message);
      }
    }
  };

  // 5. Submit Data (Insert / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      // Logika Upload Gambar
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; // Pake Date.now agar nama unik
        const filePath = `inventory/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('inventory-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('inventory-images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData.publicUrl;
      }

      // Payload Data (Sesuaikan nama kolom kiri dengan Database kamu)
      const payload = {
        name: formData.name,
        category: formData.category,
        estimatedValue: parseFloat(formData.estimatedValue),
      };

      // Hanya update image_url jika ada gambar baru yang diupload
      if (imageUrl) {
        payload.image_url = imageUrl;
      }

      if (editId) {
        const { error } = await supabase.from('items').update(payload).eq('id', editId);
        if (error) throw error;
        alert("Data berhasil diupdate!");
      } else {
        const { error } = await supabase.from('items').insert([payload]);
        if (error) throw error;
        alert("Data berhasil ditambah!");
      }

      // Reset Form
      setEditId(null);
      setFormData({ name: '', category: '', estimatedValue: '' });
      setImageFile(null);
      if (document.getElementById('fileInput')) document.getElementById('fileInput').value = "";
      
      fetchData();
    } catch (err) {
      alert("Gagal memproses data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📦 WMS Inventory <small className="text-muted fs-6">(Supabase)</small></h2>
        <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
      </div>

      <div className={`card mb-4 border-${editId ? 'warning' : 'primary shadow-sm'}`}>
        <div className="card-body">
          <h5 className="card-title">{editId ? 'Edit Barang' : 'Tambah Barang Baru'}</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Nama Barang</label>
              <input name="name" className="form-control" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Kategori</label>
              <input name="category" className="form-control" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Harga Estimasi</label>
              <input name="estimatedValue" type="number" className="form-control" value={formData.estimatedValue} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Foto Barang</label>
              <input id="fileInput" type="file" className="form-control" onChange={handleFileChange} accept="image/*" />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className={`btn w-100 ${editId ? 'btn-warning' : 'btn-primary'}`} disabled={loading}>
                {loading ? 'Proses...' : (editId ? 'Update' : 'Tambah')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle border">
          <thead className="table-dark">
            <tr>
              <th>Foto</th>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4">Memuat data...</td></tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img 
                      src={item.image_url || 'https://via.placeholder.com/50?text=No+Img'} 
                      alt={item.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </td>
                  <td className="fw-bold">{item.name}</td>
                  <td><span className="badge bg-light text-dark">{item.category}</span></td>
                  <td>Rp {Number(item.estimatedValue || 0).toLocaleString('id-ID')}</td>
                  <td className="text-center">
                    <button onClick={() => startEdit(item)} className="btn btn-sm btn-outline-warning me-2">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-outline-danger">Hapus</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="text-center py-4 text-muted">Belum ada data barang.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;