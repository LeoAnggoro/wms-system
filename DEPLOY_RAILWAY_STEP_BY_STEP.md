# 🚨 INSTRUKSI DEPLOY RAILWAY - STEP BY STEP DENGAN GAMBAR

## ⚠️ MASALAH SAAT INI

**Endpoint login Anda masih 404**, artinya Railway **BELUM deploy** code terbaru.

**Bukti:**
```
POST https://wms-system-production-6dbe.up.railway.app/api/auth/login
Result: 404 Not Found
```

## ✅ SOLUSI - LAKUKAN STEP INI BERURUTAN

### STEP 1: Buka Railway Dashboard

1. Buka browser
2. Ketik URL: **https://railway.app**
3. Klik **Login** (pojok kanan atas)
4. Login dengan GitHub/Google Anda

### STEP 2: Pilih Project WMS

1. Setelah login, Anda akan lihat **Dashboard** dengan daftar project
2. **KLIK** project bernama **"wms-system"** atau serupa
3. Anda akan masuk ke halaman project

### STEP 3: Cek Settings (SANGAT PENTING!)

1. Di halaman project, klik tab **"Settings"** (bukan Deployments)
2. Scroll ke bawah sampai ketemu **"Root Directory"**
3. **INI DIA MASALAHNYA!** Mungkin:
   - ❌ Kosong
   - ❌ `/`
   - ❌ `.`
   - ❌ `backend/` (ada slash)

4. **UBAH jadi:**
   ```
   backend
   ```
   **TANPA slash, TANPA titik, HANYA kata "backend"**

5. Klik **"Save"** atau **"Update"**

### STEP 4: Cek Environment Variables

1. Masih di Settings tab
2. Scroll ke **"Variables"** section
3. **PASTIKAN ada variabel ini:**
   ```
   DATABASE_URL=postgresql://postgres.xxx... (dari Supabase)
   JWT_SECRET=bebas-apa-saja-minimal-32-karakter
   NODE_ENV=production
   ```

4. **Kalau TIDAK ADA, tambahkan:**
   - Klik **"New Variable"**
   - Nama: `JWT_SECRET`
   - Value: `my-super-secret-key-12345`
   - Klik **"Add"**

### STEP 5: Force Redeploy

1. Klik tab **"Deployments"** (bukan Settings)
2. Anda akan lihat daftar deployment sebelumnya
3. Klik tombol **"..."** (menu titik tiga) di deployment terakhir
4. Pilih **"Redeploy"**
5. **CENTANG** opsi "Clear build cache" (jika ada)
6. Klik **"Confirm"** atau **"Redeploy"**

### STEP 6: Tunggu Deployment

1. Deployment akan mulai (status: "Building" atau "Deploying")
2. **TUNGGU 5-10 MENIT**
3. Jangan tutup browser!

### STEP 7: Cek Logs (SANGAT PENTING!)

1. Klik deployment yang sedang berjalan
2. Tab **"Logs"** akan muncul
3. **SCROLL ke atas** dan cari baris-baris ini:

```
==================================================
✅ SERVER STARTING...
==================================================
✅ Server running on port XXXXX
✅ Health check: http://0.0.0.0:XXXXX/
✅ Login endpoint: http://0.0.0.0:XXXXX/api/auth/login
==================================================
```

**ATAU** (kalau pakai server.js asli):

```
-----------------------------------------
🛠️  MEMULAI PROSES REGISTER ROUTE...
✅ Rute /api/auth BERHASIL dimuat
✅ Rute /api/items BERHASIL dimuat
-----------------------------------------
📡 Sedang mencoba koneksi ke Supabase...
✅ KONEKSI BERHASIL: Terhubung ke Supabase.
🚀 SERVER TERBANG DI PORT XXXXX
```

4. **WAJIB ADA** baris yang menunjukkan route berhasil dimuat!

### STEP 8: Test Endpoint

**PAKAI TOOL YANG SUDAH SAYA BUAT:**

1. Buka File Explorer
2. Navigate ke:
   ```
   C:\Users\leoan\Desktop\wms-system-main\
   ```
3. **Double-click** file: **`quick-test.html`**
4. File akan terbuka di browser
5. Klik tombol **"Test Login Endpoint"**

**HASIL YANG DIHARAPKAN:**

✅ **BERHASIL** jika muncul:
```
✅ ENDPOINT ADA!
Status: 405 (Method Not Allowed)
```

❌ **GAGAL** jika muncul:
```
❌ ENDPOINT TIDAK ADA!
Status: 404 (Not Found)
```

### STEP 9: Kalau MASIH 404

Jika setelah semua step di atas masih 404:

**OPTION A: Deploy Ulang dari Awal**

1. Di Railway Dashboard
2. Tab "Settings"
3. Scroll ke paling bawah
4. Klik **"Delete Service"** (MERAH!)
5. Ketik nama service untuk konfirmasi
6. Klik **"Delete"**
7. **TUNGGU 1 MENIT**
8. Klik **"New Project"**
9. Pilih **"GitHub Repo"**
10. Pilih repo: `LeoAnggoro/wms-system`
11. Di Settings, set **Root Directory = `backend`**
12. Deploy!

**OPTION B: Manual Deploy via CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate ke folder backend
cd C:\Users\leoan\Desktop\wms-system-main\backend

# Deploy manual
railway init
railway up
```

## 📋 CHECKLIST - PASTIKAN SEMUA SUDAH BENAR

- [ ] Root Directory di Settings = **`backend`** (tanpa slash)
- [ ] Environment variable JWT_SECRET sudah diset
- [ ] Environment variable DATABASE_URL sudah diset
- [ ] Deployment berhasil (status "Success", bukan "Failed")
- [ ] Logs menunjukkan "Rute /api/auth BERHASIL dimuat"
- [ ] Test di quick-test.html menunjukkan "ENDPOINT ADA"

## 🎯 TROUBLESHOOTING

### Masalah: Deployment Failed

**Solusi:**
1. Cek Logs untuk error message
2. Biasanya karena DATABASE_URL salah → Cek di Supabase
3. Atau dependency missing → Cek package.json ada

### Masalah: Logs tidak ada baris route

**Solusi:**
1. Root directory mungkin salah → Harus `backend`
2. Server mungkin crash sebelum route ter-load
3. Cek logs dari awal untuk lihat error

### Masalah: quick-test.html masih 404

**Solusi:**
1. Clear browser cache: Ctrl + Shift + Delete
2. Tunggu 2-3 menit lagi (deploy mungkin belum selesai)
3. Redeploy sekali lagi

## 💡 TIP PENTING

**Root Directory adalah masalah #1 kenapa deploy gagal!**

- ✅ BENAR: `backend`
- ❌ SALAH: `/backend`, `backend/`, `.`, `/`, `` (kosong)

---

**SEKARANG LAKUKAN STEP 1-9 DI ATAS!**

Setelah selesai, screenshot hasil dari:
1. Railway Settings (bagian Root Directory)
2. Railway Logs (baris route)
3. quick-test.html (status endpoint)
