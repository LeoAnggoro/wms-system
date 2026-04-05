# 🔴 INSTRUKSI FIX BACKEND RAILWAY - URL: 6dbe

## 📍 ARSITEKTUR ANDA

Anda punya 2 deployment terpisah:

| Service | URL | Status |
|---------|-----|--------|
| **Backend (API)** | `https://wms-system-production-6dbe.up.railway.app` | ❌ Route login 404 |
| **Frontend (Web)** | `https://wms-system-production-f450.up.railway.app` | ✅ Running |

Frontend Anda sudah pointing ke backend yang benar (`6dbe`), tapi backendnya **BELUM UPDATE**.

## 🔍 BUKTI BACKEND BELUM UPDATE

```
POST https://wms-system-production-6dbe.up.railway.app/api/auth/login
Result: 404 Not Found ❌

GET https://wms-system-production-6dbe.up.railway.app/
Result: {"message": "VERSI TERBARU: Server Aktif"} ✅
```

Artinya:
- ✅ Server backend RUNNING
- ❌ Route `/api/auth/login` BELUM ADA

## ✅ SOLUSI - LAKUKAN DI BACKEND PROJECT (6dbe)

### STEP 1: Buka Railway Dashboard

1. Buka browser → https://railway.app
2. Login
3. Anda akan lihat dashboard dengan **MULTIPLE PROJECTS**

### STEP 2: Pilih Project BACKEND (BUKAN yang frontend)

**CARI project yang URL-nya:**
```
wms-system-production-6dbe.up.railway.app
```

**JANGAN pilih yang:**
```
wms-system-production-f450.up.railway.app
```

**Cara membedakan:**
- Klik satu per satu project
- Lihat di overview, harusnya ada URL `6dbe`
- Atau nama project-nya ada kata "backend" atau "api"

### STEP 3: Setelah masuk project backend (6dbe), klik "Settings"

1. Tab **Settings** (bukan Deployments!)
2. Scroll cari **Root Directory**

### STEP 4: Set Root Directory

**INI MASALAH UTAMA!**

Root Directory harus diisi dengan:
```
backend
```

**BUKAN:**
- ❌ (kosong)
- ❌ `/`
- ❌ `.`
- ❌ `backend/`
- ❌ `warehouse-frontend`

**HANYA:**
```
backend
```

### STEP 5: Save

Klik tombol **Save** atau **Update**

### STEP 6: Redeploy

1. Klik tab **Deployments**
2. Klik tombol **..."** (titik tiga) di deployment terakhir
3. Pilih **"Redeploy"**
4. Jika ada opsi, centang **"Clear build cache"**
5. Klik **Confirm**

### STEP 7: Tunggu 5-10 Menit

Deployment akan berjalan. **JANGAN tutup browser!**

### STEP 8: Cek Logs

1. Klik deployment yang sedang berjalan
2. Tab **Logs**
3. **SCROLL** dan cari baris ini:

```
✅ Rute /api/auth BERHASIL dimuat
```

**ATAU**

```
Server running on port
Login endpoint: http://0.0.0.0:XXXX/api/auth/login
```

**BARIS INI WAJIB ADA!**

### STEP 9: Test Endpoint

**Buka browser tab baru, test manual:**

1. Buka `test-production-login.html` (dari folder project)
2. Di file tersebut, **UBAH** URL API:
   ```javascript
   // GANTI URL DI BARIS INI:
   const API_URL = 'https://wms-system-production-6dbe.up.railway.app';
   ```
3. Save file
4. Buka di browser
5. Klik "Test Login Salah"
6. Harusnya: **✅ 401 Unauthorized** (bukan 404)

## 📋 CHECKLIST

- [ ] Pilih project backend yang URL-nya `6dbe` (BUKAN `f450`)
- [ ] Root Directory = `backend`
- [ ] Save settings
- [ ] Redeploy
- [ ] Logs ada "Rute /api/auth BERHASIL dimuat"
- [ ] Test endpoint login → Status 401 atau 200 (bukan 404)

## 🧪 TEST SETELAH DEPLOY

### Test 1: User tidak ada (harus 401)
```
POST https://wms-system-production-6dbe.up.railway.app/api/auth/login
Body: {"email":"test@example.com","password":"wrong"}

Expected: 401 {"error":"Email atau password salah"}
```

### Test 2: User valid (harus 200)
```
POST https://wms-system-production-6dbe.up.railway.app/api/auth/login
Body: {"email":"[email dari Supabase]","password":"[password benar]"}

Expected: 200 {"token":"...","user":{...}}
```

### Test 3: Test dari Frontend
1. Buka: `https://wms-system-production-f450.up.railway.app`
2. Login dengan credentials valid
3. Harusnya bisa masuk dashboard

## ⚠️ JIKA MASIH 404 SETELAH REDEPLOY

**Option A: Delete & Recreate Service**

1. Railway Dashboard → Project backend (6dbe)
2. Settings → Scroll paling bawah
3. Klik **"Delete Service"** (MERAH!)
4. Ketik nama untuk konfirmasi
5. Delete
6. Tunggu 1 menit
7. Klik **"New Project"**
8. Pilih **"GitHub Repo"**
9. Pilih: `LeoAnggoro/wms-system`
10. Settings → Root Directory = `backend`
11. Add environment variables:
    - `DATABASE_URL` (dari Supabase)
    - `JWT_SECRET=bebas-apa-saja`
    - `NODE_ENV=production`
12. Deploy!

**Option B: Deploy Manual via CLI**

```bash
npm install -g @railway/cli
railway login
cd C:\Users\leoan\Desktop\wms-system-main\backend
railway link (pilih project yang 6dbe)
railway up
```

## 📞 INFO TAMBAHAN

**File yang sudah benar di GitHub:**
- ✅ `backend/controllers/authController.js` - Status 401 sudah benar
- ✅ `backend/routes/authRoutes.js` - Route sudah benar
- ✅ `backend/server.js` - Routes sudah di-load
- ✅ `warehouse-frontend/src/Login.js` - Validasi sudah benar

**Masalahnya HANYA:** Railway belum deploy code terbaru ke backend `6dbe`

---

**SEKARANG LAKUKAN STEP 1-9 DI ATAS!**
