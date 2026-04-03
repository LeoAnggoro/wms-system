import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 1. Tentukan Object Styles DI LUAR Komponen (agar rapi dan tidak error)
const styles = {
  container: {
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',       // Menengah Vertikal
    justifyContent: 'center',    // Menengah Horizontal
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: '20px'
  },
  card: {
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    width: '100%',
    maxWidth: '400px',           // Membatasi lebar agar proporsional
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  },
  iconBox: {
    background: '#e7f0ff',
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem auto' // Memberi jarak bawah agar tidak menempel
  },
  inputGroup: {
    marginBottom: '1rem'         // Memberi jarak antar input group agar rapi
  },
  input: {
    backgroundColor: '#f3f6f9',
    borderRadius: '12px',
    padding: '12px 20px',
    transition: 'all 0.3s'
  },
  button: {
    borderRadius: '12px',
    padding: '12px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #4e73df, #224abe)',
    border: 'none',
    transition: 'transform 0.2s'
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      navigate('/dashboard'); 
    } catch (err) {
      const pesanError = err.response?.data?.error || "Koneksi ke server gagal!";
      alert("Login Gagal: " + pesanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="container animate-fade-in d-flex justify-content-center">
        {/* Gunakan shadow-sm atau shadow-lg bawaan Bootstrap */}
        <div className="card shadow border-0" style={styles.card}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div style={styles.iconBox}>
                <span style={{ fontSize: '2rem' }}>📦</span>
              </div>
              <h2 className="fw-bold text-primary">WMS Login</h2>
              <p className="text-muted small">Warehouse Management System</p>
            </div>
            
            <form onSubmit={handleLogin}>
              {/* Grup Email Address */}
              <div style={styles.inputGroup}>
                <label className="form-label small fw-bold text-secondary">Email Address</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg border-0 shadow-sm"
                  placeholder="name@company.com" 
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              {/* Grup Password */}
              <div style={styles.inputGroup}>
                <label className="form-label small fw-bold text-secondary">Password</label>
                <input 
                  type="password" 
                  className="form-control form-control-lg border-0 shadow-sm"
                  placeholder="••••••••" 
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              {/* Tombol Login */}
              <div className="d-grid gap-2 mt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg shadow-sm" 
                  style={styles.button}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : null}
                  {loading ? 'Authenticating...' : 'Login Sekarang'}
                </button>
              </div>
            </form>

            <div className="text-center mt-4">
              <p className="small text-muted mb-0">Lupa password?</p>
              {/* Pastikan style tombol link benar */}
              <button className="btn btn-link btn-sm text-decoration-none fw-bold shadow-none p-0">Hubungi Admin IT</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animasi FadIn sederhana */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        /* Efek hover tombol */
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
};

export default Login;