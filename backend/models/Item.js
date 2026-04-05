import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

const Dashboard = () => {
  // Pastikan inisialisasi selalu array kosong []
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
      
      // PROTEKSI: Pastikan data yang masuk adalah array
      // Jika Backend mengirim { status: 200, data: [...] }, kamu harus pakai res.data.data
      const dataItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setItems(dataItems);
      
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setItems([]); // Set kosong agar tidak crash
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ... (fungsi handleChange, handleFileChange, handleSubmit, handleDelete tetap sama)

  return (
    <div className="container mt-4">
      {/* ... bagian header dan form ... */}
      
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
            {/* PROTEKSI: Gunakan Array.isArray sebelum .map */}
            {Array.isArray(items) && items.length > 0 ? (
              items.map((item) => (
                <tr key={item?.id || Math.random()}>
                  <td>
                    {item?.image ? (
                      <img 
                        src={`${API_URL}/uploads/${item.image}`} 
                        alt={item?.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                        // Tambahkan ini agar jika gambar error tidak merusak layout
                        onError={(e) => { e.target.src = "https://via.placeholder.com/50?text=Error"; }}
                      />
                    ) : (
                      <div style={{ width: '50px', height: '50px', backgroundColor: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No Img</div>
                    )}
                  </td>
                  <td className="fw-bold">{item?.name || 'Unknown'}</td>
                  <td><span className="badge bg-info text-dark">{item?.category || 'Umum'}</span></td>
                  <td>
                    {/* PROTEKSI: toLocaleString bisa crash kalau datanya null/teks */}
                    Rp {Number(item?.estimatedValue || 0).toLocaleString()}
                  </td>
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