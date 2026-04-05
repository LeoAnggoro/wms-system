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
  
  // Hardcoded API URL
  const API_URL = 'https://wms-system-production-6dbe.up.railway.app';

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  // Fungsi Fetch Data Utama
 const fetchData = useCallback(async () => {
    // Ambil token langsung dari storage setiap kali fungsi dijalankan
    const currentToken = localStorage.getItem('token');
    
    console.log("--- DEBUG FETCH ---");
    console.log("Domain saat ini:", window.location.origin);
    console.log("Token yang terbaca:", currentToken ? "Ada (Mulai Fetch...)" : "KOSONG/NULL");

    if (!currentToken) {
      console.warn("Fetch dibatalkan karena token tidak ditemukan di localStorage.");
      // Jika ingin otomatis ke login kalau token hilang:
      // navigate('/login'); 
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/items`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Accept': 'application/json'
        }
      });
      let finalData = [];
      if (Array.isArray(res.data)) {
        finalData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        finalData = res.data.data;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        finalData = res.data.items;
      }

      setItems(finalData);
    } catch (err) {
      console.error("Gagal mengambil data:", err.response || err);
      if (err.response?.status === 401 || err.response?.data?.error === "Token tidak valid") {
        alert("Sesi berakhir, silakan login kembali.");
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const initialToken = localStorage.getItem('token');
    if (!initialToken) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [navigate, fetchData]);

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
    const currentToken = localStorage.getItem('token');
    if (window.confirm("Yakin ingin menghapus barang ini?")) {
      try {
        await axios.delete(`${API_URL}/api/items/${id}`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        alert("Berhasil dihapus!");
        fetchData();
      } catch (err) {
        if (err.response?.status === 401) handleLogout();
        alert("Gagal menghapus: " + (err.response?.data?.error || "Error"));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem('token'); // Pastikan token fresh
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category', formData.category);
      data.append('estimatedValue', formData.estimatedValue);
      if (imageFile) data.append('image', imageFile);

      const config = {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'multipart/form-data'//test
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

      // Reset Form
      setFormData({ name: '', category: '', estimatedValue: '' });
      setImageFile(null);
      if (document.getElementById('fileInput')) document.getElementById('fileInput').value = "";
      
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error Server";
      alert("Gagal memproses data: " + errorMsg);
      if (err.response?.status === 401) handleLogout();
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📦 WMS Inventory</h2>
        <div className="d-flex align-items-center">
          <span className="me-3 badge bg-success">Online</span>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Form Card */}
      <div className={`card mb-4 border-${editId ? 'warning' : 'primary shadow-sm'}`}>
        <div className="card-body">
          <h5 className="card-title">{editId ? ' Edit Barang' : ' Tambah Barang Baru'}</h5>
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
              <input id="fileInput" name="image" type="file" className="form-control" onChange={handleFileChange} accept="image/*" />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className={`btn w-100 ${editId ? 'btn-warning' : 'btn-primary'}`}>
                {editId ? 'Update' : 'Tambah'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Table Data */}
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
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Memuat data dari server...</td></tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.image ? (
                      <img 
                        src={`${API_URL}/uploads/${item.image}`} 
                        alt={item.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/50?text=No+Img'}
                      />
                    ) : (
                      <div className="text-muted small">No Image</div>
                    )}
                  </td>
                  <td className="fw-bold">{item.name}</td>
                  <td><span className="badge bg-light text-dark">{item.category}</span></td>
                  <td>Rp {Number(item.estimatedValue).toLocaleString('id-ID')}</td>
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
