import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: '', estimatedValue: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null); 
  
  const navigate = useNavigate(); 
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login'); 
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setItems(dataItems);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setItems([]); 
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // --- FUNGSI START EDIT (DIBUTUHKAN UNTUK BUILD) ---
  const startEdit = (item) => {
    setEditId(item.id);
    setFormData({ 
      name: item.name, 
      category: item.category, 
      estimatedValue: item.estimatedValue 
    });
    window.scrollTo(0, 0);
  };

  // --- FUNGSI HANDLE DELETE (DIBUTUHKAN UNTUK BUILD) ---
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
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = ""; 
      fetchData();
    } catch (err) {
      alert("Gagal memproses data: " + (err.response?.data?.error || "Error Server"));
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📦 WMS Inventory</h2>
        <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
      </div>

      <div className={`card mb-4 border-${editId ? 'warning' : 'primary shadow-sm'}`}>
        <div className="card-body">
          <h5 className="card-title">{editId ? '📝 Edit Barang' : '➕ Tambah Barang Baru'}</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <label htmlFor="name" className="form-label">Nama Barang</label>
              <input id="name" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <label htmlFor="category" className="form-label">Kategori</label>
              <input id="category" name="category" className="form-control" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <label htmlFor="estimatedValue" className="form-label">Harga Estimasi</label>
              <input id="estimatedValue" name="estimatedValue" type="number" className="form-control" value={formData.estimatedValue} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label htmlFor="fileInput" className="form-label">Foto Barang</label>
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
            {Array.isArray(items) && items.length > 0 ? (
              items.map((item) => (
                <tr key={item?.id || Math.random()}>
                  <td>
                    {item?.image ? (
                      <img 
                        src={`${API_URL}/uploads/${item.image}`} 
                        alt={item?.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/50?text=Error"; }}
                      />
                    ) : (
                      <div style={{ width: '50px', height: '50px', backgroundColor: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No Img</div>
                    )}
                  </td>
                  <td className="fw-bold">{item?.name || 'Unknown'}</td>
                  <td><span className="badge bg-info text-dark">{item?.category || 'Umum'}</span></td>
                  <td>Rp {Number(item?.estimatedValue || 0).toLocaleString()}</td>
                  <td className="text-center">
                    <button onClick={() => startEdit(item)} className="btn btn-sm btn-outline-warning me-2">Edit</button>
                    <button onClick={() => handleDelete(item?.id)} className="btn btn-sm btn-outline-danger">Hapus</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="text-center text-muted">Belum ada data barang.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;