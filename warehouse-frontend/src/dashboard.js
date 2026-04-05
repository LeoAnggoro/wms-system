import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: '', estimatedValue: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null); 
  const [loading, setLoading] = useState(true); 
  
  const navigate = useNavigate(); 
  const token = localStorage.getItem('token');

  // KOREKSI: Pastikan URL API benar-benar menunjuk ke Railway
  const API_URL = 'https://wms-system-production-6dbe.up.railway.app';

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      handleLogout();
    }
  }, [token, handleLogout]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log("Memanggil API ke:", `${API_URL}/api/items`);
      
      const res = await axios.get(`${API_URL}/api/items`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json' // PAKSA server kirim JSON, bukan HTML
        }
      });

      // Validasi apakah data yang datang benar-benar Array atau Object yang punya data
      let finalData = [];
      if (Array.isArray(res.data)) {
        finalData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        finalData = res.data.data;
      }

      setItems(finalData);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      // Jika res.data berisi HTML (doctype), axios akan error di parsing JSON
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        await axios.delete(`${API_URL}/api/items/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Berhasil dihapus!");
        fetchData();
      } catch (err) {
        alert("Gagal menghapus: " + (err.response?.data?.error || "Error"));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category', formData.category);
      data.append('estimatedValue', formData.estimatedValue);
      if (imageFile) data.append('image', imageFile);

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        } 
      };

      if (editId) {
        await axios.put(`${API_URL}/api/items/${editId}`, data, config);
        alert("Data berhasil diupdate!");
        setEditId(null);
      } else {
        await axios.post(`${API_URL}/api/items`, data, config);
        alert("Data berhasil ditambah!");
      }

      setFormData({ name: '', category: '', estimatedValue: '' });
      setImageFile(null);
      if (document.getElementById('fileInput')) document.getElementById('fileInput').value = ""; 
      
      fetchData();
    } catch (err) {
      alert("Gagal memproses data: " + (err.response?.data?.error || "Error Server"));
    }
  };

  return (
    <div className="container mt-4 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">📦 WMS Inventory</h2>
        <div className="d-flex align-items-center">
          <span className="me-3 badge bg-success p-2">Server Online</span>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className={`card mb-4 ${editId ? 'border-warning shadow' : 'border-0 shadow-sm'}`}>
        <div className="card-body">
          <h5 className="card-title fw-bold mb-3">
            {editId ? '📝 Edit Barang' : '➕ Tambah Barang Baru'}
          </h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <label className="form-label small fw-bold">Nama Barang</label>
              <input name="name" className="form-control" value={formData.name} onChange={handleChange} required placeholder="Contoh: Laptop" />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold">Kategori</label>
              <input name="category" className="form-control" value={formData.category} onChange={handleChange} required placeholder="Elektronik" />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold">Harga Estimasi (Rp)</label>
              <input name="estimatedValue" type="number" className="form-control" value={formData.estimatedValue} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Foto Barang</label>
              <input id="fileInput" name="image" type="file" className="form-control" onChange={handleFileChange} accept="image/*" />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className={`btn w-100 fw-bold ${editId ? 'btn-warning' : 'btn-primary'}`}>
                {editId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Foto</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><br/>Menghubungkan ke API...</td></tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-3">
                      {item.image ? (
                        <img 
                          src={`${API_URL}/uploads/${item.image}`} 
                          alt={item.name} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/50?text=No+Img'}
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '8px' }}>🖼️</div>
                      )}
                    </td>
                    <td className="fw-bold">{item.name}</td>
                    <td><span className="badge bg-info text-dark">{item.category}</span></td>
                    <td className="fw-semibold">Rp {Number(item.estimatedValue).toLocaleString('id-ID')}</td>
                    <td className="text-center">
                      <button onClick={() => startEdit(item)} className="btn btn-sm btn-link text-warning me-2 text-decoration-none">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-link text-danger text-decoration-none">Hapus</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Data kosong atau Token kedaluwarsa.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;