import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Pastikan file client sudah benar

const styles = {
  // ... (Gunakan styles yang sudah kamu buat, sudah sangat bagus!)
  container: {
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: '20px'
  },
  card: {
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    width: '100%',
    maxWidth: '400px',
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
    margin: '0 auto 1.5rem auto'
  },
  inputGroup: { marginBottom: '1rem' },
  input: {
    backgroundColor: '#f3f6f9',
    borderRadius: '12px',
    padding: '12px 20px',
    border: '1px solid #e1e4e8'
  },
  button: {
    borderRadius: '12px',
    padding: '12px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #4e73df, #224abe)',
    border: 'none',
    color: 'white',
    cursor: 'pointer'
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 1. Validasi Input
    if (!email || !password) {
      alert('Silakan isi email dan password.');
      return;
    }

    setLoading(true);

    try {
      // 2. Gunakan Supabase Auth (Menggantikan Axios)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      // 3. Jika Berhasil
      console.log('✅ Login berhasil:', data);
      
      // Catatan: Supabase secara otomatis menyimpan token ke LocalStorage 
      // dengan nama 'sb-xxxxx-auth-token'. Kamu tidak perlu simpan manual lagi.
      
      navigate('/dashboard');

    } catch (err) {
      console.error('❌ Login error:', err.message);
      alert('Login Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="animate-fade-in" style={styles.card}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div style={styles.iconBox}>
              <span style={{ fontSize: '2rem' }}>📦</span>
            </div>
            <h2 className="fw-bold text-primary">WMS Login</h2>
            <p className="text-muted small">Warehouse Management System (Supabase Edition)</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label className="form-label small fw-bold text-secondary">Email Address</label>
              <input
                type="email"
                className="form-control"
                style={styles.input}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label className="form-label small fw-bold text-secondary">Password</label>
              <input
                type="password"
                className="form-control"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-grid gap-2 mt-4">
              <button
                type="submit"
                className="btn"
                style={styles.button}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : 'Login Sekarang'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="small text-muted mb-0">Lupa password?</p>
            <button className="btn btn-link btn-sm text-decoration-none fw-bold shadow-none p-0">Hubungi Admin</button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Login;